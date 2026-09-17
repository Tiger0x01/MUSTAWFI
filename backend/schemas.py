from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class UploadResponse(BaseModel):
    application_id: str

class ReviewRequiredItem(BaseModel):
    field: str
    reason: Optional[str] = None

class LoanApplication(BaseModel):
    person_age: float
    person_gender: str
    person_education: str
    person_income: float
    person_emp_exp: float
    person_home_ownership: str
    loan_amnt: float
    loan_intent: str
    loan_int_rate: float
    loan_percent_income: float
    cb_person_cred_hist_length: float
    credit_score: float
    previous_loan_defaults_on_file: str

class ExtractionResponse(BaseModel):
    extraction_complete: bool
    fields: Dict[str, Any]  
    review_required: List[ReviewRequiredItem]

class PredictionResponse(BaseModel):
    application_id: str
    prediction: str  
    confidence: float