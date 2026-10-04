import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  label: "Adzuna",
  enabled: () => Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
  async search(params: SearchParams): Promise<JobListing[]> {
    const country = process.env.ADZUNA_COUNTRY || "us";
    const page = params.page ?? 1;
    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
    );
    url.searchParams.set("app_id", process.env.ADZUNA_APP_ID!);
    url.searchParams.set("app_key", process.env.ADZUNA_APP_KEY!);
    url.searchParams.set("results_per_page", "20");
    url.searchParams.set("what", params.query);
    if (params.location) url.searchParams.set("where", params.location);
    if (params.remoteOnly) url.searchParams.set("what", `${params.query} remote`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Adzuna error ${res.status}`);
    const data = (await res.json()) as {
      results?: Array<{
        id: string;
        title: string;
        company?: { display_name?: string };
        location?: { display_name?: string };
        redirect_url?: string;
        description?: string;
        salary_min?: number;
        salary_max?: number;
        created?: string;
      }>;
    };

    return (data.results ?? []).map((j) => ({
      externalId: String(j.id),
      provider: "adzuna",
      title: j.title,
      company: j.company?.display_name || "Unknown",
      location: j.location?.display_name,
      remote: /remote/i.test(`${j.title} ${j.description}`),
      url: j.redirect_url,
      applyUrl: j.redirect_url,
      description: stripHtml(j.description || ""),
      salary:
        j.salary_min || j.salary_max
          ? `${j.salary_min ?? "?"}–${j.salary_max ?? "?"}`
          : undefined,
      postedAt: j.created,
      raw: j,
    }));
  },
};
