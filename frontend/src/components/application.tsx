import { motion } from "motion/react";
import { Check, Circle, Edit3, FileCheck2, ScanLine } from "lucide-react";
import { useState } from "react";
import type { ApplicationField, LoanApplication, PredictionResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Expandable, GlassButton, GlassCard } from "./core";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

export const fieldLabels: Record<ApplicationField, { en: string; ar: string }> = {
  person_age: { en: "Age", ar: "العمر" },
  person_gender: { en: "Gender", ar: "الجنس" },
  person_education: { en: "Education", ar: "التعليم" },
  person_income: { en: "Annual income", ar: "الدخل السنوي" },
  person_emp_exp: { en: "Employment experience", ar: "سنوات الخبرة" },
  person_home_ownership: { en: "Home ownership", ar: "ملكية السكن" },
  loan_amnt: { en: "Loan amount", ar: "مبلغ القرض" },
  loan_intent: { en: "Loan purpose", ar: "غرض القرض" },
  loan_int_rate: { en: "Interest rate", ar: "معدل الفائدة" },
  loan_percent_income: { en: "Loan-to-income ratio", ar: "نسبة القرض للدخل" },
  cb_person_cred_hist_length: { en: "Credit history length", ar: "مدة السجل الائتماني" },
  credit_score: { en: "Credit score", ar: "الدرجة الائتمانية" },
  previous_loan_defaults_on_file: { en: "Previous loan defaults", ar: "تعثرات سابقة" },
};

export const groups: ApplicationField[][] = [
  ["person_age", "person_gender", "person_education", "person_income", "person_emp_exp", "person_home_ownership"],
  ["loan_amnt", "loan_intent", "loan_int_rate", "loan_percent_income"],
  ["cb_person_cred_hist_length", "credit_score", "previous_loan_defaults_on_file"],
];

const format = (key: ApplicationField, value: LoanApplication[ApplicationField]) =>
  key === "person_income" || key === "loan_amnt"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value))
    : key === "loan_percent_income"
    ? `${Math.round(Number(value) * 100)}%`
    : key === "loan_int_rate"
    ? `${value}%`
    : String(value);

export function ProcessingVisual({ step }: { step: number }) {
  const app = useApplication();
  const t = copy[app.language].processing;
  
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="scan-frame">
        <div className="scan-line" />
        <img src={app.previewUrl ?? ""} alt="Loan application being analyzed" />
        <div className="scan-corners" />
        <span className="absolute bottom-4 start-4 flex items-center gap-2 text-xs">
          <ScanLine className="size-4" /> OCR / CV ACTIVE
        </span>
      </div>
      <ol className="space-y-2" aria-live="polite">
        {t.stages.map((x, i) => (
          <motion.li
            key={x}
            animate={{ opacity: i <= step ? 1 : 0.35 }}
            className="flex items-center gap-4 border-b border-border py-5"
          >
            <span
              className={`grid size-8 place-items-center rounded-full border ${
                i < step ? "bg-foreground text-background" : ""
              }`}
            >
              {i < step ? <Check className="size-4" /> : <Circle className="size-3" />}
            </span>
            <span className="font-medium">{x}</span>
            {i === step && <span className="ms-auto pulse-dot" />}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export function ReviewForm({
  fields,
  onSubmit,
  busy,
}: {
  fields: LoanApplication;
  onSubmit: (v: LoanApplication) => void;
  busy: boolean;
}) {
  const app = useApplication();
  const t = copy[app.language].review;
  const [values, setValues] = useState(fields);
  const [editing, setEditing] = useState<ApplicationField | null>(null);
  const [verified, setVerified] = useState<ApplicationField[]>([]);
  const required = app.reviewRequired.map((x) => x.field);

  const renderGroupFields = (group: ApplicationField[]) => (
    <div className="mt-5 divide-y divide-border">
      {group.map((key) => {
        const edit = editing === key;
        return (
          <motion.div
            layout
            key={key}
            className={`py-5 ${
              required.includes(key) && !verified.includes(key) ? "review-field" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <label htmlFor={key} className="text-sm text-muted-foreground">
                  {fieldLabels[key][app.language]}
                </label>
                {edit ? (
                  <input
                    id={key}
                    autoFocus
                    className="field-input mt-2"
                    value={String(values[key])}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [key]: typeof fields[key] === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="mt-1 text-lg font-medium">{format(key, values[key])}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {verified.includes(key) ? (
                  <span className="status-label">
                    <Check />
                    {t.verified}
                  </span>
                ) : (
                  required.includes(key) && <span className="status-label">{t.needs}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (edit) {
                      setVerified((v) => [...v, key]);
                      setEditing(null);
                    } else {
                      setEditing(key);
                    }
                  }}
                >
                  {edit ? <Check /> : <Edit3 />}
                  {edit ? t.save : t.edit}
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-6"
    >
      {/* الجدولان الأول والثاني جنباً إلى جنب */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-semibold">{t.sections[0]}</h2>
          {renderGroupFields(groups[0])}
        </GlassCard>
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xl font-semibold">{t.sections[1]}</h2>
          {renderGroupFields(groups[1])}
        </GlassCard>
      </div>

      {/* جدول البيانات الائتمانية */}
      <GlassCard className="p-6 md:p-8">
        <h2 className="text-xl font-semibold">{t.sections[2]}</h2>
        {renderGroupFields(groups[2])}
      </GlassCard>

      {/* زر إظهار التوقع في منتصف السطر تماماً تحت النص التوضيحي */}
      <div className="mt-8 flex flex-col items-center justify-center text-center p-6">
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {app.language === "ar" ? "بعد التأكد من صحة كافة البيانات، يمكنك المتابعة لعرض التوقع." : "After verifying all data, you can proceed to view the prediction."}
        </p>
        <GlassButton type="submit" className="w-full max-w-sm h-14 text-base" disabled={busy}>
          {t.action}
          <FileCheck2 />
        </GlassButton>
      </div>
    </form>
  );
}

export function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="relative grid size-44 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 180 180">
        <circle className="ring-track" cx="90" cy="90" r="76" />
        <motion.circle
          className="ring-value"
          cx="90"
          cy="90"
          r="76"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <motion.strong initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl">
          {pct}%
        </motion.strong>
      </div>
    </div>
  );
}

export function PredictionCard({ prediction }: { prediction: PredictionResponse }) {
  const app = useApplication();
  const t = copy[app.language].result;
  
  return (
    <GlassCard className="result-card">
      <div>
        <p className="eyebrow">{t.eyebrow}</p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 text-5xl font-semibold md:text-7xl"
        >
          {t[prediction.prediction]}
        </motion.h1>
        {/* تم زيادة المسافة هنا من mt-7 إلى mt-14 لإبعاد الجملة */}
        <p className="mt-14 max-w-xl text-sm leading-6 text-muted-foreground">{t.note}</p>
      </div>
      <div className="text-center">
        <ConfidenceRing value={prediction.confidence} />
        <span className="text-sm text-muted-foreground">{t.confidence}</span>
      </div>
    </GlassCard>
  );
}


export function ResultDetails({ fields }: { fields: LoanApplication }) {
  const app = useApplication();
  const t = copy[app.language].result;
  
  const factors: [ApplicationField, number][] = [
    ["credit_score", Math.min(fields.credit_score / 850, 1)],
    ["person_income", Math.min(fields.person_income / 120000, 1)],
    ["loan_amnt", 1 - Math.min(fields.loan_amnt / 100000, 1)],
    ["person_emp_exp", Math.min(fields.person_emp_exp / 15, 1)],
    ["loan_percent_income", 1 - Math.min(fields.loan_percent_income, 1)],
    ["previous_loan_defaults_on_file", fields.previous_loan_defaults_on_file.toLowerCase() === "no" ? 1 : 0.25],
  ];

  return (
    <>
      <section className="mt-16">
        <h2 className="text-2xl font-semibold">{t.why}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.whyBody}</p>
        <div className="mt-8 grid gap-x-12 gap-y-7 md:grid-cols-2">
          {factors.map(([key, val]) => (
            <div key={key}>
              <div className="mb-2 flex justify-between text-sm">
                <span>{fieldLabels[key][app.language]}</span>
                <span className="text-muted-foreground">{format(key, fields[key])}</span>
              </div>
              <div className="factor-track">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.round(val * 100)}%` }}
                  viewport={{ once: true }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-12">
        <Expandable title={t.summary}>
          <dl className="grid gap-5 sm:grid-cols-2">
            {Object.entries(fields).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{fieldLabels[k as ApplicationField][app.language]}</dt>
                <dd className="mt-1 font-medium">{format(k as ApplicationField, v)}</dd>
              </div>
            ))}
          </dl>
        </Expandable>
      </div>
    </>
  );
}