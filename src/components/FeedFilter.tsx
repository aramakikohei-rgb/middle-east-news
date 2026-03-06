"use client";

import { FilterTier } from "@/types";
import { TIER_LABELS } from "@/lib/feeds";

interface Props {
  active: FilterTier;
  onChange: (tier: FilterTier) => void;
}

const filters: { value: FilterTier; label: string }[] = [
  { value: "all", label: "All Stories" },
  { value: 1, label: TIER_LABELS[1] },
  { value: 2, label: TIER_LABELS[2] },
  { value: 3, label: TIER_LABELS[3] },
  { value: 4, label: TIER_LABELS[4] },
];

export default function FeedFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {filters.map((f) => (
        <button
          key={String(f.value)}
          onClick={() => onChange(f.value)}
          className={`relative whitespace-nowrap px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
            active === f.value
              ? "text-accent-strong font-medium"
              : "text-muted hover:text-foreground"
          }`}
        >
          {f.label}
          {active === f.value && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
