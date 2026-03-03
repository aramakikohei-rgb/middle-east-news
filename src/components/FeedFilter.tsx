"use client";

import { FilterTier } from "@/types";
import { TIER_LABELS } from "@/lib/feeds";

interface Props {
  active: FilterTier;
  onChange: (tier: FilterTier) => void;
}

const filters: { value: FilterTier; label: string }[] = [
  { value: "all", label: "All" },
  { value: 1, label: TIER_LABELS[1] },
  { value: 2, label: TIER_LABELS[2] },
  { value: 3, label: TIER_LABELS[3] },
  { value: 4, label: TIER_LABELS[4] },
];

export default function FeedFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((f) => (
        <button
          key={String(f.value)}
          onClick={() => onChange(f.value)}
          className={`whitespace-nowrap px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all ${
            active === f.value
              ? "bg-accent-strong text-white"
              : "bg-surface text-muted hover:text-foreground hover:bg-border"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
