import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { prisma } from "../src/lib/db";
import { analyzeUnscored, searchAndStore } from "../src/lib/pipeline";
import { getProfileBundle } from "../src/lib/profile";
import { parseJson, toJson } from "../src/lib/utils";

async function main() {
  const run = await prisma.automationRun.create({ data: { trigger: "scheduled" } });
  const errors: Array<{ source: string; message: string }> = [];
  const jobIds = new Set<string>();
  let searchesRun = 0;
  let jobsFound = 0;

  try {
    const profile = await getProfileBundle();
    const saved = await prisma.savedSearch.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    const titles = parseJson<string[]>(profile.targetTitles, []);
    const keywords = parseJson<string[]>(profile.keywords, []);
    const fallbackQuery = [...titles.slice(0, 4), ...keywords.slice(0, 8)].join(" ");
    const searches = saved.length ? saved : [{
      query: fallbackQuery || "senior program manager",
      location: profile.location || "",
      remoteOnly: profile.remotePreference === "remote",
    }];

    for (const search of searches) {
      const result = await searchAndStore({
        query: search.query,
        location: search.location || profile.location || undefined,
        remoteOnly: search.remoteOnly,
      });
      searchesRun += 1;
      jobsFound += result.jobs.length;
      result.jobs.forEach((job) => jobIds.add(job.id));
      result.errors.forEach((e) => errors.push({
        source: "search:" + search.query,
        message: e.provider + ": " + e.message,
      }));
    }

    const analyzed = await analyzeUnscored(
      Math.max(15, Number(process.env.MAX_JOBS_TO_ANALYZE_PER_RUN || 50)),
      [...jobIds],
    );

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: "completed",
        searchesRun,
        jobsFound,
        jobsAnalyzed: analyzed.length,
        errors: toJson(errors),
        summary: "Ran " + searchesRun + " searches; found " + jobsFound +
          " jobs; analyzed " + analyzed.length + ".",
      },
    });
  } catch (e) {
    errors.push({ source: "run", message: e instanceof Error ? e.message : String(e) });
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: "failed",
        errors: toJson(errors),
        summary: "Automation run failed.",
      },
    });
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
