"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoreBadge, StatusPill } from "@/components/Badges";

const STATUSES = ["queued", "preparing", "ready", "applied", "screening", "interview", "offer", "rejected", "withdrawn"];

type AppRow = {
  id: string;
  status: string;
  channel: string;
  fitScore: number | null;
  notes: string;
  coverLetter: string;
  resumeText: string;
  createdAt: string;
  job: { id: string; title: string; company: string; url: string | null };
  events: Array<{ id: string; status: string; message: string; createdAt: string }>;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApps(data.applications || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, message: `Moved to ${status}` }),
    });
    await load();
  }

  const counts = STATUSES.map((s) => ({ s, n: apps.filter((a) => a.status === s).length }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">Tracker</h1>
        <p className="mt-2 text-[#9aa8c7]">
          Every packet Octave prepares is logged here. Move statuses as recruiters reply.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5 lg:grid-cols-9">
        {counts.map((c) => (
          <div key={c.s} className="card p-3 text-center">
            <div className="text-[11px] uppercase tracking-wide text-[#9aa8c7]">{c.s}</div>
            <div className="font-[family-name:var(--font-display)] text-2xl">{c.n}</div>
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {apps.map((a) => (
          <li key={a.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/jobs/${a.job.id}`} className="font-medium hover:text-[#f0d48a]">
                  {a.job.title}
                </Link>
                <div className="text-sm text-[#9aa8c7]">
                  {a.job.company} · {a.channel} · {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScoreBadge score={a.fitScore} />
                <StatusPill status={a.status} />
                <select
                  className="rounded-lg border border-[#2a3654] bg-[#0c1220] px-2 py-1 text-sm"
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button className="text-sm text-[#e2b657]" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  {open === a.id ? "Hide packet" : "Show packet"}
                </button>
              </div>
            </div>
            {open === a.id && (
              <div className="mt-4 space-y-3">
                {a.notes && <p className="text-sm text-[#9aa8c7]">{a.notes}</p>}
                <ol className="space-y-1 text-xs text-[#9aa8c7]">
                  {a.events.map((ev) => (
                    <li key={ev.id}>
                      {new Date(ev.createdAt).toLocaleString()} — {ev.status}: {ev.message}
                    </li>
                  ))}
                </ol>
                <pre className="whitespace-pre-wrap rounded-lg bg-[#0c1220] p-3 text-sm">{a.coverLetter}</pre>
                <pre className="whitespace-pre-wrap rounded-lg bg-[#0c1220] p-3 text-sm">{a.resumeText}</pre>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
