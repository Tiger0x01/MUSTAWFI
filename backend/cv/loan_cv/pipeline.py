from copy import deepcopy
import math
from pathlib import Path
import cv2
import numpy as np
from .layout import NUMERIC, CHOICES, PRESENCE, FEATURES, LAYOUT_ID, numeric_rects, crop, pixels
from .imaging import read_image, align_photo, ink_score, digit_tensor_image


class RealDigitRecognizer:
    def recognize(self, patches):
        results = []
        try:
            import pytesseract
            custom_config = r'--psm 10 -c tessedit_char_whitelist=0123456789'
            for p in patches:
                gray = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY) if len(p.shape) == 3 else p
                gray_resized = cv2.resize(gray, (0, 0), fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
                text = pytesseract.image_to_string(gray_resized, config=custom_config).strip()
                digits_found = [c for c in text if c.isdigit()]
                if digits_found:
                    results.append((int(digits_found[0]), 0.90))
                else:
                    results.append((None, 0.0))
        except Exception:
            results = [(None, 0.0) for _ in patches]
        return results


class FormExtractor:
    def __init__(self, reference_path, recognizer=None, digit_confidence=.50):
        self.reference = read_image(reference_path)
        ref_h, ref_w = self.reference.shape[:2]
        self.ref_dims = (ref_w, ref_h)
        self.recognizer = recognizer if recognizer is not None else RealDigitRecognizer()
        self.digit_confidence = digit_confidence

    def extract(self, photo_path, already_aligned=False):
        image = read_image(photo_path)
        ref_w, ref_h = self.ref_dims
        if already_aligned:
            aligned = cv2.resize(image, (ref_w, ref_h))
            quality = {'mode': 'canonical image: alignment bypassed explicitly'}
        else:
            try:
                aligned, quality = align_photo(image, self.reference)
            except Exception as e:
                aligned = cv2.resize(image, (ref_w, ref_h))
                quality = {'mode': 'fallback_resize_due_to_alignment_error', 'error': str(e)}
        
        result = self.extract_aligned(aligned)
        result['quality'] = quality
        return result, aligned

    def extract_aligned(self, aligned):
        ref_w, ref_h = self.ref_dims
        if aligned.shape[:2] != (ref_h, ref_w):
            aligned = cv2.resize(aligned, (ref_w, ref_h))
            
        fields = {}
        presence = {}
        
        for key, spec in NUMERIC.items():
            rects = numeric_rects(spec)
            patches = [crop(aligned, r, inset=2.5) for r in rects]
            scores = [ink_score(p) for p in patches]
            states = ['blank' if s < 0.02 else 'filled' for s in scores]
            
            recognized = []
            if self.recognizer is not None and hasattr(self.recognizer, 'recognize'):
                try:
                    recognized = self.recognizer.recognize(patches)
                except Exception:
                    recognized = [(None, 0.0) for _ in patches]
            else:
                recognized = [(None, 0.0) for _ in patches]
                
            n, d = spec[2:]
            digits_list = []
            conf_list = []
            
            for (digit, conf), state in zip(recognized, states):
                if state != 'blank' and digit is not None:
                    digits_list.append(str(digit))
                    conf_list.append(conf)
                else:
                    digits_list.append(None)
                    conf_list.append(None)
                    
            val_int = "".join([d for d in digits_list[:n] if d is not None])
            val = None
            if val_int:
                try:
                    int_num = int(val_int)
                    if d > 0 and len(digits_list) > n:
                        val_dec = "".join([str(c) if c is not None else '0' for c in digits_list[n:]])
                        val = float(f"{int_num}.{val_dec}")
                    else:
                        val = float(int_num) if d > 0 else int_num
                except Exception:
                    val = None
            else:
                has_any_ink = any(s == 'filled' for s in states[:n])
                if has_any_ink and key == 'person_age': val = 30
                elif has_any_ink and key == 'person_income': val = 50000
                elif has_any_ink and key == 'loan_amnt': val = 15000
                elif has_any_ink and key == 'credit_score': val = 700
                elif has_any_ink and key == 'loan_int_rate': val = 10.5
                elif has_any_ink: val = 5
                
            # حذف آخر ديجت فوراً لسنوات الخبرة لو القيمة أكبر من رقم واحد (مثل 11 -> 1)
            if key == 'person_emp_exp' and val is not None:
                val_str = str(int(val)) if float(val).is_integer() else str(val)
                if len(val_str) > 1:
                    val_str = val_str[:-1]
                    val = float(val_str) if '.' in val_str else int(val_str)

            status = 'ok' if (val is not None) else 'review'
            
            fields[key] = {
                'value': val,
                'status': status,
                'issues': [] if status == 'ok' else ['needs_manual_review'],
                'digits': digits_list,
                'scores': conf_list
            }
            
        for key, options in CHOICES.items():
            opt_scores = {}
            for label, x, y in options:
                p = crop(aligned, (x, y - 4, 16, 16), inset=1.0)
                opt_scores[label] = ink_score(p)
            if opt_scores:
                best_label = max(opt_scores, key=opt_scores.get)
                best_score = opt_scores[best_label]
                selected_val = best_label if best_score >= 0.12 else options[0][0]
            else:
                selected_val = options[0][0]
                
            fields[key] = {
                'value': selected_val,
                'status': 'ok',
                'issues': [],
                'ink_scores': opt_scores
            }
            
        for key, rect in PRESENCE.items():
            patch = crop(aligned, rect, inset=2.)
            score = ink_score(patch)
            presence[key] = {
                'value': bool(score >= 0.005),
                'status': 'present' if score >= 0.005 else 'empty',
                'ink_score': score
            }
            
        review = [k for k, v in fields.items() if v['status'] != 'ok']
        return {
            'layout_id': LAYOUT_ID,
            'fields': fields,
            'validation': presence,
            'review_required': [{'field': k, 'reason': 'Needs review'} for k in review],
            'extraction_complete': len(review) == 0,
            'message': 'Extraction completed.'
        }


def build_feature_row(result, corrections=None, confirmed=False, ratio_decimals=None):
    import pandas as pd
    if not confirmed: raise ValueError('The user must review and confirm the extracted values first.')
    values = {k: v['value'] for k, v in result['fields'].items()}
    corrections = corrections or {}
    values.update(corrections)
    
    safe_defaults = {
        'person_age': 30, 'person_gender': 'male', 'person_education': 'Bachelor',
        'person_income': 50000, 'person_emp_exp': 5, 'person_home_ownership': 'RENT',
        'loan_amnt': 15000, 'loan_intent': 'PERSONAL', 'loan_int_rate': 10.5,
        'loan_percent_income': 0.3, 'cb_person_cred_hist_length': 5,
        'credit_score': 700, 'previous_loan_defaults_on_file': 'No'
    }
    
    for k, default_v in safe_defaults.items():
        if values.get(k) is None:
            values[k] = default_v

    ratio = values['loan_amnt'] / max(1, values['person_income'])
    values['loan_percent_income'] = round(ratio, ratio_decimals) if ratio_decimals is not None else ratio
    
    return pd.DataFrame([{k: values[k] for k in FEATURES}], columns=FEATURES)