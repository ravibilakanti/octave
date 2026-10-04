"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScoreBadge } from "@/components/Badges";
import { parseJson } from "@/lib/utils";

type JobDetail = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  applyUrl: string | null;
  applyEmail: string | null;
  description: string;
  salary: string | null;
  provider: string;
  analyses: Array<{
    score: number;
    recommendation: string;
    summary: string;
    strengths: string;
    gaps: string;
    keywordHits: string;
    breakdown: string;
    model: string | null;
    createdAt: string;
  }>;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [busy, setBusy] = useState("");
  const [packet, setPacket] = useState<{ resumeText: string; coverLetter: string; status: string } | null>(
    null,
  );
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/jobs/${params.id}`);
    const data = await res.json();
    setJob(data.job || null);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  if (!job) return <p className="text-[#9aa8c7]">Loading job…</p>;
  const fit = job.analyses[0];
  const strengths = fit ? parseJson<string[]>(fit.strengths, []) : [];
  const gaps = fit ? parseJson<string[]>(fit.gaps, []) : [];
  const breakdown = fit
    ? parseJson<Record<string, number>>(fit.breakdown, {})
    : {};

  async function score() {
    setBusy("score");
    setError("");
    await fetch("/api/jobs/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    });
    await load();
    setBusy("");
  }

  async function apply(force = false) {
    setBusy("apply");
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, force }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Apply failed");
    else {
      setPacket({
        resumeText: data.application.resumeText,
        coverLetter: data.application.coverLetter,
        status: data.application.status,
      });
    }
    setBusy("");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#9aa8c7]">{job.provider}</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">{job.title}</h1>
        <p className="mt-1 text-[#9aa8c7]">
          {job.company}
          {job.location ? ` · ${job.location}` : ""}
          {job.salary ? ` · ${job.salary}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ScoreBadge score={fit?.score} />
        {fit && <span className="text-sm capitalize text-[#9aa8c7]">{fit.recommendation}</span>}
        <button
          onClick={score}
          className="rounded-full border border-[#2a3654] px-4 py-1.5 text-sm"
          disabled={Boolean(busy)}
        >
          {busy === "score" ? "Scoring…" : "Run fitment"}
        </button>
        <button
          onClick={() => apply(false)}
          className="rounded-full bg-[#e2b657] px-4 py-1.5 text-sm font-semibold text-[#0c1220]"
          disabled={Boolean(busy)}
        >
          {busy === "apply" ? "Preparing…" : "ATS packet + apply"}
        </button>
        <button
          onClick={() => apply(true)}
          className="rounded-full border border-[#e2b657] px-4 py-1.5 text-sm text-[#e2b657]"
          disabled={Boolean(busy)}
        >
          Force apply
        </button>
        {(job.applyUrl || job.url) && (
          <a className="text-sm text-[#6ee7c5] underline" href={job.applyUrl || job.url || "#"} target="_blank">
            Open original posting
          </a>
        )}
      </div>
      {error && <p className="text-sm text-[#f87171]">{error}</p>}

      {fit && (
        <section className="card space-y-3 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Fitment</h2>
          <p className="text-sm leading-6 text-[#c9d4ee]">{fit.summary}</p>
          <div className="grid gap-3 md:grid-cols-5">
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-[#0c1220] p-3 text-center">
                <div className="text-xs uppercase text-[#9aa8c7]">{k}</div>
                <div className="text-lg">{v}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm text-[#6ee7c5]">Strengths</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#c9d4ee]">
                {strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-[#f87171]">Gaps</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[#c9d4ee]">
                {gaps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-[#9aa8c7]">Model: {fit.model}</p>
        </section>
      )}

      {packet && (
        <section className="card space-y-3 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Application packet ({packet.status})
          </h2>
          <h3 className="text-sm text-[#e2b657]">Cover letter</h3>
          <pre className="whitespace-pre-wrap rounded-lg bg-[#0c1220] p-4 text-sm">{packet.coverLetter}</pre>
          <h3 className="text-sm text-[#e2b657]">ATS resume</h3>
          <pre className="whitespace-pre-wrap rounded-lg bg-[#0c1220] p-4 text-sm">{packet.resumeText}</pre>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Description</h2>
        <div className="gold-rule my-3" />
        <pre className="whitespace-pre-wrap text-sm leading-6 text-[#c9d4ee]">{job.description}</pre>
      </section>
    </div>
  );
}
