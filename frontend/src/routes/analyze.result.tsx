import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, RotateCcw } from "lucide-react";
import { downloadReport } from "@/api/application";
import { PredictionCard, ResultDetails } from "@/components/application";
import { EmptyState, GlassButton, JourneyBar, Page } from "@/components/core";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

export const Route = createFileRoute("/analyze/result")({
  head: () => ({
    meta: [
      { title: "Eligibility Prediction — MUSTAWFI" },
      { name: "description", content: "Understand the machine-learning prediction and its application context." },
      { property: "og:title", content: "Eligibility Prediction — MUSTAWFI" },
      { property: "og:description", content: "A clear machine-learning eligibility prediction with application context." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Result,
});

function Result() {
  const app = useApplication();
  const t = copy[app.language].result;

  if (!app.prediction || !app.confirmedFields) {
    return (
      <Page>
        <EmptyState title={t.emptyTitle} action={t.emptyAction} />
      </Page>
    );
  }

async function report() {
  if (!app.applicationId) return;
  try {
    const blob = await downloadReport(app.applicationId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MUSTAWFI-Report-${app.applicationId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e) {
    console.error("Failed to download report", e);
  }
}



  return (
    <Page>
      <div className="shell max-w-5xl pb-28">
        <JourneyBar />
        <PredictionCard prediction={app.prediction} />
        <ResultDetails fields={app.confirmedFields} />

<div className="mt-10 flex flex-wrap gap-3">
          <GlassButton onClick={report}>
            {t.report}
            <Download />
          </GlassButton>
          <Button asChild variant="outline" className="h-12 rounded-full px-6" onClick={app.reset}>
            <Link to="/analyze">
              {t.again}
              <RotateCcw />
            </Link>
          </Button>
        </div>

      </div>
    </Page>
  );
}