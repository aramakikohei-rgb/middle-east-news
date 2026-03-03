"use client";

import { Article, Language } from "@/types";

interface Props {
  article: Article;
  language: Language;
  isTranslating?: boolean;
  featured?: boolean;
  onDismiss?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsCard({
  article,
  language,
  isTranslating,
  featured,
  onDismiss,
}: Props) {
  const title =
    language === "ja" && article.titleJa ? article.titleJa : article.title;
  const summary =
    language === "ja" && article.summaryJa
      ? article.summaryJa
      : article.summary;

  return (
    <div
      className={`group relative rounded-lg border transition-all duration-200 ${
        featured
          ? "border-accent/40 bg-gradient-to-br from-surface to-accent/10 p-5 hover:border-accent"
          : "border-border bg-white/60 p-4 hover:bg-white hover:border-muted"
      }`}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDismiss(article.id);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-border/60 text-muted hover:text-foreground"
          title="Dismiss article"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      )}

      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Source badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: article.source.color }}
              />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {article.source.name}
              </span>
              <span className="text-[10px] font-mono text-muted/70">
                {article.source.tierLabel}
              </span>
            </div>

            {/* Headline */}
            <h3
              className={`font-semibold leading-snug group-hover:text-accent-strong transition-colors ${
                featured
                  ? "text-lg text-foreground"
                  : "text-sm text-foreground/90"
              } ${isTranslating ? "animate-pulse" : ""}`}
            >
              {title}
            </h3>

            {/* Summary */}
            {summary && (
              <p
                className={`mt-1.5 text-foreground/50 leading-relaxed line-clamp-2 ${
                  featured ? "text-sm" : "text-xs"
                } ${isTranslating ? "animate-pulse" : ""}`}
              >
                {summary}
              </p>
            )}

            {/* Meta */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted">
                {timeAgo(article.pubDate)}
              </span>
              {featured && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent-strong border border-accent/40 px-1.5 py-0.5 rounded">
                  Priority
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          {article.imageUrl && (
            <div className="flex-shrink-0 hidden sm:block">
              <div
                className={`overflow-hidden rounded bg-surface ${
                  featured ? "w-28 h-20" : "w-20 h-14"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
