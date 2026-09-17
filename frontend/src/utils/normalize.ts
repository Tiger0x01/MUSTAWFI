import type { ApplicationField, ExtractedApplication, LoanApplication, PredictionResponse, PredictionStatus, ReviewRequired } from "@/api/types";

const keys: ApplicationField[] = ["person_age", "person_gender", "person_education", "person_income", "person_emp_exp", "person_home_ownership", "loan_amnt", "loan_intent", "loan_int_rate", "loan_percent_income", "cb_person_cred_hist_length", "credit_score", "previous_loan_defaults_on_file"];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

// التعديل الجذري هنا لمنع إخفاء القيم المفقودة بصفر
const num = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const str = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
};

export function normalizeExtraction(payload: unknown): ExtractedApplication {
  const root = isRecord(payload) ? payload : {};
  const raw = isRecord(root["fields"]) ? root["fields"] : isRecord(root["data"]) ? root["data"] : root;
  const fields: LoanApplication = {
    person_age: num(raw["person_age"]), person_gender: str(raw["person_gender"]), person_education: str(raw["person_education"]),
    person_income: num(raw["person_income"]), person_emp_exp: num(raw["person_emp_exp"]), person_home_ownership: str(raw["person_home_ownership"]),
    loan_amnt: num(raw["loan_amnt"]), loan_intent: str(raw["loan_intent"]), loan_int_rate: num(raw["loan_int_rate"]),
    loan_percent_income: num(raw["loan_percent_income"]), cb_person_cred_hist_length: num(raw["cb_person_cred_hist_length"]),
    credit_score: num(raw["credit_score"]), previous_loan_defaults_on_file: str(raw["previous_loan_defaults_on_file"]),
  };
  const review = Array.isArray(root["review_required"]) ? root["review_required"] : [];
  const review_required: ReviewRequired[] = review.flatMap((item) => {
    const field = typeof item === "string" ? item : isRecord(item) ? item["field"] : undefined;
    if (typeof field !== "string" || !keys.includes(field as ApplicationField)) return [];
    const reason = isRecord(item) && item["reason"] ? str(item["reason"]) : undefined;
    return [reason ? { field: field as ApplicationField, reason } : { field: field as ApplicationField }];
  });
  return { extraction_complete: Boolean(root["extraction_complete"] ?? true), fields, review_required };
}

export function normalizePrediction(payload: unknown): PredictionResponse {
  const root = isRecord(payload) ? payload : {};
  const raw = String(root["prediction"] ?? root["result"] ?? "").toLowerCase().replaceAll(" ", "_");
  const allowed: PredictionStatus[] = ["eligible", "not_eligible", "low_confidence", "error"];
  return { application_id: String(root["application_id"] ?? root["id"] ?? ""), prediction: allowed.includes(raw as PredictionStatus) ? raw as PredictionStatus : "error", confidence: Math.min(1, Math.max(0, num(root["confidence"]) ?? 0)) };
}