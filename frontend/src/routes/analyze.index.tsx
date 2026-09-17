import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { uploadApplication } from "@/api/application";
import { Page, JourneyBar, SectionHeader } from "@/components/core";
import { UploadZone } from "@/components/upload";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";
export const Route=createFileRoute("/analyze/")({head:()=>({meta:[{title:"Analyze Application — MUSTAWFI"},{name:"description",content:"Upload a loan application for intelligent document analysis."},{property:"og:title",content:"Analyze Application — MUSTAWFI"},{property:"og:description",content:"Upload a loan application for intelligent document analysis."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Analyze});
function Analyze(){const app=useApplication();const t=copy[app.language].analyze;const nav=useNavigate({from:"/analyze/"});const[busy,setBusy]=useState(false);async function go(){if(!app.uploadedFile)return;setBusy(true);try{app.setProcessingState("uploading");const r=await uploadApplication(app.uploadedFile);app.setApplicationId(r.application_id);app.setProcessingState("processing");await nav({to:"/analyze/processing"})}catch(e){app.setError(e as {code:string;message:string})}finally{setBusy(false)}}return <Page><div className="shell pb-28"><JourneyBar/><div className="mb-12 text-center"><SectionHeader centered eyebrow={t.eyebrow} title={t.title} body={t.body}/></div><UploadZone onAnalyze={go} busy={busy}/></div></Page>}