import type { JobListing, JobProvider, SearchParams } from "@/lib/jobs/types";

/**
 * Copy this file, rename it, implement search(), then add the export
 * to the providers array in src/lib/jobs/search.ts.
 */
export const exampleProvider: JobProvider = {
  id: "example",
  label: "Example board",
  enabled: () => Boolean(process.env.EXAMPLE_API_KEY),
  async search(params: SearchParams): Promise<JobListing[]> {
    void params;
    return [];
  },
};
