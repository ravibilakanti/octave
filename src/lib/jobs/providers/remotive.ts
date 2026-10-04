import { envFlag } from "@/lib/utils";
import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const remotiveProvider: JobProvider = {
  id: "remotive",
  label: "Remotive",
  enabled: () => envFlag("REMOTIVE_ENABLED", true),
  async search(params: SearchParams): Promise<JobListing[]> {
    const url = new URL("https://remotive.com/api/remote-jobs");
    if (params.query) url.searchParams.set("search", params.query);
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Remotive error ${res.status}`);
    const data = (await res.json()) as {
      jobs?: Array<{
        id: number;
        title: string;
        company_name: string;
        candidate_required_location?: string;
        url: string;
        description: string;
        salary?: string;
        publication_date?: string;
        job_type?: string;
      }>;
    };
    return (data.jobs ?? []).slice(0, 40).map((j) => ({
      externalId: String(j.id),
      provider: "remotive",
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      remote: true,
      url: j.url,
      applyUrl: j.url,
      description: stripHtml(j.description || ""),
      salary: j.salary,
      postedAt: j.publication_date,
      raw: j,
    }));
  },
};
