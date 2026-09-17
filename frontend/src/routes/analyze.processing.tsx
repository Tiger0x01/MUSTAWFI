import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { extractApplicationData } from "@/api/application";
import { JourneyBar, Page, SectionHeader, EmptyState } from "@/components/core";
import { ProcessingVisual } from "@/components/application";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

export const Route = createFileRoute("/analyze/processing")({
  head: () => ({
    meta: [
      { title: "Processing Application — MUSTAWFI" },
      { name: "description", content: "MUSTAWFI is extracting and validating loan application information." },
      { property: "og:title", content: "Processing Application — MUSTAWFI" },
      { property: "og:description", content: "Intelligent document extraction and validation in progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Processing,
});

function Processing() {
  const app = useApplication();
  const nav = useNavigate({ from: "/analyze/processing" });
  const [step, setStep] = useState(0);
  const t = copy[app.language].processing;

  useEffect(() => {
    if (!app.applicationId) return;
    let live = true;
    const timer = setInterval(() => setStep((v) => Math.min(v + 1, 4)), 850);
    extractApplicationData(app.applicationId)
      .then((r) => {
        if (live) {
          app.setExtraction(r.fields, r.review_required);
          nav({ to: "/analyze/review" });
        }
      })
      .catch((e) => app.setError(e));
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [app.applicationId]);

  if (!app.applicationId) {
    return (
      <Page>
        <EmptyState title={t.emptyTitle} action={t.emptyAction} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="shell pb-28">
        <JourneyBar />
        <SectionHeader eyebrow="DOCUMENT INTELLIGENCE" title={t.title} body={t.body} />
        <div className="mt-12">
          <ProcessingVisual step={step} />
        </div>
      </div>
    </Page>
  );
}