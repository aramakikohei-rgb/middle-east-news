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

// Pick the media element with the largest width, falling back to the last entry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickLargestMedia(mediaArray: any[]): string | undefined {
  let bestUrl: string | undefined;
  let bestWidth = 0;
  for (const entry of mediaArray) {
    const url = entry?.$?.url;
    if (!url) continue;
    const w = parseInt(entry.$.width, 10) || 0;
    if (w >= bestWidth) {
      bestWidth = w;
      bestUrl = url;
    }
  }
  return bestUrl;
}

// Parse srcset from <img> tags and return the URL with the largest width descriptor
function pickLargestSrcsetImage(html: string): string | undefined {
  const srcsetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);
  if (!srcsetMatch) return undefined;
  let bestUrl: string | undefined;
  let bestWidth = 0;
  for (const entry of srcsetMatch[1].split(",")) {
    const parts = entry.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || "";
    const w = parseInt(descriptor, 10) || 0;
    if (url && w >= bestWidth) {
      bestWidth = w;
      bestUrl = url;
    }
  }
  return bestUrl;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImageUrl(item: any): string | undefined {
  // 1. enclosure (France 24)
  if (item.enclosure?.url) return item.enclosure.url;

  // 2. media:content — pick largest resolution (Guardian, NYT, Gulf News)
  if (item.mediaContent?.length) {
    const url = pickLargestMedia(item.mediaContent);
    if (url) return url;
  }

  // 3. media:thumbnail — pick largest resolution (BBC, France 24, Gulf News)
  if (item.mediaThumbnail?.length) {
    const url = pickLargestMedia(item.mediaThumbnail);
    if (url) return url;
  }

  // 4. <img> tag in content (Times of Israel, Gulf News)
  // Prefer the largest image from srcset if available, otherwise pick the last
  // (often highest-res) <img> src in the content.
  const content = item.content || item["content:encoded"] || "";
  const srcsetImg = pickLargestSrcsetImage(content);
  if (srcsetImg) return srcsetImg;

  // Collect all <img> src values and pick the last one (often the main image)
  const imgMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)];
  if (imgMatches.length) return imgMatches[imgMatches.length - 1][1];
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

  // Assign unique images: filter junk, deduplicate, fill gaps with Unsplash
  const usedImages = new Set<string>();
  let fallbackIndex = 0;
  for (const article of relevant) {
    const url = article.imageUrl;
    const needsFallback =
      !url || isJunkImage(url) || usedImages.has(url);
    if (needsFallback) {
      const fallback = getNextFallbackImage(fallbackIndex, usedImages);
      article.imageUrl = fallback;
      usedImages.add(fallback);
      fallbackIndex++;
    } else {
      usedImages.add(url);
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
  "photo-1596394516093-501ba68a0ba6", // Mosque silhouette
  "photo-1590076215667-875d4ef2d7de", // Beirut
  "photo-1553522991-71439aa62779", // Desert road
  "photo-1580619305218-8423a7ef79b4", // Sand patterns
  "photo-1517483000871-1dbf64a6e1c6", // Sunset over city
  "photo-1524492412937-b28074a5d7da", // Middle East street
  "photo-1523978591478-c753949ff840", // Desert sunset
  "photo-1499856871958-5b9627545d1a", // City night
  "photo-1569839333583-7375336cde4b", // Mosque dome aerial
  "photo-1586699253884-e199770f63b9", // Sand dunes sunset
  "photo-1540959733332-eab4deabeeaf", // City aerial
  "photo-1573348722427-f1d6819fdf98", // Desert camp
  "photo-1504384308090-c894fdcc538d", // Tech/data center
  "photo-1541443131876-44b03de101c5", // Skyline dusk
  "photo-1526495124232-a04e1849168c", // Diplomacy/conference
  "photo-1495020689067-958852a7765e", // Newspaper/press
  "photo-1565008447742-97f6f38c985c", // Globe
  "photo-1569863959165-56dae551d4fc", // Ancient ruins
  "photo-1570168007204-dfb528c6958f", // Persian architecture
  "photo-1563207153-f403bf289096", // Minaret at sunset
  "photo-1548013146-72479768bada", // Taj cityscape
  "photo-1561361058-c24cecae35ca", // Oil refinery
  "photo-1518709779341-56cf4535e94b", // Military/defense
  "photo-1507003211169-0a1dd7228f2d", // Portrait/diplomacy
  "photo-1502920917128-1aa500764cbd", // Newspaper
  "photo-1557804506-669a67965ba0", // Boardroom
  "photo-1476231682828-37e571bc172f", // Sunset landscape
  "photo-1462332420958-a05d1e002413", // Night city lights
  "photo-1519389950473-47ba0277781c", // Tech/screens
  "photo-1488590528505-98d2b5aba04b", // Digital/tech
  "photo-1551288049-bebda4e38f71", // Data dashboard
];

function getNextFallbackImage(index: number, usedImages: Set<string>): string {
  for (let i = 0; i < FALLBACK_PHOTOS.length; i++) {
    const photoIndex = (index + i) % FALLBACK_PHOTOS.length;
    const url = `https://images.unsplash.com/${FALLBACK_PHOTOS[photoIndex]}?w=1600&h=1000&fit=crop&auto=format&q=80`;
    if (!usedImages.has(url)) return url;
  }
  // All photos used — append unique suffix to avoid Set collision
  return `https://images.unsplash.com/${FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length]}?w=1600&h=1000&fit=crop&auto=format&q=80&v=${index}`;
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
