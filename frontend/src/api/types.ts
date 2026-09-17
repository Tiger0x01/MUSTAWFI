export type ApplicationField =
  | "person_age" | "person_gender" | "person_education" | "person_income"
  | "person_emp_exp" | "person_home_ownership" | "loan_amnt" | "loan_intent"
  | "loan_int_rate" | "loan_percent_income" | "cb_person_cred_hist_length"
  | "credit_score" | "previous_loan_defaults_on_file";

export interface LoanApplication {
  person_age: number | null;
  person_gender: string | null;
  person_education: string | null;
  person_income: number | null;
  person_emp_exp: number | null;
  person_home_ownership: string | null;
  loan_amnt: number | null;
  loan_intent: string | null;
  loan_int_rate: number | null;
  loan_percent_income: number | null;
  cb_person_cred_hist_length: number | null;
  credit_score: number | null;
  previous_loan_defaults_on_file: string | null;
}

export interface ReviewRequired { field: ApplicationField; reason?: string }
export interface ExtractedApplication { extraction_complete: boolean; fields: LoanApplication; review_required: ReviewRequired[] }
export type PredictionStatus = "eligible" | "not_eligible" | "low_confidence" | "error";
export interface PredictionResponse { application_id: string; prediction: PredictionStatus; confidence: number }
export type ProcessingState = "idle" | "uploading" | "processing" | "review" | "predicting" | "success" | "error";
export interface ApplicationState {
  uploadedFile: File | null;
  previewUrl: string | null;
  applicationId: string | null;
  processingState: ProcessingState;
  extractedFields: LoanApplication | null;
  reviewRequired: ReviewRequired[];
  confirmedFields: LoanApplication | null;
  prediction: PredictionResponse | null;
  confidence: number | null;
  errorState: ApiError | null;
}
export interface ApiError { code: string; message: string; status?: number }
export interface UploadResponse { application_id: string; file_url?: string }