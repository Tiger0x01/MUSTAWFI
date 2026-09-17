import { createFileRoute } from "@tanstack/react-router";
import { Hero, HomeSections } from "@/components/landing";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "MUSTAWFI — Smart Loan Eligibility Intelligence" }, { name: "description", content: "Upload, verify, and understand an intelligent loan eligibility prediction." }, { property: "og:title", content: "MUSTAWFI — Smart Loan Eligibility Intelligence" }, { property: "og:description", content: "Upload, verify, and understand an intelligent loan eligibility prediction." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <main><Hero/><HomeSections/></main>;
}
