"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  seconds: number;
  /** Changing this restarts the countdown. */
  resetKey: string;
  paused?: boolean;
};

export function CountdownRing({ seconds, resetKey, paused }: Props) {
  const [left, setLeft] = useState(seconds);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    setLeft(seconds);
  }, [resetKey, seconds]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setLeft(Math.max(0, seconds - elapsed));
    }, 100);
    return () => window.clearInterval(id);
  }, [seconds, paused, resetKey]);

  const pct = seconds > 0 ? left / seconds : 0;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const expired = left <= 0;
  const urgent = left <= 5 && !expired;

  return (
    <div
      className={[
        "relative h-[8vmin] max-h-24 min-h-14 w-[8vmin] min-w-14 max-w-24 shrink-0",
        urgent ? "animate-pulse" : "",
      ].join(" ")}
      aria-label={`${Math.ceil(left)} seconds remaining`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={expired ? "#f43f5e" : urgent ? "#fb7185" : "rgb(var(--accent-rgb))"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <span
        className={[
          "absolute inset-0 flex items-center justify-center font-display text-[clamp(1rem,1.8vw,2rem)] font-bold tabular-nums",
          expired ? "text-rose-400" : "text-moon",
        ].join(" ")}
      >
        {expired ? "0" : Math.ceil(left)}
      </span>
    </div>
  );
}
