import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

function boards(): string[] {
  return (process.env.GREENHOUSE_BOARDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const greenhouseProvider: JobProvider = {
  id: "greenhouse",
  label: "Greenhouse boards",
  enabled: () => boards().length > 0,
  async search(params: SearchParams): Promise<JobListing[]> {
    const q = params.query.toLowerCase();
    const listings: JobListing[] = [];
    for (const board of boards()) {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        jobs?: Array<{
          id: number;
          title: string;
          absolute_url: string;
          updated_at?: string;
          location?: { name?: string };
          content?: string;
          departments?: Array<{ name?: string }>;
        }>;
      };
      for (const j of data.jobs ?? []) {
        const hay = `${j.title} ${j.location?.name ?? ""} ${j.content ?? ""}`.toLowerCase();
        if (q && !hay.includes(q)) continue;
        listings.push({
          externalId: `${board}-${j.id}`,
          provider: "greenhouse",
          title: j.title,
          company: board,
          location: j.location?.name,
          remote: /remote/i.test(j.location?.name || ""),
          url: j.absolute_url,
          applyUrl: j.absolute_url,
          description: (j.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          postedAt: j.updated_at,
          raw: j,
        });
      }
    }
    return listings.slice(0, 50);
  },
};
