export type JobListing = {
  externalId: string;
  provider: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  url?: string;
  applyUrl?: string;
  applyEmail?: string;
  description: string;
  salary?: string;
  postedAt?: string;
  raw?: unknown;
};

export type SearchParams = {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  page?: number;
};

export type JobProvider = {
  id: string;
  label: string;
  enabled: () => boolean;
  search: (params: SearchParams) => Promise<JobListing[]>;
};
