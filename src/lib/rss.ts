import Parser from "rss-parser";
import { Article, FeedSource } from "@/types";
import { FEED_SOURCES } from "./feeds";
import { getCache, setCache } from "./cache";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "MiddleEastNewsAggregator/1.0",
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
      imageUrl:
        item.enclosure?.url ||
        extractImageFromContent(item.content || item["content:encoded"] || ""),
    }));
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${source.name}:`, err);
    return [];
  }
}

function extractImageFromContent(content: string): string | undefined {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1];
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

  // Sort: Tier 1 first, then by date descending
  articles.sort((a, b) => {
    if (a.source.tier !== b.source.tier) return a.source.tier - b.source.tier;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  setCache(cacheKey, articles);
  return articles;
}
