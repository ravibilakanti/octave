"use client";

import { useEffect, useState } from "react";

type Status = {
  app: string;
  ai: boolean;
  aiModel: string;
  providers: Array<{ id: string; label: string }>;
  minFitScore: number;
  smtp: boolean;
};

export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">Settings</h1>
        <p className="mt-2 max-w-2xl text-[#9aa8c7]">
          Keys live in <code className="text-[#e2b657]">.env</code>, not in the database. Restart the
          app after you change environment variables. See <code>docs/CUSTOMIZATION.md</code> for
          every switch.
        </p>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Live config</h2>
        {!status && <p className="text-sm text-[#9aa8c7]">Reading environment…</p>}
        {status && (
          <ul className="space-y-2 text-sm">
            <li>App: {status.app}</li>
            <li>AI: {status.ai ? `on (${status.aiModel})` : "off — heuristic scoring only"}</li>
            <li>
              Providers:{" "}
              {status.providers.length
                ? status.providers.map((p) => p.label).join(", ")
                : "none enabled"}
            </li>
            <li>Default min fit (env): {status.minFitScore}</li>
            <li>SMTP email apply: {status.smtp ? "configured" : "not configured"}</li>
          </ul>
        )}
      </section>

      <section className="card space-y-3 p-5 text-sm leading-6 text-[#c9d4ee]">
        <h2 className="font-[family-name:var(--font-display)] text-xl">What Octave will and will not do</h2>
        <p>
          Octave is a personal assistant that runs on your machine. It searches public job APIs,
          scores fit against your stored profile, rewrites a single-column ATS resume, and tracks
          applications.
        </p>
        <p>
          It does not log into LinkedIn, Workday, or Greenhouse as you. Those sites forbid automated
          browser apply in their terms. When a posting has an apply email and you configured SMTP,
          Octave can send the packet. Otherwise it prepares the materials and you submit them on the
          employer site in a few minutes.
        </p>
        <p>
          Auto-apply stays off until you enable it on the Profile page. Even then, jobs below your
          fit bar (default 8/10) are never submitted.
        </p>
      </section>
    </div>
  );
}
