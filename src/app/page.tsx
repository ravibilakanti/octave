"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoreBadge, StatusPill } from "@/components/Badges";

type Dash = {
  jobs: number;
  scored: number;
  applyBand: number;
  avg: number;
  ready: number;
  byStatus: Record<string, number>;
  recent: Array<{
    id: string;
    status: string;
    fitScore: number | null;
    createdAt: string;
    job: { id: string; title: string; company: string };
  }>;
  topFits: Array<{
    id: string;
    score: number;
    summary: string;
    job: { id: string; title: string; company: string; location: string | null };
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [busy, setBusy] = useState("");

  async function load() {
    const res = await fetch("/api/dashboard");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
      await load();
    } finally {
      setBusy("");
    }
  }

  const stats = [
    { label: "Jobs in pipeline", value: data?.jobs ?? "—" },
    { label: "Scored", value: data?.scored ?? "—" },
    { label: "Fit ≥ 8", value: data?.applyBand ?? "—" },
    { label: "Avg fit", value: data?.avg ?? "—" },
    { label: "Packets ready / applied", value: data?.ready ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">
          Your search desk
        </h1>
        <p className="mt-2 max-w-2xl text-[#9aa8c7]">
          Octave hunts roles, scores them against your profile, writes an ATS-safe resume, and
          tracks every application. Auto-apply only fires at 8/10 or higher when you turn it on.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs uppercase tracking-wider text-[#9aa8c7]">{s.label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-3xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full bg-[#e2b657] px-4 py-2 text-sm font-semibold text-[#0c1220]"
          disabled={Boolean(busy)}
          onClick={() =>
            run("analyze", async () => {
              await fetch("/api/jobs/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: 12 }),
              });
            })
          }
        >
          {busy === "analyze" ? "Scoring…" : "Score new jobs"}
        </button>
        <button
          className="rounded-full border border-[#e2b657] px-4 py-2 text-sm text-[#e2b657]"
          disabled={Boolean(busy)}
          onClick={() =>
            run("apply", async () => {
              await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auto: true }),
              });
            })
          }
        >
          {busy === "apply" ? "Queuing…" : "Auto-apply ≥ 8/10"}
        </button>
        <Link href="/jobs" className="rounded-full border border-[#2a3654] px-4 py-2 text-sm text-[#9aa8c7]">
          Search jobs
        </Link>
        <Link href="/profile" className="rounded-full border border-[#2a3654] px-4 py-2 text-sm text-[#9aa8c7]">
          Edit profile
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Top fits</h2>
          <div className="gold-rule my-3" />
          <ul className="space-y-3">
            {(data?.topFits ?? []).length === 0 && (
              <li className="text-sm text-[#9aa8c7]">No scored jobs yet. Search, then score.</li>
            )}
            {data?.topFits.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/jobs/${f.job.id}`} className="font-medium hover:text-[#f0d48a]">
                    {f.job.title}
                  </Link>
                  <div className="text-sm text-[#9aa8c7]">
                    {f.job.company}
                    {f.job.location ? ` · ${f.job.location}` : ""}
                  </div>
                </div>
                <ScoreBadge score={f.score} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Recent applications</h2>
          <div className="gold-rule my-3" />
          <ul className="space-y-3">
            {(data?.recent ?? []).length === 0 && (
              <li className="text-sm text-[#9aa8c7]">Nothing applied yet.</li>
            )}
            {data?.recent.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{a.job.title}</div>
                  <div className="text-sm text-[#9aa8c7]">{a.job.company}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={a.status} />
                  <ScoreBadge score={a.fitScore} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
