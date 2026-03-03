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

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-accent-strong">ME</span>
              <span className="text-foreground">WIRE</span>
            </h1>
            <LiveIndicator />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted">
              <span>Dubai</span>
              <span className="text-foreground/70">{time}</span>
            </div>
            <LanguageToggle language={language} onChange={onLanguageChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
