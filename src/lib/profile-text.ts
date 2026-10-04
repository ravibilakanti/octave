import type { Profile } from "@prisma/client";
import { parseJson } from "@/lib/utils";

export type ProfileBundle = Profile & {
  experiences: Array<{
    company: string;
    title: string;
    location?: string | null;
    startDate: string;
    endDate?: string | null;
    current: boolean;
    description: string;
    achievements: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string | null;
  }>;
  skills: Array<{ name: string; category: string; level: string }>;
  certifications: Array<{ name: string; issuer?: string | null }>;
  projects: Array<{ name: string; description: string; highlights: string }>;
};

export function profileToPlainText(profile: ProfileBundle): string {
  const titles = parseJson<string[]>(profile.targetTitles, []);
  const keywords = parseJson<string[]>(profile.keywords, []);
  const lines: string[] = [];
  lines.push(`Name: ${profile.fullName}`);
  lines.push(`Email: ${profile.email}`);
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.location) lines.push(`Location: ${profile.location}`);
  if (profile.linkedinUrl) lines.push(`LinkedIn: ${profile.linkedinUrl}`);
  if (profile.githubUrl) lines.push(`GitHub: ${profile.githubUrl}`);
  if (profile.portfolioUrl) lines.push(`Portfolio: ${profile.portfolioUrl}`);
  if (profile.workAuthorization) lines.push(`Work authorization: ${profile.workAuthorization}`);
  lines.push(`Remote preference: ${profile.remotePreference}`);
  if (titles.length) lines.push(`Target titles: ${titles.join(", ")}`);
  if (keywords.length) lines.push(`Keywords: ${keywords.join(", ")}`);
  if (profile.summary) lines.push(`\nSUMMARY\n${profile.summary}`);
  if (profile.skills.length) {
    lines.push(
      `\nSKILLS\n${profile.skills.map((s) => `${s.name} (${s.level}, ${s.category})`).join(", ")}`,
    );
  }
  if (profile.experiences.length) {
    lines.push("\nEXPERIENCE");
    for (const e of profile.experiences) {
      const dates = `${e.startDate} – ${e.current ? "Present" : e.endDate || ""}`;
      lines.push(`${e.title} | ${e.company} | ${dates}`);
      if (e.description) lines.push(e.description);
      const ach = parseJson<string[]>(e.achievements, []);
      for (const a of ach) lines.push(`- ${a}`);
    }
  }
  if (profile.education.length) {
    lines.push("\nEDUCATION");
    for (const ed of profile.education) {
      lines.push(`${ed.degree}${ed.field ? ` in ${ed.field}` : ""} | ${ed.school}`);
    }
  }
  if (profile.certifications.length) {
    lines.push("\nCERTIFICATIONS");
    for (const c of profile.certifications) lines.push(`${c.name}${c.issuer ? ` — ${c.issuer}` : ""}`);
  }
  if (profile.projects.length) {
    lines.push("\nPROJECTS");
    for (const p of profile.projects) {
      lines.push(`${p.name}: ${p.description}`);
    }
  }
  if (profile.rawResume) {
    lines.push("\nSOURCE RESUME\n" + profile.rawResume);
  }
  return lines.join("\n");
}
