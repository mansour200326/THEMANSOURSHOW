"use client";

import { motion } from "framer-motion";
import { ScoreNudge } from "@/components/ScoreNudge";
import { Tally } from "@/components/Tally";
import type { Team } from "@/lib/bigboard/types";

type Props = {
  teams: Team[];
  /** Index of the team whose turn it is, or null when nobody is "up". */
  activeIndex?: number | null;
  compact?: boolean;
  /** Present wherever the host can put a score right by hand. */
  onAdjust?: (teamId: string, delta: number) => void;
  step?: number;
};

export function ScoreBar({
  teams,
  activeIndex = null,
  compact,
  onAdjust,
  step = 100,
}: Props) {
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
                ? "border-accent/70 bg-gradient-to-b from-accent/15 to-transparent shadow-[0_0_40px_rgb(var(--accent-rgb)/0.2)]"
                : "border-white/10 bg-white/[0.03]",
            ].join(" ")}
          >
            {active && (
              <span className="absolute -top-2 rounded-full bg-accent px-2.5 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.2em] text-midnight-deep">
                Up
              </span>
            )}
            <span
              className={[
                "truncate font-display uppercase tracking-wider",
                compact ? "text-sm" : "text-[clamp(0.8rem,1.2vw,1.6rem)]",
                active ? "text-accent-bright" : "text-moon-dim",
              ].join(" ")}
            >
              {team.name}
            </span>
            {(() => {
              const score = (
                <span
                  className={[
                    "font-display font-bold tabular-nums",
                    compact ? "text-2xl" : "t-score",
                    team.score < 0 ? "text-rose-400" : "text-moon",
                  ].join(" ")}
                >
                  {team.score < 0 ? "−" : ""}
                  <Tally value={Math.abs(team.score)} />
                </span>
              );
              // Wrapped only where the host is actually running the game —
              // the winner screen shows the same bar and has nothing left to
              // adjust.
              return onAdjust ? (
                <ScoreNudge
                  step={step}
                  size={compact ? "small" : "normal"}
                  onAdjust={(delta) => onAdjust(team.id, delta)}
                >
                  {score}
                </ScoreNudge>
              ) : (
                score
              );
            })()}
          </motion.div>
        );
      })}
    </div>
  );
}
