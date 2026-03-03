"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Article, FilterTier, Language } from "@/types";
import Header from "@/components/Header";
import FeedFilter from "@/components/FeedFilter";
import NewsCard from "@/components/NewsCard";

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

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-6">
          <FeedFilter active={filter} onChange={setFilter} />
          {fetchedAt && (
            <span className="hidden md:block text-[10px] font-mono text-muted">
              Updated{" "}
              {new Date(fetchedAt).toLocaleTimeString("en-US", {
                timeZone: "Asia/Dubai",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-2 border-accent-strong border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-muted uppercase tracking-wider">
              Fetching feeds...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted font-mono text-sm">
              No articles found. Check your connection or try a different
              filter.
            </p>
          </div>
        )}

        {/* Articles */}
        {!loading && articles.length > 0 && (
          <div className="space-y-3">
            {visibleArticles.map((article, i) => (
              <NewsCard
                key={article.id}
                article={article}
                language={language}
                isTranslating={translating.has(article.id)}
                featured={article.source.tier === 1 && i < 5}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-8 mb-12">
            <button
              onClick={() => setVisibleCount((c) => c + ARTICLES_PER_PAGE)}
              className="px-6 py-2 text-xs font-mono uppercase tracking-wider text-muted border border-border rounded hover:border-accent hover:text-accent-strong transition-colors"
            >
              Load more
            </button>
          </div>
        )}

        {/* Source credits */}
        <footer className="mt-12 mb-8 border-t border-border pt-6">
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">
            Sources
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
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
              "UN News",
            ].map((name) => (
              <span
                key={name}
                className="text-[10px] font-mono text-muted/70"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-mono text-muted/70">
            {language === "ja"
              ? "日本語翻訳はGoogle翻訳により自動生成されています"
              : "Japanese translations are auto-generated via Google Translate"}
          </p>
        </footer>
      </main>
    </div>
  );
}
