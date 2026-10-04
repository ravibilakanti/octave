import { adzunaProvider } from "@/lib/jobs/providers/adzuna";
import { greenhouseProvider } from "@/lib/jobs/providers/greenhouse";
import { jsearchProvider } from "@/lib/jobs/providers/jsearch";
import { remotiveProvider } from "@/lib/jobs/providers/remotive";
import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

export const providers: JobProvider[] = [
  remotiveProvider,
  adzunaProvider,
  jsearchProvider,
  greenhouseProvider,
];

export function enabledProviders(): JobProvider[] {
  return providers.filter((p) => {
    try {
      return p.enabled();
    } catch {
      return false;
    }
  });
}

export async function searchJobs(params: SearchParams): Promise<{
  listings: JobListing[];
  errors: Array<{ provider: string; message: string }>;
}> {
  const active = enabledProviders();
  if (active.length === 0) {
    return {
      listings: [],
      errors: [
        {
          provider: "none",
          message:
            "No job providers enabled. Set REMOTIVE_ENABLED=true or add Adzuna / JSearch / Greenhouse keys in .env",
        },
      ],
    };
  }

  const settled = await Promise.allSettled(
    active.map(async (p) => ({ id: p.id, listings: await p.search(params) })),
  );

  const listings: JobListing[] = [];
  const errors: Array<{ provider: string; message: string }> = [];
  const seen = new Set<string>();

  for (const result of settled) {
    if (result.status === "fulfilled") {
      for (const job of result.value.listings) {
        const key = `${job.provider}:${job.externalId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        listings.push(job);
      }
    } else {
      errors.push({
        provider: "unknown",
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  return { listings, errors };
}
