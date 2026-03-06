"use client";

import { useEffect, useState } from "react";

export default function LiveIndicator({ interval = 300 }: { interval?: number }) {
  const [countdown, setCountdown] = useState(interval);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c <= 1 ? interval : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [interval]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="text-accent font-medium">Live</span>
      <span className="text-muted tabular-nums">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
