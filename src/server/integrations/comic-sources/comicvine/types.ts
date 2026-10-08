import type { ComicVineImage } from "./mappers";

export interface CvPublisherRef {
  id: number;
  name: string;
}

export interface CvVolume {
  id: number;
  name: string;
  start_year: string | number | null;
  publisher: CvPublisherRef | null;
}

export interface CvCharacterDetail {
  id: number;
  name: string;
  real_name?: string | null;
  deck?: string | null;
  publisher: CvPublisherRef | null;
  image?: ComicVineImage | null;
  count_of_issue_appearances?: number | null;
  first_appeared_in_issue?: { id: number } | null;
  issue_credits?: { id: number }[] | null;
}

export interface CvIssueSummary {
  id: number;
  name: string | null;
  issue_number: string | null;
  cover_date: string | null;
  store_date: string | null;
  image?: ComicVineImage | null;
  description?: string | null;
}
export interface CvVolumeSearchResult extends CvVolume {
  count_of_issues: number | null;
  image?: ComicVineImage | null;
}
