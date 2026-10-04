import { aiConfigured, chatText } from "@/lib/ai";
import type { ProfileBundle } from "@/lib/profile-text";
import { profileToPlainText } from "@/lib/profile-text";
import { parseJson } from "@/lib/utils";

function section(title: string, body: string): string {
  return `\n${title.toUpperCase()}\n${"=".repeat(title.length)}\n${body.trim()}\n`;
}

export function buildAtsResume(
  profile: ProfileBundle,
  opts?: { jobTitle?: string; keywords?: string[] },
): string {
  const keywords = [
    ...parseJson<string[]>(profile.keywords, []),
    ...(opts?.keywords ?? []),
  ];
  const header = [
    profile.fullName || "Candidate",
    [profile.location, profile.email, profile.phone].filter(Boolean).join(" | "),
    [profile.linkedinUrl, profile.githubUrl, profile.portfolioUrl].filter(Boolean).join(" | "),
  ]
    .filter(Boolean)
    .join("\n");

  const summary =
    profile.summary ||
    `Product-oriented professional targeting ${opts?.jobTitle || parseJson<string[]>(profile.targetTitles, []).join(", ") || "roles aligned to recent experience"}.`;

  const skills = profile.skills.length
    ? profile.skills.map((s) => s.name).join(", ")
    : keywords.slice(0, 20).join(", ");

  const experience = profile.experiences
    .map((e) => {
      const dates = `${e.startDate} – ${e.current ? "Present" : e.endDate || ""}`;
      const ach = parseJson<string[]>(e.achievements, []);
      const bullets = ach.length
        ? ach.map((a) => `• ${a}`).join("\n")
        : e.description
          .split(/\n+/)
          .filter(Boolean)
          .map((a) => `• ${a.replace(/^[-•]\s*/, "")}`)
          .join("\n");
      return `${e.title}\n${e.company}${e.location ? ` | ${e.location}` : ""} | ${dates}\n${bullets}`;
    })
    .join("\n\n");

  const education = profile.education
    .map((ed) => `${ed.degree}${ed.field ? `, ${ed.field}` : ""} — ${ed.school}${ed.endDate ? ` (${ed.endDate})` : ""}`)
    .join("\n");

  const certs = profile.certifications
    .map((c) => `${c.name}${c.issuer ? `, ${c.issuer}` : ""}`)
    .join("\n");

  const projects = profile.projects
    .map((p) => {
      const h = parseJson<string[]>(p.highlights, []);
      return `${p.name}${p.url ? ` | ${p.url}` : ""}\n${p.description}${h.length ? "\n" + h.map((x) => `• ${x}`).join("\n") : ""}`;
    })
    .join("\n\n");

  return [
    header,
    section("Professional summary", summary),
    skills ? section("Skills", skills) : "",
    experience ? section("Experience", experience) : "",
    education ? section("Education", education) : "",
    certs ? section("Certifications", certs) : "",
    projects ? section("Projects", projects) : "",
    profile.workAuthorization
      ? section("Work authorization", profile.workAuthorization)
      : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function tailorAtsResume(
  profile: ProfileBundle,
  job: { title: string; company: string; description: string },
): Promise<string> {
  const base = buildAtsResume(profile, { jobTitle: job.title });
  if (!aiConfigured()) return base;

  try {
    return await chatText([
      {
        role: "system",
        content: `Rewrite the candidate resume as a plain-text ATS-friendly resume.
Rules:
- Single column, standard headings: SUMMARY, SKILLS, EXPERIENCE, EDUCATION, CERTIFICATIONS, PROJECTS
- No tables, columns, icons, or graphics
- Mirror important job keywords ONLY when they are already evidenced in the source profile
- Use past-tense accomplishment bullets with metrics when present
- Do not fabricate employers, dates, titles, tools, or degrees
- Keep under 800 words
Return resume text only.`,
      },
      {
        role: "user",
        content: `JOB TITLE: ${job.title}\nCOMPANY: ${job.company}\nJOB DESCRIPTION:\n${job.description.slice(0, 8000)}\n\nSOURCE PROFILE:\n${profileToPlainText(profile)}\n\nBASE ATS DRAFT:\n${base}`,
      },
    ]);
  } catch {
    return base;
  }
}

export async function writeCoverLetter(
  profile: ProfileBundle,
  job: { title: string; company: string; description: string },
): Promise<string> {
  const fallback = `Dear Hiring Team at ${job.company},

I am applying for the ${job.title} role. My background includes ${profile.experiences[0] ? `${profile.experiences[0].title} at ${profile.experiences[0].company}` : "relevant product and delivery work"}, and I am motivated by the problems described in this posting.

${profile.summary ? profile.summary + "\n\n" : ""}I would welcome the chance to discuss how I can contribute.

Sincerely,
${profile.fullName || "Candidate"}
${profile.email}
${profile.phone || ""}`;

  if (!aiConfigured()) return fallback.trim();

  try {
    return await chatText([
      {
        role: "system",
        content: `Write a concise 220-280 word cover letter in first person.
Use only facts from the profile. Do not invent metrics or employers.
Plain text, no markdown headings.`,
      },
      {
        role: "user",
        content: `JOB: ${job.title} at ${job.company}\n${job.description.slice(0, 6000)}\n\nPROFILE:\n${profileToPlainText(profile)}`,
      },
    ]);
  } catch {
    return fallback.trim();
  }
}
