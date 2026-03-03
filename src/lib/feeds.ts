import { FeedSource } from "@/types";

export const FEED_SOURCES: FeedSource[] = [
  // Tier 1 — UAE / Gulf
  {
    id: "gulf-news",
    name: "Gulf News",
    url: "https://gulfnews.com/feed",
    tier: 1,
    tierLabel: "UAE / Gulf",
    color: "#A0674B",
  },
  {
    id: "wam-google",
    name: "WAM / Reuters (via Google)",
    url: "https://news.google.com/rss/search?q=site:wam.ae+OR+site:reuters.com+middle+east+UAE&hl=en",
    tier: 1,
    tierLabel: "UAE / Gulf",
    color: "#A0674B",
  },

  // Tier 2 — Regional Middle East
  {
    id: "aljazeera",
    name: "Al Jazeera English",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    tier: 2,
    tierLabel: "Regional",
    color: "#B8A080",
  },
  {
    id: "al-monitor",
    name: "Al-Monitor",
    url: "https://www.al-monitor.com/rss",
    tier: 2,
    tierLabel: "Regional",
    color: "#B8A080",
  },
  {
    id: "new-arab",
    name: "The New Arab",
    url: "https://www.newarab.com/rss",
    tier: 2,
    tierLabel: "Regional",
    color: "#B8A080",
  },
  {
    id: "france24",
    name: "France 24",
    url: "https://www.france24.com/en/middle-east/rss",
    tier: 2,
    tierLabel: "Regional",
    color: "#B8A080",
  },

  // Tier 3 — International
  {
    id: "bbc",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    tier: 3,
    tierLabel: "International",
    color: "#8B7355",
  },
  {
    id: "guardian",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/middleeast/rss",
    tier: 3,
    tierLabel: "International",
    color: "#8B7355",
  },
  {
    id: "nyt",
    name: "New York Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml",
    tier: 3,
    tierLabel: "International",
    color: "#8B7355",
  },
  {
    id: "npr",
    name: "NPR",
    url: "https://feeds.npr.org/1009/rss.xml",
    tier: 3,
    tierLabel: "International",
    color: "#8B7355",
  },

  // Tier 4 — Israel/Palestine
  {
    id: "haaretz",
    name: "Haaretz",
    url: "https://www.haaretz.com/srv/Middle-East-News-rss",
    tier: 4,
    tierLabel: "Israel / Palestine",
    color: "#C9B9A8",
  },
  {
    id: "toi",
    name: "Times of Israel",
    url: "https://www.timesofisrael.com/feed/",
    tier: 4,
    tierLabel: "Israel / Palestine",
    color: "#C9B9A8",
  },
];

export const TIER_LABELS: Record<number, string> = {
  1: "UAE / Gulf",
  2: "Regional",
  3: "International",
  4: "Israel / Palestine",
};
