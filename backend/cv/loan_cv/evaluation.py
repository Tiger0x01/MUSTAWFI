import math
from .layout import NUMERIC
def evaluate_forms(extractor, cases):
    from .layout import CHOICES,PRESENCE
    keys=list(NUMERIC)+list(CHOICES)+list(PRESENCE)
    if not cases:return {'status':'not_run','reason':'No real-photo test cases supplied.'}
    correct={k:0 for k in keys};whole=0;rejected=0;details=[]
    for case in cases:
        expected=case['expected']
        if set(expected)!=set(keys):raise ValueError('Each expected record must label all 12 written fields and both presence flags.')
        for key in NUMERIC:
            value=expected[key]
            if value is None or isinstance(value,bool) or not math.isfinite(float(value)):
                raise ValueError(f'Missing or invalid ground truth for {key}.')
        for key,options in CHOICES.items():
            if expected[key] not in [o[0] for o in options]:
                raise ValueError(f'Missing or invalid ground truth for {key}.')
        for key in PRESENCE:
            if not isinstance(expected[key],bool):
                raise ValueError(f'{key} ground truth must be True or False.')
        try:
            result,_=extractor.extract(case['photo_path'])
        except ValueError as exc:
            rejected+=1;details.append({'photo_path':case['photo_path'],'error':str(exc)});continue
        per={}
        for k in keys:
            rec=result['fields'].get(k,result['validation'].get(k))
            actual=rec['value'];target=expected[k]
            if k in NUMERIC and actual is not None and target is not None:
                match=math.isclose(float(actual),float(target),rel_tol=0,abs_tol=.000001)
            else:match=actual==target
            per[k]=bool(match);correct[k]+=int(match)
        whole+=int(all(per.values()))
        details.append({'photo_path':case['photo_path'],'matches':per,'review_required':result['review_required']})
    return {'status':'completed','forms':len(cases),'rejected_photos':rejected,
            'field_exact_accuracy':{k:v/len(cases) for k,v in correct.items()},
            'whole_form_exact_accuracy':whole/len(cases),'details':details}
