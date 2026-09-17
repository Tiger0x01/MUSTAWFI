import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { confirmApplicationData, predictEligibility } from "@/api/application";
import { ReviewForm } from "@/components/application";
import { EmptyState, JourneyBar, Page, SectionHeader } from "@/components/core";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

export const Route = createFileRoute("/analyze/review")({
  head: () => ({
    meta: [
      { title: "Review Extracted Information — MUSTAWFI" },
      { name: "description", content: "Review and confirm loan application information before prediction." },
      { property: "og:title", content: "Review Extracted Information — MUSTAWFI" },
      { property: "og:description", content: "Verify extracted information before the eligibility prediction." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

function Review() {
  const app = useApplication();
  const nav = useNavigate({ from: "/analyze/review" });
  const [busy, setBusy] = useState(false);
  const t = copy[app.language].review;

  if (!app.extractedFields || !app.applicationId) {
    return (
      <Page>
        <EmptyState title={t.emptyTitle} action={t.emptyAction} />
      </Page>
    );
  }

  async function submit(fields: typeof app.extractedFields) {
    if (!fields || !app.applicationId) return;
    setBusy(true);
    try {
      app.setProcessingState("predicting");
      const confirmed = await confirmApplicationData({ ...fields, application_id: app.applicationId });
      app.setConfirmedFields(confirmed);
      const result = await predictEligibility({ ...confirmed, application_id: app.applicationId });
      app.setPrediction(result);
      await nav({ to: "/analyze/result" });
    } catch (e) {
      app.setError(e as { code: string; message: string });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="shell max-w-4xl pb-28">
        <JourneyBar />
        <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} />
        <div className="mt-12">
          <ReviewForm fields={app.extractedFields} onSubmit={submit} busy={busy} />
        </div>
      </div>
    </Page>
  );
}