"use client";

import { Article, Language } from "@/types";

interface Props {
  article: Article;
  language: Language;
  isTranslating?: boolean;
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

export default function HeroArticle({
  article,
  language,
  isTranslating,
}: Props) {
  const title =
    language === "ja" && article.titleJa ? article.titleJa : article.title;
  const summary =
    language === "ja" && article.summaryJa
      ? article.summaryJa
      : article.summary;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative w-full overflow-hidden rounded-2xl bg-surface-dark"
      style={{ minHeight: "480px" }}
    >
      {/* Background image */}
      {article.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-700"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12" style={{ minHeight: "480px" }}>
        {/* Top badges */}
        <div className="absolute top-6 left-8 md:top-8 md:left-12 flex items-center gap-3">
          <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-accent text-white rounded-full">
            Featured
          </span>
          <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-white/15 text-white/90 backdrop-blur-sm rounded-full">
            {article.source.tierLabel}
          </span>
        </div>

        {/* Source */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: article.source.color }}
          />
          <span className="text-xs font-mono uppercase tracking-wider text-white/70">
            {article.source.name}
          </span>
          <span className="text-xs font-mono text-white/50">
            {timeAgo(article.pubDate)}
          </span>
        </div>

        {/* Headline */}
        <h2
          className={`font-display text-3xl md:text-5xl font-bold leading-[1.1] text-white max-w-3xl mb-4 ${
            isTranslating ? "animate-pulse" : ""
          }`}
          style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h2>

        {/* Summary */}
        {summary && (
          <p
            className={`text-base md:text-lg text-white/70 max-w-2xl leading-relaxed line-clamp-2 ${
              isTranslating ? "animate-pulse" : ""
            }`}
          >
            {summary}
          </p>
        )}

        {/* Read more indicator */}
        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white/60 group-hover:text-white transition-colors">
          <span>Read full story</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </a>
  );
}
