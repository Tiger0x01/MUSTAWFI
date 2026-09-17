import joblib
import pandas as pd

MODEL_PATH = "model/loan_model.joblib"
model = None

def load_model():
    global model
    if model is None:
        model = joblib.load(MODEL_PATH)

def preprocess_input(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    gender_map = {'male': 1, 'female': 0, 'Male': 1, 'Female': 0}
    defaults_map = {'Yes': 1, 'No': 0, 'yes': 1, 'no': 0, 'YES': 1, 'NO': 0}
    edu_map = {'High School': 0, 'Associate': 1, 'Bachelor': 2, 'Master': 3, 'Doctorate': 4}
    home_map = {'RENT': 0, 'OWN': 1, 'MORTGAGE': 2, 'OTHER': 3}
    intent_map = {'PERSONAL': 0, 'EDUCATION': 1, 'MEDICAL': 2, 'VENTURE': 3, 'HOMEIMPROVEMENT': 4, 'DEBTCONSOLIDATION': 5}

    if 'person_gender' in df and df['person_gender'].dtype == object:
        df['person_gender'] = df['person_gender'].map(gender_map).fillna(1)
    if 'previous_loan_defaults_on_file' in df and df['previous_loan_defaults_on_file'].dtype == object:
        df['previous_loan_defaults_on_file'] = df['previous_loan_defaults_on_file'].map(defaults_map).fillna(0)
    if 'person_education' in df and df['person_education'].dtype == object:
        df['person_education'] = df['person_education'].map(edu_map).fillna(2)
    if 'person_home_ownership' in df and df['person_home_ownership'].dtype == object:
        df['person_home_ownership'] = df['person_home_ownership'].map(home_map).fillna(0)
    if 'loan_intent' in df and df['loan_intent'].dtype == object:
        df['loan_intent'] = df['loan_intent'].map(intent_map).fillna(0)
        
    return df

def predict_loan(app_id: str, df: pd.DataFrame):
    load_model()
    
    processed_df = preprocess_input(df)
    
    prediction = int(model.predict(processed_df)[0])
    probability = float(model.predict_proba(processed_df)[0].max())
    
    # 1. التوقع الأساسي من الموديل (0 = مؤهل، 1 = غير مؤهل)
    status = "eligible" if prediction == 0 else "not_eligible"
    
    # استخراج القيم بشكل آمن كـscalars
    cred_score = float(df['credit_score'].iloc[0]) if 'credit_score' in df and len(df) > 0 else 700
    defaults_val = df['previous_loan_defaults_on_file'].iloc[0] if 'previous_loan_defaults_on_file' in df and len(df) > 0 else 0
    
    # تحويل لو لسه نص أو مقيّم كـ 1/0
    is_default = str(defaults_val).lower() in ['yes', '1', '1.0'] or defaults_val == 1
    
    # 2. القواعد الائتمانية الصارمة (Hard Business Rules) - الرفض الفوري للتعثر أو السىء
    if cred_score < 600 or is_default:
        status = "not_eligible"
        
    # 3. التحقق من الثقة (Low Confidence)
    if probability < 0.60:
        status = "low_confidence"
        
    return {
        "application_id": app_id,
        "prediction": status,
        "confidence": float(probability)
    }