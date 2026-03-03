export type Tier = 1 | 2 | 3 | 4 | 5;

export type TierLabel =
  | "UAE / Gulf"
  | "Regional"
  | "International"
  | "Israel / Palestine"
  | "Multilateral";

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  tier: Tier;
  tierLabel: TierLabel;
  color: string;
}

export interface Article {
  id: string;
  title: string;
  titleJa?: string;
  summary: string;
  summaryJa?: string;
  link: string;
  pubDate: string;
  source: FeedSource;
  imageUrl?: string;
}

export type FilterTier = "all" | Tier;

export type Language = "en" | "ja";
