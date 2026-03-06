"use client";

import { Language } from "@/types";

interface Props {
  language: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="flex items-center rounded-full border border-border overflow-hidden text-[11px] font-mono">
      <button
        onClick={() => onChange("en")}
        className={`px-3 py-1 transition-all ${
          language === "en"
            ? "bg-accent text-white"
            : "bg-transparent text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onChange("ja")}
        className={`px-3 py-1 transition-all ${
          language === "ja"
            ? "bg-accent text-white"
            : "bg-transparent text-muted hover:text-foreground"
        }`}
      >
        JPN
      </button>
    </div>
  );
}
