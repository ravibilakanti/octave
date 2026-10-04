"use client";

import { useEffect, useState } from "react";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  workAuthorization: string;
  willingToRelocate: boolean;
  remotePreference: string;
  salaryMin: string;
  salaryMax: string;
  targetTitles: string;
  keywords: string;
  summary: string;
  rawResume: string;
  personalNotes: string;
  autoApply: boolean;
  minFitScore: number;
  experiences: Array<{
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    notes: string;
  }>;
  skills: string;
  certifications: Array<{ name: string; issuer: string; issuedOn: string }>;
  projects: Array<{ name: string; url: string; description: string }>;
};

const emptyExp = {
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  achievements: "",
};

const emptyEd = {
  school: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  notes: "",
};

function fieldClass() {
  return "mt-1 w-full rounded-lg border border-[#2a3654] bg-[#0c1220] px-3 py-2 text-sm outline-none focus:border-[#e2b657]";
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setForm({
          fullName: p.fullName || "",
          email: p.email || "",
          phone: p.phone || "",
          location: p.location || "",
          linkedinUrl: p.linkedinUrl || "",
          githubUrl: p.githubUrl || "",
          portfolioUrl: p.portfolioUrl || "",
          workAuthorization: p.workAuthorization || "",
          willingToRelocate: Boolean(p.willingToRelocate),
          remotePreference: p.remotePreference || "any",
          salaryMin: p.salaryMin != null ? String(p.salaryMin) : "",
          salaryMax: p.salaryMax != null ? String(p.salaryMax) : "",
          targetTitles: (p.targetTitles || []).join(", "),
          keywords: (p.keywords || []).join(", "),
          summary: p.summary || "",
          rawResume: p.rawResume || "",
          personalNotes: p.personalNotes || "",
          autoApply: Boolean(p.autoApply),
          minFitScore: p.minFitScore ?? 8,
          experiences:
            p.experiences?.length > 0
              ? p.experiences.map((e: { achievements?: string[] }) => ({
                  ...emptyExp,
                  ...e,
                  achievements: Array.isArray(e.achievements) ? e.achievements.join("\n") : "",
                }))
              : [{ ...emptyExp }],
          education: p.education?.length ? p.education : [{ ...emptyEd }],
          skills: (p.skills || []).map((s: { name: string }) => s.name).join(", "),
          certifications: p.certifications?.length
            ? p.certifications
            : [{ name: "", issuer: "", issuedOn: "" }],
          projects: p.projects?.length
            ? p.projects
            : [{ name: "", url: "", description: "" }],
        });
      });
  }, []);

  if (!form) return <p className="text-[#9aa8c7]">Loading profile…</p>;

  async function save() {
    setMsg("Saving…");
    const payload = {
      ...form,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      targetTitles: form.targetTitles.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({ name })),
      experiences: form.experiences
        .filter((e) => e.company || e.title)
        .map((e) => ({
          ...e,
          achievements: e.achievements
            .split("\n")
            .map((a) => a.replace(/^[-•]\s*/, "").trim())
            .filter(Boolean),
        })),
      education: form.education.filter((e) => e.school || e.degree),
      certifications: form.certifications.filter((c) => c.name),
      projects: form.projects.filter((p) => p.name),
    };
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMsg(res.ok ? "Profile saved. This is what Octave uses for fitment and ATS resumes." : "Save failed");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f0d48a]">
            Your dossier
          </h1>
          <p className="mt-2 max-w-2xl text-[#9aa8c7]">
            Be specific. Octave will not invent experience. Fitment and ATS rewrites only use what
            you store here.
          </p>
        </div>
        <button
          onClick={save}
          className="rounded-full bg-[#e2b657] px-5 py-2 text-sm font-semibold text-[#0c1220]"
        >
          Save profile
        </button>
      </div>
      {msg && <p className="text-sm text-[#6ee7c5]">{msg}</p>}

      <section className="card space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Identity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["linkedinUrl", "LinkedIn URL"],
              ["githubUrl", "GitHub URL"],
              ["portfolioUrl", "Portfolio URL"],
              ["workAuthorization", "Work authorization"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-[#9aa8c7]">
              {label}
              <input
                className={fieldClass()}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm text-[#9aa8c7]">
            Remote preference
            <select
              className={fieldClass()}
              value={form.remotePreference}
              onChange={(e) => setForm({ ...form, remotePreference: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </label>
          <label className="text-sm text-[#9aa8c7]">
            Salary min
            <input
              className={fieldClass()}
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
            />
          </label>
          <label className="text-sm text-[#9aa8c7]">
            Salary max
            <input
              className={fieldClass()}
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-[#9aa8c7]">
            <input
              type="checkbox"
              checked={form.willingToRelocate}
              onChange={(e) => setForm({ ...form, willingToRelocate: e.target.checked })}
            />
            Willing to relocate
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Search targets</h2>
        <label className="block text-sm text-[#9aa8c7]">
          Target titles (comma-separated)
          <input
            className={fieldClass()}
            value={form.targetTitles}
            onChange={(e) => setForm({ ...form, targetTitles: e.target.value })}
            placeholder="Product Manager, Group Product Manager"
          />
        </label>
        <label className="block text-sm text-[#9aa8c7]">
          Keywords / skills ATS should see (comma-separated)
          <input
            className={fieldClass()}
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          />
        </label>
        <label className="block text-sm text-[#9aa8c7]">
          Professional summary
          <textarea
            rows={4}
            className={fieldClass()}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-[#9aa8c7]">
            Minimum fit to auto-apply (0–10)
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              className={fieldClass()}
              value={form.minFitScore}
              onChange={(e) => setForm({ ...form, minFitScore: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-[#9aa8c7]">
            <input
              type="checkbox"
              checked={form.autoApply}
              onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
            />
            Enable auto-apply for fits at or above the bar
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Experience</h2>
          <button
            className="text-sm text-[#e2b657]"
            onClick={() => setForm({ ...form, experiences: [...form.experiences, { ...emptyExp }] })}
          >
            + Role
          </button>
        </div>
        {form.experiences.map((e, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-[#2a3654] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              {(["title", "company", "location", "startDate", "endDate"] as const).map((k) => (
                <label key={k} className="text-sm capitalize text-[#9aa8c7]">
                  {k}
                  <input
                    className={fieldClass()}
                    value={e[k]}
                    onChange={(ev) => {
                      const next = [...form.experiences];
                      next[i] = { ...e, [k]: ev.target.value };
                      setForm({ ...form, experiences: next });
                    }}
                  />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-[#9aa8c7]">
              <input
                type="checkbox"
                checked={e.current}
                onChange={(ev) => {
                  const next = [...form.experiences];
                  next[i] = { ...e, current: ev.target.checked };
                  setForm({ ...form, experiences: next });
                }}
              />
              Current role
            </label>
            <label className="block text-sm text-[#9aa8c7]">
              Description
              <textarea
                rows={3}
                className={fieldClass()}
                value={e.description}
                onChange={(ev) => {
                  const next = [...form.experiences];
                  next[i] = { ...e, description: ev.target.value };
                  setForm({ ...form, experiences: next });
                }}
              />
            </label>
            <label className="block text-sm text-[#9aa8c7]">
              Achievements (one per line)
              <textarea
                rows={4}
                className={fieldClass()}
                value={e.achievements}
                onChange={(ev) => {
                  const next = [...form.experiences];
                  next[i] = { ...e, achievements: ev.target.value };
                  setForm({ ...form, experiences: next });
                }}
              />
            </label>
          </div>
        ))}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Skills</h2>
        <textarea
          rows={3}
          className={fieldClass()}
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="SQL, Roadmapping, Stakeholder management"
        />
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Education</h2>
          <button
            className="text-sm text-[#e2b657]"
            onClick={() => setForm({ ...form, education: [...form.education, { ...emptyEd }] })}
          >
            + School
          </button>
        </div>
        {form.education.map((e, i) => (
          <div key={i} className="grid gap-3 md:grid-cols-2">
            {(["school", "degree", "field", "endDate"] as const).map((k) => (
              <label key={k} className="text-sm capitalize text-[#9aa8c7]">
                {k}
                <input
                  className={fieldClass()}
                  value={e[k]}
                  onChange={(ev) => {
                    const next = [...form.education];
                    next[i] = { ...e, [k]: ev.target.value };
                    setForm({ ...form, education: next });
                  }}
                />
              </label>
            ))}
          </div>
        ))}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Source resume (paste)</h2>
        <textarea
          rows={10}
          className={fieldClass()}
          value={form.rawResume}
          onChange={(e) => setForm({ ...form, rawResume: e.target.value })}
        />
        <label className="block text-sm text-[#9aa8c7]">
          Private notes for you (never sent to employers)
          <textarea
            rows={3}
            className={fieldClass()}
            value={form.personalNotes}
            onChange={(e) => setForm({ ...form, personalNotes: e.target.value })}
          />
        </label>
      </section>

      <button
        onClick={save}
        className="rounded-full bg-[#e2b657] px-5 py-2 text-sm font-semibold text-[#0c1220]"
      >
        Save profile
      </button>
    </div>
  );
}
