"use client";

import { useEffect, useState } from "react";
import { Language } from "@/types";
import LanguageToggle from "./LanguageToggle";
import LiveIndicator from "./LiveIndicator";

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: Props) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Dubai",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
      {/* Top thin bar */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted tracking-wide">
            {date}
          </span>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted">
              <span>Dubai (GST)</span>
              <span className="text-foreground/70 tabular-nums">{time}</span>
            </div>
            <LanguageToggle language={language} onChange={onLanguageChange} />
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}
            >
              <span className="text-accent">ME</span>
              <span className="text-foreground">WIRE</span>
            </h1>
            <div className="hidden md:block h-6 w-px bg-border" />
            <span className="hidden md:block text-xs text-muted tracking-wide">
              Middle East Live News
            </span>
          </div>
          <LiveIndicator />
        </div>
      </div>
    </header>
  );
}
