import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { prisma } from "../src/lib/db";
import { analyzeUnscored, autoApplyEligible, searchAndStore } from "../src/lib/pipeline";
import { parseJson, toJson } from "../src/lib/utils";

async function runForProfile(profile: { id: string; location: string | null; remotePreference: string; targetTitles: string; keywords: string[] | string; minFitScore: number; autoApply: boolean }) {
  const run = await prisma.automationRun.create({ data: { profileId: profile.id, trigger: "scheduled" } });
  const errors: Array<{ source: string; message: string }> = [];
  const jobIds = new Set<string>();
  let searchesRun = 0, jobsFound = 0;

  try {
    const saved = await prisma.savedSearch.findMany({
      where: { profileId: profile.id, active: true }, orderBy: { createdAt: "asc" },
    });
    const titles = parseJson<string[]>(profile.targetTitles, []);
    const keywords = parseJson<string[]>(typeof profile.keywords === "string" ? profile.keywords : JSON.stringify(profile.keywords), []);
    const fallbackQuery = [...titles.slice(0, 4), ...keywords.slice(0, 8)].join(" ");
    const searches = saved.length ? saved : [{
      query: fallbackQuery || "senior program manager",
      location: profile.location || "",
      remoteOnly: profile.remotePreference === "remote",
    }];

    for (const search of searches) {
      const result = await searchAndStore({
        query: search.query, location: search.location || profile.location || undefined, remoteOnly: search.remoteOnly,
      }, profile.id);
      searchesRun++; jobsFound += result.jobs.length;
      result.jobs.forEach((job) => jobIds.add(job.id));
      result.errors.forEach((e) => errors.push({ source: "search:" + search.query, message: e.provider + ": " + e.message }));
    }

    const analyzed = await analyzeUnscored(
      Math.max(15, Number(process.env.MAX_JOBS_TO_ANALYZE_PER_RUN || 50)), [...jobIds], profile.id,
    );
    const apply = await autoApplyEligible([...jobIds], profile.id);
    errors.push(...apply.errors.map((e) => ({ source: "apply:" + e.jobId, message: e.message })));

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(), status: "completed", searchesRun, jobsFound, jobsAnalyzed: analyzed.length,
        applicationsSent: apply.applied.length, packetsReady: apply.ready.length, errors: toJson(errors),
        summary: `Ran ${searchesRun} searches; found ${jobsFound}; analyzed ${analyzed.length}; submitted ${apply.applied.length}; ready ${apply.ready.length}.`,
      },
    });
  } catch (e) {
    errors.push({ source: "run", message: e instanceof Error ? e.message : String(e) });
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), status: "failed", errors: toJson(errors), summary: "Automation run failed." },
    });
  }
}

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, location: true, remotePreference: true, targetTitles: true, keywords: true, minFitScore: true, autoApply: true },
  });
  for (const profile of profiles) await runForProfile(profile);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
