"use client";

import { Article, Language } from "@/types";

interface Props {
  article: Article;
  language: Language;
  isTranslating?: boolean;
  variant?: "large" | "small";
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
  variant = "small",
  onDismiss,
}: Props) {
  const title =
    language === "ja" && article.titleJa ? article.titleJa : article.title;
  const summary =
    language === "ja" && article.summaryJa
      ? article.summaryJa
      : article.summary;

  if (variant === "large") {
    return (
      <div className="card-large group relative rounded-xl overflow-hidden bg-surface border border-border hover:shadow-xl transition-all duration-300">
        {/* Dismiss */}
        {onDismiss && <DismissButton onDismiss={() => onDismiss(article.id)} />}

        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          {/* Image */}
          {article.imageUrl ? (
            <div className="relative w-full overflow-hidden" style={{ height: "280px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="absolute top-4 left-4 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest bg-accent text-white rounded-full">
                {article.source.tierLabel}
              </span>
            </div>
          ) : (
            <div className="w-full bg-gradient-to-br from-surface-dark to-foreground/80 flex items-center justify-center" style={{ height: "280px" }}>
              <span className="text-6xl font-display text-white/10" style={{ fontFamily: "var(--font-display), serif" }}>
                MW
              </span>
              <span className="absolute top-4 left-4 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest bg-accent text-white rounded-full">
                {article.source.tierLabel}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: article.source.color }}
              />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {article.source.name}
              </span>
              <span className="text-[10px] font-mono text-muted/60">
                {timeAgo(article.pubDate)}
              </span>
            </div>

            <h3
              className={`font-display text-xl md:text-2xl font-bold leading-snug text-foreground group-hover:text-accent-strong transition-colors mb-3 ${
                isTranslating ? "animate-pulse" : ""
              }`}
              style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
            >
              {title}
            </h3>

            {summary && (
              <p
                className={`text-sm text-muted leading-relaxed line-clamp-3 ${
                  isTranslating ? "animate-pulse" : ""
                }`}
              >
                {summary}
              </p>
            )}
          </div>
        </a>
      </div>
    );
  }

  // Small card variant
  return (
    <div className="group relative rounded-xl overflow-hidden bg-surface border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Dismiss */}
      {onDismiss && <DismissButton onDismiss={() => onDismiss(article.id)} />}

      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {article.imageUrl ? (
          <div className="relative w-full overflow-hidden" style={{ height: "160px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{
              height: "160px",
              borderBottom: "3px solid var(--accent)",
              background: "linear-gradient(135deg, var(--tag-bg) 0%, var(--background) 100%)",
            }}
          >
            <span className="text-4xl font-display text-foreground/5" style={{ fontFamily: "var(--font-display), serif" }}>
              MW
            </span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: article.source.color }}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
              {article.source.name}
            </span>
            <span className="text-[9px] font-mono text-muted/60">
              {timeAgo(article.pubDate)}
            </span>
          </div>

          <h3
            className={`font-display text-base font-semibold leading-snug text-foreground group-hover:text-accent-strong transition-colors line-clamp-3 ${
              isTranslating ? "animate-pulse" : ""
            }`}
            style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
          >
            {title}
          </h3>

          {summary && (
            <p
              className={`mt-2 text-xs text-muted leading-relaxed line-clamp-2 ${
                isTranslating ? "animate-pulse" : ""
              }`}
            >
              {summary}
            </p>
          )}
        </div>
      </a>
    </div>
  );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60"
      title="Dismiss article"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M3 3l8 8M11 3l-8 8" />
      </svg>
    </button>
  );
}
