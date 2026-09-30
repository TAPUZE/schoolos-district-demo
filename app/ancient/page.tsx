"use client";

import { ArrowLeft } from "lucide-react";
import { lazy, Suspense } from "react";

const TempleExperience = lazy(() => import("../temple-experience"));

export default function AncientWorldPage() {
  return <>
    <a className="back-to-lab" href="/"><ArrowLeft /> School Lab</a>
    <Suspense fallback={<main className="experience-loading" role="status" aria-live="polite"><div className="experience-loading-mark" aria-hidden="true">✦</div><strong>Loading the Second Temple model…</strong><span>Preparing the architecture, sources and guided experience</span></main>}><TempleExperience /></Suspense>
  </>;
}
