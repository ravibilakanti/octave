import { aiConfigured, chatJson } from "@/lib/ai";
import type { ProfileBundle } from "@/lib/profile-text";
import { profileToPlainText } from "@/lib/profile-text";
import { clamp, parseJson } from "@/lib/utils";

export type FitmentResult = {
  score: number;
  recommendation: "apply" | "review" | "skip";
  summary: string;
  strengths: string[];
  gaps: string[];
  keywordHits: string[];
  breakdown: {
    skills: number;
    experience: number;
    domain: number;
    seniority: number;
    logistics: number;
  };
  model: string;
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function heuristicFit(profile: ProfileBundle, jobTitle: string, jobDescription: string): FitmentResult {
  const skills = profile.skills.map((s) => s.name.toLowerCase());
  const titles = parseJson<string[]>(profile.targetTitles, []).map((t) => t.toLowerCase());
  const keywords = parseJson<string[]>(profile.keywords, []).map((k) => k.toLowerCase());
  const profileTokens = tokenize(profileToPlainText(profile));
  const jobTokens = tokenize(`${jobTitle} ${jobDescription}`);
  const jobText = `${jobTitle} ${jobDescription}`.toLowerCase();

  const keywordHits = [...new Set([...skills, ...keywords])].filter((k) => jobText.includes(k));
  const skillScore = skills.length
    ? clamp((keywordHits.filter((k) => skills.includes(k)).length / Math.min(skills.length, 12)) * 10, 0, 10)
    : 5;

  const titleHit = titles.some((t) => jobTitle.toLowerCase().includes(t) || t.includes(jobTitle.toLowerCase()));
  const overlap = [...jobTokens].filter((t) => profileTokens.has(t)).length;
  const experienceScore = clamp((overlap / Math.max(40, jobTokens.size * 0.15)) * 10, 2, 10);
  const domainScore = titleHit ? 8.5 : clamp(skillScore * 0.7 + 2, 3, 9);
  const seniorityScore = /senior|staff|principal|director|lead/i.test(jobTitle)
    ? /senior|staff|lead|principal|director/i.test(profile.experiences.map((e) => e.title).join(" "))
      ? 8
      : 5
    : 7;
  const logisticsScore = (() => {
    const remoteJob = /remote/i.test(jobText);
    if (profile.remotePreference === "any") return 8;
    if (profile.remotePreference === "remote") return remoteJob ? 9 : 4;
    if (profile.remotePreference === "onsite") return remoteJob ? 4 : 8;
    return 7;
  })();

  const score = Number(
    (
      skillScore * 0.3 +
      experienceScore * 0.3 +
      domainScore * 0.2 +
      seniorityScore * 0.1 +
      logisticsScore * 0.1
    ).toFixed(1),
  );

  const recommendation = score >= 8 ? "apply" : score >= 6 ? "review" : "skip";
  return {
    score,
    recommendation,
    summary: `Heuristic fit ${score}/10 based on skill overlap (${keywordHits.slice(0, 8).join(", ") || "limited"}) and title/experience match.`,
    strengths: keywordHits.slice(0, 8),
    gaps: [...jobTokens]
      .filter((t) => !profileTokens.has(t) && t.length > 4)
      .slice(0, 6),
    keywordHits,
    breakdown: {
      skills: Number(skillScore.toFixed(1)),
      experience: Number(experienceScore.toFixed(1)),
      domain: Number(domainScore.toFixed(1)),
      seniority: Number(seniorityScore.toFixed(1)),
      logistics: Number(logisticsScore.toFixed(1)),
    },
    model: "heuristic",
  };
}

export async function analyzeFitment(
  profile: ProfileBundle,
  job: { title: string; company: string; location?: string | null; description: string },
): Promise<FitmentResult> {
  const heuristic = heuristicFit(profile, job.title, job.description);
  if (!aiConfigured()) return heuristic;

  try {
    const result = await chatJson<FitmentResult>([
      {
        role: "system",
        content: `You are Octave, a personal headhunter. Score candidate-job fit from 0 to 10.
Return JSON only with keys: score (number 0-10, one decimal), recommendation ("apply"|"review"|"skip"),
summary (2-4 sentences), strengths (string[]), gaps (string[]), keywordHits (string[]),
breakdown { skills, experience, domain, seniority, logistics } each 0-10.
Use "apply" only if score >= 8 AND the candidate could credibly do the job without fabricating experience.
Never invent employers, titles, or skills the candidate did not list.`,
      },
      {
        role: "user",
        content: `CANDIDATE\n${profileToPlainText(profile)}\n\nJOB\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location || ""}\n\n${job.description.slice(0, 12000)}`,
      },
    ]);
    result.score = clamp(Number(result.score) || heuristic.score, 0, 10);
    result.recommendation =
      result.recommendation === "apply" || result.recommendation === "skip"
        ? result.recommendation
        : result.score >= 8
          ? "apply"
          : result.score >= 6
            ? "review"
            : "skip";
    result.model = process.env.AI_MODEL || "openai-compatible";
    result.strengths = result.strengths ?? [];
    result.gaps = result.gaps ?? [];
    result.keywordHits = result.keywordHits ?? heuristic.keywordHits;
    result.breakdown = result.breakdown ?? heuristic.breakdown;
    return result;
  } catch {
    return heuristic;
  }
}
