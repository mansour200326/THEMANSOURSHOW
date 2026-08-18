"use client";

import { motion } from "framer-motion";
import type { Team } from "@/lib/jeopardy/types";

type Props = {
  teams: Team[];
  /** Index of the team whose turn it is, or null when nobody is "up". */
  activeIndex?: number | null;
  compact?: boolean;
};

export function ScoreBar({ teams, activeIndex = null, compact }: Props) {
  return (
    <div
      className="grid gap-[0.6vmin]"
      style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))` }}
    >
      {teams.map((team, i) => {
        const active = i === activeIndex;
        return (
          <motion.div
            key={team.id}
            animate={{ scale: active ? 1 : 0.985 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={[
              "relative flex flex-col items-center justify-center rounded-xl border text-center transition-colors",
              compact ? "px-3 py-2" : "px-4 py-[1.4vmin]",
              active
                ? "border-cream/70 bg-gradient-to-b from-cream/15 to-transparent shadow-[0_0_40px_rgba(240,228,198,0.18)]"
                : "border-white/10 bg-white/[0.03]",
            ].join(" ")}
          >
            {active && (
              <span className="absolute -top-2 rounded-full bg-cream px-2.5 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.2em] text-ink-950">
                Up
              </span>
            )}
            <span
              className={[
                "truncate font-display uppercase tracking-wider",
                compact ? "text-sm" : "text-[clamp(0.8rem,1.2vw,1.6rem)]",
                active ? "text-cream-bright" : "text-slate-400",
              ].join(" ")}
            >
              {team.name}
            </span>
            <span
              className={[
                "font-display font-bold tabular-nums",
                compact ? "text-2xl" : "t-score",
                team.score < 0 ? "text-rose-400" : "text-slate-50",
              ].join(" ")}
            >
              {team.score < 0 ? "−" : ""}
              {Math.abs(team.score).toLocaleString()}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
