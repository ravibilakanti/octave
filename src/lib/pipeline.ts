import { applyWithAdapters } from "@/lib/apply";
import { tailorAtsResume, writeCoverLetter } from "@/lib/ats";
import { prisma } from "@/lib/db";
import { analyzeFitment } from "@/lib/fitment";
import { searchJobs } from "@/lib/jobs/search";
import type { JobListing } from "@/lib/jobs/types";
import { getProfileBundle } from "@/lib/profile";
import { toJson } from "@/lib/utils";

export async function upsertListings(listings: JobListing[]) {
  const jobs = [];
  for (const listing of listings) {
    const job = await prisma.job.upsert({
      where: {
        provider_externalId: { provider: listing.provider, externalId: listing.externalId },
      },
      update: {
        title: listing.title,
        company: listing.company,
        location: listing.location,
        remote: Boolean(listing.remote),
        url: listing.url,
        applyUrl: listing.applyUrl,
        applyEmail: listing.applyEmail,
        description: listing.description,
        salary: listing.salary,
        postedAt: listing.postedAt,
        rawJson: toJson(listing.raw ?? listing),
      },
      create: {
        externalId: listing.externalId,
        provider: listing.provider,
        title: listing.title,
        company: listing.company,
        location: listing.location,
        remote: Boolean(listing.remote),
        url: listing.url,
        applyUrl: listing.applyUrl,
        applyEmail: listing.applyEmail,
        description: listing.description,
        salary: listing.salary,
        postedAt: listing.postedAt,
        rawJson: toJson(listing.raw ?? listing),
      },
    });
    jobs.push(job);
  }
  return jobs;
}

export async function searchAndStore(params: {
  query: string;
  location?: string;
  remoteOnly?: boolean;
}) {
  const { listings, errors } = await searchJobs(params);
  const jobs = await upsertListings(listings);
  return { jobs, errors, found: listings.length };
}

export async function analyzeJob(jobId: string) {
  const [profile, job] = await Promise.all([
    getProfileBundle(),
    prisma.job.findUniqueOrThrow({ where: { id: jobId } }),
  ]);
  const result = await analyzeFitment(profile, job);
  const analysis = await prisma.fitment.create({
    data: {
      jobId: job.id,
      score: result.score,
      recommendation: result.recommendation,
      summary: result.summary,
      strengths: toJson(result.strengths),
      gaps: toJson(result.gaps),
      keywordHits: toJson(result.keywordHits),
      breakdown: toJson(result.breakdown),
      model: result.model,
    },
  });
  return { job, analysis, result };
}

export async function analyzeUnscored(limit = 15, jobIds?: string[]) {
  const jobs = await prisma.job.findMany({
    where: { ...(jobIds?.length ? { id: { in: jobIds } } : {}), analyses: { none: {} } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const results = [];
  for (const job of jobs) {
    results.push(await analyzeJob(job.id));
  }
  return results;
}

export async function prepareAndApply(jobId: string, opts?: { force?: boolean }) {
  const profile = await getProfileBundle();
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const minScore = profile.minFitScore ?? 8;
  let score = job.analyses[0]?.score;
  if (score == null) {
    const analyzed = await analyzeJob(jobId);
    score = analyzed.result.score;
  }

  if (!opts?.force && score < minScore) {
    throw new Error(`Fitment ${score}/10 is below the ${minScore}/10 bar. Use force to override.`);
  }

  const resumeText = await tailorAtsResume(profile, job);
  const coverLetter = await writeCoverLetter(profile, job);

  await prisma.resumeVersion.create({
    data: {
      profileId: profile.id,
      jobId: job.id,
      kind: "ats",
      title: `ATS — ${job.title} @ ${job.company}`,
      content: resumeText,
    },
  });

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      status: "preparing",
      channel: "packet",
      fitScore: score,
      resumeText,
      coverLetter,
      events: {
        create: { status: "preparing", message: `ATS packet generated. Fit ${score}/10.` },
      },
    },
  });

  const results = await applyWithAdapters({
    jobTitle: job.title,
    company: job.company,
    applyUrl: job.applyUrl || job.url,
    applyEmail: job.applyEmail,
    candidateName: profile.fullName,
    candidateEmail: profile.email,
    resumeText,
    coverLetter,
  });

  const emailed = results.some((r) => r.channel === "email" && r.ok);
  const status = emailed ? "applied" : "ready";
  const channel = emailed ? "email" : "packet";

  await prisma.application.update({
    where: { id: application.id },
    data: {
      status,
      channel,
      submittedAt: emailed ? new Date() : null,
      notes: results.map((r) => r.message).join("\n"),
      events: {
        create: results.map((r) => ({
          status: r.ok ? status : "error",
          message: r.message,
        })),
      },
    },
  });

  return prisma.application.findUniqueOrThrow({
    where: { id: application.id },
    include: { job: true, events: { orderBy: { createdAt: "asc" } } },
  });
}

export async function autoApplyEligible(jobIds?: string[]) {
  const profile = await getProfileBundle();
  if (!profile.autoApply) return { skipped: true, reason: "auto-apply is off", applied: [] as string[], ready: [] as string[], errors: [] as Array<{ jobId: string; message: string }> };

  const maxDaily = Math.max(1, Number(process.env.MAX_AUTO_APPLICATIONS_PER_RUN || 10));
  const min = profile.minFitScore;
  const eligible = await prisma.job.findMany({
    where: {
      ...(jobIds?.length ? { id: { in: jobIds } } : {}),
      applications: { none: {} },
      analyses: { some: { score: { gte: min } } },
    },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: maxDaily,
  });

  const applied: string[] = [];
  const ready: string[] = [];
  const errors: Array<{ jobId: string; message: string }> = [];
  for (const job of eligible) {
    try {
      const application = await prepareAndApply(job.id);
      if (application.status === "applied") applied.push(job.id);
      else ready.push(job.id);
    } catch (e) {
      errors.push({ jobId: job.id, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return { skipped: false, applied, ready, errors };
}
