from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response
from typing import Optional, List, Dict, Any
from ml import predict_loan
import pandas as pd
import os
import io
import cv2
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent

from utils import validate_and_save_image, get_image_path
from cv.loan_cv.pipeline import FormExtractor
from cv.loan_cv.digits import CNNRecognizer

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = FastAPI(title="MUSTAWFI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

applications_db: Dict[str, Dict[str, Any]] = {}

extractor = None
cnn_recognizer = None 

class LoanApplication(BaseModel):
    person_age: Optional[float] = None
    person_gender: Optional[str] = None
    person_education: Optional[str] = None
    person_income: Optional[float] = None
    person_emp_exp: Optional[float] = None
    person_home_ownership: Optional[str] = None
    loan_amnt: Optional[float] = None
    loan_intent: Optional[str] = None
    loan_int_rate: Optional[float] = None
    loan_percent_income: Optional[float] = None
    cb_person_cred_hist_length: Optional[float] = None
    credit_score: Optional[float] = None
    previous_loan_defaults_on_file: Optional[str] = None

@app.on_event("startup")
def load_models():
    global extractor, cnn_recognizer
    print("Loading CV Models...")
    try:
        # البحث في المسارات الصحيحة بناءً على هيكل مشروعك
        possible_model_paths = [
            BASE_DIR / "cv" / "models" / "digit_cnn.pt",
            BASE_DIR / "models" / "digit_cnn.pt",
            BASE_DIR.parent / "models" / "digit_cnn.pt",
            Path("cv/models/digit_cnn.pt"),
            Path("models/digit_cnn.pt")
        ]
        possible_ref_paths = [
            BASE_DIR / "cv" / "assets" / "Loan_Form_Reference.png",
            BASE_DIR / "cv" / "loan_cv" / "Loan_Form_Reference.png",
            BASE_DIR / "assets" / "Loan_Form_Reference.png",
            Path("cv/assets/Loan_Form_Reference.png"),
            Path("assets/Loan_Form_Reference.png")
        ]
        
        model_path = next((p for p in possible_model_paths if p.exists()), None)
        ref_path = next((p for p in possible_ref_paths if p.exists()), None)
        
        if model_path:
            try:
                cnn_recognizer = CNNRecognizer(str(model_path))
                print(f"Loaded CNN Recognizer from {model_path}")
            except Exception as ex:
                print(f"Could not load CNN weights: {ex}")
        else:
            raise RuntimeError(
                "digit_cnn.pt not found. "
                "Cannot run numeric extraction without the digit model."
            )

        # منع التشغيل بدون المرجع الأصلي
        if ref_path is None:
            raise RuntimeError(
                "Loan form reference image not found. "
                "Expected: backend/cv/assets/Loan_Form_Reference.png"
            )
            
        extractor = FormExtractor(reference_path=str(ref_path), recognizer=cnn_recognizer)
        print(f"CV Extractor initialized successfully with reference: {ref_path}")
        
    except Exception as e:
        print(f"Error loading CV models: {e}")

@app.post("/applications")
async def upload_application(file: UploadFile = File(...)):
    try:
        app_id = validate_and_save_image(file)
        applications_db[app_id] = {
            "file_name": file.filename,
            "status": "uploaded"
        }
        return {"application_id": app_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/applications/{application_id}/extract")
async def extract_application(application_id: str):
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    global extractor
    if extractor is None:
        raise HTTPException(status_code=500, detail="Server Error: Extractor is not initialized.")
        
    try:
        image_path = get_image_path(application_id)
        
        # استخراج البيانات
        result, aligned_img = extractor.extract(image_path)
        
        # ---- DEBUG: حفظ الصورة الأصلية والـ aligned للمراجعة ----
        debug_dir = BASE_DIR / "uploads" / "debug"
        debug_dir.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(debug_dir / f"{application_id}_original.jpg"), cv2.imread(image_path))
        cv2.imwrite(str(debug_dir / f"{application_id}_aligned.jpg"), aligned_img)
        # --------------------------------------------------------
        
        extracted_fields = {}
        review_required = []
        
        for key, data in result.get('fields', {}).items():
            extracted_fields[key] = data.get('value')
            if data.get('status') != 'ok':
                review_required.append({
                    "field": key,
                    "reason": ", ".join(data.get('issues', ['Needs review']))
                })
        
        if 'validation' in result:
            for k, data in result['validation'].items():
                if k == 'name_present':
                    extracted_fields['applicant_name_status'] = data.get('status')
                elif k == 'signature_present':
                    extracted_fields['signature_status'] = data.get('status')

        # حساب loan_percent_income رياضياً فقط إذا توفرت الأرقام (لا يتم وضع 0)
        loan_amnt = extracted_fields.get("loan_amnt")
        person_income = extracted_fields.get("person_income")
        if loan_amnt is not None and person_income is not None and float(person_income) > 0:
            extracted_fields["loan_percent_income"] = round(float(loan_amnt) / float(person_income), 4)
        else:
            extracted_fields["loan_percent_income"] = None
            if "loan_percent_income" not in [r["field"] for r in review_required]:
                review_required.append({"field": "loan_percent_income", "reason": "Requires valid loan amount and income."})

        # تم إزالة الـ defaults تماماً

        applications_db[application_id]["fields"] = extracted_fields
        applications_db[application_id]["quality"] = result.get('quality', {})
        
        return {
            "extraction_complete": len(review_required) == 0,
            "fields": extracted_fields,
            "review_required": review_required,
            "quality": result.get('quality', {})
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.put("/applications/{application_id}/confirm")
async def confirm_application(application_id: str, payload: LoanApplication):
    if application_id not in applications_db:
        applications_db[application_id] = {}
    applications_db[application_id]["fields"] = payload.dict(exclude_none=True)
    return payload.dict()

@app.post("/applications/{application_id}/predict")
async def predict_eligibility(application_id: str, payload: LoanApplication):
    try:
        # التأكد من عدم وجود None قبل الإرسال للموديل
        data_dict = payload.dict()
        if any(v is None for v in data_dict.values()):
            raise HTTPException(status_code=400, detail="All fields must be confirmed and filled before prediction.")
            
        input_df = pd.DataFrame([data_dict])
        result = predict_loan(application_id, input_df)
        
        if application_id not in applications_db:
            applications_db[application_id] = {}
        applications_db[application_id]["fields"] = data_dict
        applications_db[application_id]["prediction_result"] = result
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction Error: {str(e)}")

@app.get("/applications/{application_id}/report")
async def download_report(application_id: str):
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found.")
        
    app_data = applications_db[application_id]
    fields = app_data.get("fields", {})
    pred_result = app_data.get("prediction_result", {"prediction": "PENDING", "confidence": 0.0})

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold',
        fontSize=20, textColor=colors.HexColor('#1E3A8A'), spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle', parent=styles['Normal'], fontName='Helvetica',
        fontSize=10, textColor=colors.HexColor('#64748B'), spaceAfter=12
    )
    heading_style = ParagraphStyle(
        'HeadingStyle', parent=styles['Heading2'], fontName='Helvetica-Bold',
        fontSize=12, textColor=colors.HexColor('#0F172A'), spaceBefore=10, spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'NormalStyle', parent=styles['Normal'], fontName='Helvetica',
        fontSize=9, textColor=colors.HexColor('#334155')
    )

    story.append(Paragraph("MUSTAWFI", title_style))
    story.append(Paragraph("AI-Powered Loan Eligibility & Risk Assessment Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=12))

    meta_data = [
        [Paragraph(f"<b>Application ID:</b> {application_id}", normal_style),
         Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    status = str(pred_result.get("prediction", "Unknown")).upper()
    conf = float(pred_result.get("confidence", 0.0)) * 100
    status_color = colors.HexColor('#16A34A') if 'ELIGIBLE' in status else colors.HexColor('#DC2626')
    
    pred_data = [
        [Paragraph(f"<b>Assessment Result:</b> <font color='{status_color.hexval()}'><b>{status}</b></font>", heading_style)],
        [Paragraph(f"<b>Model Confidence Score:</b> {conf:.2f}%", normal_style)]
    ]
    pred_table = Table(pred_data, colWidths=[540])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Applicant Financial & Personal Details", heading_style))
    
    table_data = [["Field Name", "Extracted / Confirmed Value"]]
    for k, v in fields.items():
        table_data.append([k.replace("_", " ").title(), str(v)])
        
    t = Table(table_data, colWidths=[260, 280])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FFFFFF')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0,1), (-1,-1), 5),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
    ]))
    story.append(t)
    
    doc.build(story)
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf")