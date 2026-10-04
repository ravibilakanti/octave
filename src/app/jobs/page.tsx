"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreBadge, StatusPill } from "@/components/Badges";

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  provider: string;
  url: string | null;
  analyses: Array<{ score: number; recommendation: string }>;
  applications: Array<{ status: string }>;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [msg, setMsg] = useState("");
  const [manual, setManual] = useState({ title: "", company: "", url: "", description: "" });

  async function load() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Searching public boards…");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location, remoteOnly }),
    });
    const data = await res.json();
    setMsg(`Found ${data.found ?? 0} listings.${data.errors?.length ? " " + data.errors.map((x: { message: string }) => x.message).join(" ") : ""}`);
    await load();
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual: true, ...manual }),
    });
    setManual({ title: "", company: "", url: "", description: "" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">Hunt</h1>
        <p className="mt-2 text-[#9aa8c7]">
          Search enabled providers, or paste a posting from LinkedIn / a company ATS. Octave stores
          the description for scoring — it does not scrape behind logins.
        </p>
      </div>

      <form onSubmit={search} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm text-[#9aa8c7]">
          Query
          <input
            className="mt-1 block w-64 rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="product manager"
            required
          />
        </label>
        <label className="text-sm text-[#9aa8c7]">
          Location
          <input
            className="mt-1 block w-48 rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="New York or Remote"
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-[#9aa8c7]">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
          Remote-first
        </label>
        <button className="rounded-full bg-[#e2b657] px-4 py-2 text-sm font-semibold text-[#0c1220]">
          Search
        </button>
      </form>
      {msg && <p className="text-sm text-[#6ee7c5]">{msg}</p>}

      <form onSubmit={addManual} className="card space-y-3 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Paste a job</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2 text-sm"
            placeholder="Title"
            value={manual.title}
            onChange={(e) => setManual({ ...manual, title: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2 text-sm"
            placeholder="Company"
            value={manual.company}
            onChange={(e) => setManual({ ...manual, company: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2 text-sm"
            placeholder="URL"
            value={manual.url}
            onChange={(e) => setManual({ ...manual, url: e.target.value })}
          />
        </div>
        <textarea
          rows={5}
          className="w-full rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2 text-sm"
          placeholder="Paste the full job description"
          value={manual.description}
          onChange={(e) => setManual({ ...manual, description: e.target.value })}
          required
        />
        <button className="rounded-full border border-[#e2b657] px-4 py-2 text-sm text-[#e2b657]">
          Add to pipeline
        </button>
      </form>

      <ul className="space-y-3">
        {jobs.map((job) => {
          const fit = job.analyses[0];
          const app = job.applications[0];
          return (
            <li key={job.id} className="card flex items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/jobs/${job.id}`} className="font-medium hover:text-[#f0d48a]">
                  {job.title}
                </Link>
                <div className="text-sm text-[#9aa8c7]">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.remote ? " · Remote" : ""} · {job.provider}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScoreBadge score={fit?.score} />
                {app && <StatusPill status={app.status} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
