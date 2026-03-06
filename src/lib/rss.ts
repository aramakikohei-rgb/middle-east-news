import Parser from "rss-parser";
import { Article, FeedSource } from "@/types";
import { FEED_SOURCES } from "./feeds";
import { getCache, setCache } from "./cache";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "MiddleEastNewsAggregator/1.0",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function createArticleId(source: FeedSource, link: string): string {
  return `${source.id}::${Buffer.from(link).toString("base64url")}`;
}

async function fetchFeed(source: FeedSource): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 20).map((item) => ({
      id: createArticleId(source, item.link || item.guid || ""),
      title: item.title || "Untitled",
      summary: stripHtml(
        item.contentSnippet || item.content || item.summary || ""
      ).slice(0, 300),
      link: item.link || "",
      pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
      source,
      imageUrl: extractImageUrl(item),
    }));
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${source.name}:`, err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImageUrl(item: any): string | undefined {
  // 1. enclosure (France 24)
  if (item.enclosure?.url) return item.enclosure.url;

  // 2. media:content (Guardian, NYT, Gulf News)
  if (item.mediaContent?.length) {
    const url = item.mediaContent[0]?.$?.url;
    if (url) return url;
  }

  // 3. media:thumbnail (BBC, France 24, Gulf News)
  if (item.mediaThumbnail?.length) {
    const url = item.mediaThumbnail[0]?.$?.url;
    if (url) return url;
  }

  // 4. <img> tag in content (Times of Israel, Gulf News)
  const content = item.content || item["content:encoded"] || "";
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
  return match?.[1];
}

const CONFLICT_KEYWORDS = [
  // War & military
  "war", "conflict", "military", "army", "troops", "soldier", "strike",
  "airstrike", "air strike", "bombing", "bomb", "missile", "rocket",
  "attack", "offensive", "invasion", "ceasefire", "cease-fire",
  "frontline", "battlefield", "combat", "weapon", "artillery",
  "drone", "navy", "warship", "aircraft carrier", "fighter jet",
  // Geopolitical actors
  "iran", "israel", "gaza", "hamas", "hezbollah", "houthi",
  "idf", "irgc", "pentagon", "netanyahu", "khamenei",
  "palestine", "palestinian", "west bank", "golan", "lebanon",
  "syria", "yemen", "iraq", "tehran", "tel aviv", "jerusalem",
  // Diplomacy & sanctions
  "sanction", "diplomacy", "diplomatic", "negotiation", "treaty",
  "un security council", "resolution", "embargo", "nuclear",
  "enrichment", "uranium",
  // Humanitarian
  "casualty", "casualties", "civilian", "refugee", "displaced",
  "humanitarian", "aid", "evacuation", "shelter", "siege",
  "blockade", "famine", "crisis",
  // Security & intelligence
  "intelligence", "espionage", "assassination", "militia",
  "insurgent", "terrorism", "terrorist", "security",
  "defense", "defence", "escalation", "retaliation", "deterrence",
  // UAE-specific conflict relevance
  "uae airspace", "abu dhabi defense", "dubai security",
  "gulf security", "gcc", "strait of hormuz", "persian gulf",
];

const CONFLICT_PATTERN = new RegExp(
  CONFLICT_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);

function isConflictRelated(article: Article): boolean {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return CONFLICT_PATTERN.test(text);
}

export async function fetchAllFeeds(): Promise<Article[]> {
  const cacheKey = "all-feeds";
  const cached = getCache<Article[]>(cacheKey);
  if (cached) return cached;

  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  );

  const articles: Article[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        const dedupeKey = article.title.toLowerCase().slice(0, 60);
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          articles.push(article);
        }
      }
    }
  }

  // Filter to conflict-related articles only
  const relevant = articles.filter(isConflictRelated);

  // Sort: Tier 1 first, then by date descending
  relevant.sort((a, b) => {
    if (a.source.tier !== b.source.tier) return a.source.tier - b.source.tier;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  // Scrape og:image for articles missing images (Al Jazeera, NPR, etc.)
  const missing = relevant.filter((a) => !a.imageUrl);
  if (missing.length > 0) {
    const ogResults = await Promise.allSettled(
      missing.slice(0, 15).map((a) => scrapeOgImage(a.link))
    );
    ogResults.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        missing[i].imageUrl = result.value;
      }
    });
  }

  // Filter out junk images (logos, tiny icons, SVGs) and assign Unsplash fallbacks
  for (const article of relevant) {
    if (!article.imageUrl || isJunkImage(article.imageUrl)) {
      article.imageUrl = getFallbackImage(article.title);
    }
  }

  setCache(cacheKey, relevant);
  return relevant;
}

// Detect logos, icons, and other non-article images
function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("logo") ||
    lower.includes("icon") ||
    lower.includes("favicon") ||
    lower.includes("badge") ||
    lower.includes("avatar") ||
    lower.endsWith(".svg") ||
    lower.includes("google.com/images/branding") ||
    lower.includes("gstatic.com") ||
    lower.includes("/logos/") ||
    // Google News thumbnail (low-quality, often just the publisher logo)
    lower.includes("news.google.com") ||
    // Google user content (generic aggregator thumbnails)
    lower.includes("googleusercontent.com")
  );
}

// Curated Unsplash photos: Middle East cityscapes, architecture, landscapes, geopolitics
const FALLBACK_PHOTOS = [
  "photo-1512453979798-5ea266f8880c", // Dubai skyline
  "photo-1518684079-3c830dcef090", // Dubai aerial
  "photo-1564769625905-50e93615e769", // Abu Dhabi mosque
  "photo-1547483238-f400e65ccd56", // Jerusalem old city
  "photo-1509316785289-025f5b846b35", // Desert dunes
  "photo-1466442929976-97f336a657be", // Middle East cityscape
  "photo-1548199569-3e1c6aa8f469", // Middle East architecture
  "photo-1549877452-9c387954fbc2", // Aerial desert city
  "photo-1578895101408-1a36b834405b", // Tehran skyline
  "photo-1558618666-fcd25c85f82e", // Mosque interior
  "photo-1590076215667-875d4ef2d7de", // Beirut
  "photo-1553522991-71439aa62779", // Desert road
  "photo-1580619305218-8423a7ef79b4", // Sand patterns
  "photo-1517483000871-1dbf64a6e1c6", // Sunset over city
  "photo-1559827291-baf5c1bfe498", // Middle East market
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getFallbackImage(title: string): string {
  const index = hashString(title) % FALLBACK_PHOTOS.length;
  return `https://images.unsplash.com/${FALLBACK_PHOTOS[index]}?w=800&h=500&fit=crop&auto=format&q=80`;
}

async function scrapeOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MiddleEastNewsAggregator/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}
