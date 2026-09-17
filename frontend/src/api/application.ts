import { apiRequest, hasApiBackend } from "./client";
import type { ExtractedApplication, LoanApplication, PredictionResponse, UploadResponse } from "./types";
import { normalizeExtraction, normalizePrediction } from "@/utils/normalize";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const demoFields: LoanApplication = {
  person_age: 34, person_gender: "Male", person_education: "Bachelor's degree",
  person_income: 92000, person_emp_exp: 8, person_home_ownership: "Mortgage",
  loan_amnt: 28000, loan_intent: "Home improvement", loan_int_rate: 8.4,
  loan_percent_income: 0.3, cb_person_cred_hist_length: 11, credit_score: 742,
  previous_loan_defaults_on_file: "No",
};

export async function uploadApplication(file: File): Promise<UploadResponse> {
  if (!hasApiBackend) { await wait(700); return { application_id: `mst-${Date.now()}` }; }
  const formData = new FormData(); formData.append("file", file);
  return apiRequest<UploadResponse>("/applications", { method: "POST", body: formData });
}
export async function extractApplicationData(fileId: string): Promise<ExtractedApplication> {
  if (!hasApiBackend) { await wait(4400); return { extraction_complete: true, fields: demoFields, review_required: [{ field: "credit_score", reason: "Low OCR confidence" }, { field: "loan_int_rate", reason: "Confirm decimal value" }] }; }
  return normalizeExtraction(await apiRequest<unknown>(`/applications/${fileId}/extract`, { method: "POST" }));
}
export async function confirmApplicationData(data: LoanApplication & { application_id: string }): Promise<LoanApplication> {
  if (!hasApiBackend) { await wait(450); return data; }
  return apiRequest<LoanApplication>(`/applications/${data.application_id}/confirm`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function predictEligibility(data: LoanApplication & { application_id: string }): Promise<PredictionResponse> {
  if (!hasApiBackend) { await wait(1400); return { application_id: data.application_id, prediction: "eligible", confidence: 0.82 }; }
  return normalizePrediction(await apiRequest<unknown>(`/applications/${data.application_id}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}
export async function downloadReport(applicationId: string): Promise<Blob> {
  if (!hasApiBackend) { 
    await wait(350); 
    return new Blob([`MUSTAWFI application report - Reference: ${applicationId}`], { type: "application/pdf" }); 
  }
  return apiRequest<Blob>(`/applications/${applicationId}/report`);
}