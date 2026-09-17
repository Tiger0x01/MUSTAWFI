import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/analyze")({
  component: AnalyzeLayout,
});

function AnalyzeLayout() {
  return <Outlet />;
}