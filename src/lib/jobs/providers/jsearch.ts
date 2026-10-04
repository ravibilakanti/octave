import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

export const jsearchProvider: JobProvider = {
  id: "jsearch",
  label: "JSearch",
  enabled: () => Boolean(process.env.JSEARCH_API_KEY),
  async search(params: SearchParams): Promise<JobListing[]> {
    const host = process.env.JSEARCH_HOST || "jsearch.p.rapidapi.com";
    const url = new URL(`https://${host}/search`);
    url.searchParams.set("query", params.location ? `${params.query} in ${params.location}` : params.query);
    url.searchParams.set("page", String(params.page ?? 1));
    url.searchParams.set("num_pages", "1");
    if (params.remoteOnly) url.searchParams.set("remote_jobs_only", "true");

    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.JSEARCH_API_KEY!,
        "X-RapidAPI-Host": host,
      },
    });
    if (!res.ok) throw new Error(`JSearch error ${res.status}`);
    const data = (await res.json()) as {
      data?: Array<{
        job_id: string;
        job_title: string;
        employer_name: string;
        job_city?: string;
        job_state?: string;
        job_country?: string;
        job_is_remote?: boolean;
        job_apply_link?: string;
        job_description?: string;
        job_min_salary?: number;
        job_max_salary?: number;
        job_posted_at_datetime_utc?: string;
        job_apply_email?: string;
      }>;
    };

    return (data.data ?? []).map((j) => ({
      externalId: j.job_id,
      provider: "jsearch",
      title: j.job_title,
      company: j.employer_name,
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", "),
      remote: Boolean(j.job_is_remote),
      url: j.job_apply_link,
      applyUrl: j.job_apply_link,
      applyEmail: j.job_apply_email,
      description: j.job_description || "",
      salary:
        j.job_min_salary || j.job_max_salary
          ? `${j.job_min_salary ?? "?"}–${j.job_max_salary ?? "?"}`
          : undefined,
      postedAt: j.job_posted_at_datetime_utc,
      raw: j,
    }));
  },
};
