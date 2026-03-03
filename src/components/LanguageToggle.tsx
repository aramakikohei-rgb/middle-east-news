"use client";

import { Language } from "@/types";

interface Props {
  language: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="flex items-center border border-border rounded overflow-hidden text-xs font-mono">
      <button
        onClick={() => onChange("en")}
        className={`px-3 py-1.5 transition-colors ${
          language === "en"
            ? "bg-accent-strong text-white"
            : "bg-transparent text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onChange("ja")}
        className={`px-3 py-1.5 transition-colors ${
          language === "ja"
            ? "bg-accent-strong text-white"
            : "bg-transparent text-muted hover:text-foreground"
        }`}
      >
        JPN
      </button>
    </div>
  );
}
