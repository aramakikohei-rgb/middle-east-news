"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Article, FilterTier, Language } from "@/types";
import Header from "@/components/Header";
import FeedFilter from "@/components/FeedFilter";
import NewsCard from "@/components/NewsCard";
import HeroArticle from "@/components/HeroArticle";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ARTICLES_PER_PAGE = 30;

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<FilterTier>("all");
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [fetchedAt, setFetchedAt] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const translationCache = useRef<
    Map<string, { titleJa: string; summaryJa: string }>
  >(new Map());

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const tierParam = filter === "all" ? "" : `?tier=${filter}`;
      const res = await fetch(`/api/feed${tierParam}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setFetchedAt(data.fetchedAt || "");
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial fetch + auto-refresh
  useEffect(() => {
    setLoading(true);
    fetchArticles();
    const interval = setInterval(fetchArticles, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  // Translate visible articles when switching to JPN
  useEffect(() => {
    if (language !== "ja") return;

    const toTranslate = articles
      .slice(0, visibleCount)
      .filter((a) => !a.titleJa && !translationCache.current.has(a.id));

    if (toTranslate.length === 0) {
      // Apply cached translations
      setArticles((prev) =>
        prev.map((a) => {
          const cached = translationCache.current.get(a.id);
          return cached ? { ...a, ...cached } : a;
        })
      );
      return;
    }

    // Translate uncached articles
    const translateBatch = async () => {
      const ids = new Set(toTranslate.map((a) => a.id));
      setTranslating(ids);

      await Promise.all(
        toTranslate.map(async (article) => {
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: article.title,
                summary: article.summary,
              }),
            });
            const data = await res.json();
            translationCache.current.set(article.id, data);
            setArticles((prev) =>
              prev.map((a) => (a.id === article.id ? { ...a, ...data } : a))
            );
          } catch {
            // Silently fail individual translation
          } finally {
            setTranslating((prev) => {
              const next = new Set(prev);
              next.delete(article.id);
              return next;
            });
          }
        })
      );
    };

    translateBatch();
  }, [language, articles.length, visibleCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeArticles = articles.filter((a) => !dismissed.has(a.id));
  const visibleArticles = activeArticles.slice(0, visibleCount);
  const hasMore = visibleCount < activeArticles.length;

  // Separate hero from grid articles
  const heroArticle = visibleArticles.find(
    (a) => a.source.tier === 1 && a.imageUrl
  );
  const gridArticles = visibleArticles.filter((a) => a !== heroArticle);

  // Assign variants: every 5th article group starts with a large card
  const getVariant = (index: number): "large" | "small" => {
    const pos = index % 5;
    return pos === 0 ? "large" : "small";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} onLanguageChange={setLanguage} />

      {/* Filter bar */}
      <div className="sticky top-[105px] md:top-[113px] z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <FeedFilter active={filter} onChange={setFilter} />
          {fetchedAt && (
            <span className="hidden md:block text-[10px] font-mono text-muted tabular-nums">
              Updated{" "}
              {new Date(fetchedAt).toLocaleTimeString("en-US", {
                timeZone: "Asia/Dubai",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-10 w-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-muted uppercase tracking-wider">
              Fetching feeds...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-32">
            <p className="text-muted font-mono text-sm">
              No articles found. Check your connection or try a different
              filter.
            </p>
          </div>
        )}

        {/* Magazine Layout */}
        {!loading && articles.length > 0 && (
          <>
            {/* Hero */}
            {heroArticle && (
              <section className="mb-10">
                <HeroArticle
                  article={heroArticle}
                  language={language}
                  isTranslating={translating.has(heroArticle.id)}
                />
              </section>
            )}

            {/* Section label */}
            <div className="flex items-center gap-4 mb-6">
              <h2
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
              >
                Latest Stories
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                {gridArticles.length} articles
              </span>
            </div>

            {/* Magazine Grid */}
            <div className="magazine-grid">
              {gridArticles.map((article, i) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  language={language}
                  isTranslating={translating.has(article.id)}
                  variant={getVariant(i)}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          </>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={() => setVisibleCount((c) => c + ARTICLES_PER_PAGE)}
              className="px-8 py-3 text-xs font-mono uppercase tracking-widest text-muted border border-border rounded-full hover:border-accent hover:text-accent-strong hover:bg-accent/5 transition-all"
            >
              Load more stories
            </button>
          </div>
        )}

        {/* Source credits */}
        <footer className="mt-16 mb-8 border-t border-border pt-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">
                Sources
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {[
                  "Gulf News",
                  "WAM/Reuters",
                  "Al Jazeera",
                  "Al-Monitor",
                  "The New Arab",
                  "France 24",
                  "BBC",
                  "The Guardian",
                  "NYT",
                  "NPR",
                  "Haaretz",
                  "Times of Israel",
                ].map((name) => (
                  <span
                    key={name}
                    className="text-[11px] font-mono text-muted/70"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted/60 md:text-right max-w-xs">
              {language === "ja"
                ? "日本語翻訳はGoogle翻訳により自動生成されています"
                : "Japanese translations are auto-generated via Google Translate"}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
