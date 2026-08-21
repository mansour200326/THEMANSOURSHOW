"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountdownRing } from "@/components/bigboard/CountdownRing";
import type { Rules, Team } from "@/lib/bigboard/types";

type Props = {
  category: string;
  clue: string;
  answer: string;
  /** Points at stake — clue value, or the wager on a daily double. */
  value: number;
  isDaily: boolean;
  teams: Team[];
  turn: number;
  lockedOut: number[];
  rules: Rules;
  onJudge: (teamIndex: number, correct: boolean) => void;
  onSkip: () => void;
};

export function ClueStage({
  category,
  clue,
  answer,
  value,
  isDaily,
  teams,
  turn,
  lockedOut,
  rules,
  onJudge,
  onSkip,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  // On a daily double only the picking team plays it — nobody can steal.
  const eligible = (i: number) =>
    isDaily ? i === turn : !lockedOut.includes(i);

  const stealOpen = !isDaily && lockedOut.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
        return;
      }
      if (e.code === "Space" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      const digit = Number(e.key);
      if (digit >= 1 && digit <= teams.length) {
        e.preventDefault();
        const i = digit - 1;
        if (eligible(i)) onJudge(i, !e.shiftKey);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="t-label font-display uppercase text-moon-deep">
            {isDaily ? "Daily Double" : category}
          </p>
          <p className="truncate font-display text-[clamp(1.1rem,2vw,2.5rem)] uppercase tracking-wide text-moon/90">
            {isDaily ? category : teams[turn]?.name}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="t-label font-display uppercase text-moon-deep">
              {isDaily ? "Wagered" : "For"}
            </p>
            <p className="accent-text font-display text-[clamp(1.6rem,3vw,4rem)] font-bold tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
          {rules.timer && (
            <CountdownRing
              seconds={rules.timerSeconds}
              resetKey={`${category}-${clue.slice(0, 12)}-${lockedOut.length}`}
              paused={revealed}
            />
          )}
        </div>
      </div>

      {/* Clue */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3vmin] px-[4vw] text-center">
        <motion.p
          key={clue}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="t-clue text-balance font-display uppercase tracking-wide text-moon"
        >
          {clue}
        </motion.p>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="t-label font-display uppercase text-moon-deep">
                Answer
              </span>
              <p className="accent-text t-answer text-balance font-display font-semibold uppercase">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {stealOpen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-[clamp(0.9rem,1.4vw,1.6rem)] uppercase tracking-[0.25em] text-rose-400"
          >
            Steal is open
          </motion.p>
        )}
      </div>

      {/* Host controls */}
      <div className="mt-[2vmin] space-y-[1.4vmin]">
        <div
          className="grid gap-[0.6vmin]"
          style={{
            gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
          }}
        >
          {teams.map((team, i) => {
            const can = eligible(i);
            return (
              <div
                key={team.id}
                className={[
                  "rounded-xl border p-[1vmin] transition-opacity",
                  i === turn && !stealOpen
                    ? "border-accent/50 bg-accent/[0.07]"
                    : "border-white/10 bg-white/[0.02]",
                  can ? "" : "opacity-30",
                ].join(" ")}
              >
                <p className="mb-[0.8vmin] truncate text-center font-display text-[clamp(0.75rem,1.05vw,1.4rem)] uppercase tracking-wider text-moon/75">
                  {team.name}
                </p>
                <div className="flex gap-[0.6vmin]">
                  <button
                    type="button"
                    disabled={!can}
                    onClick={() => onJudge(i, true)}
                    className="btn-good flex-1 px-0 py-[1vmin] text-[clamp(1rem,1.6vw,2rem)]"
                    aria-label={`${team.name} correct`}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    disabled={!can}
                    onClick={() => onJudge(i, false)}
                    className="btn-bad flex-1 px-0 py-[1vmin] text-[clamp(1rem,1.6vw,2rem)]"
                    aria-label={`${team.name} wrong`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="btn-ghost text-sm sm:text-base"
          >
            {revealed ? "Hide answer" : "Reveal answer"}
          </button>

          <p className="hidden font-display text-xs uppercase tracking-[0.18em] text-moon-deep/70 lg:block">
            Space reveal · 1–{teams.length} correct · Shift+number wrong · Esc no
            one
          </p>

          <button
            type="button"
            onClick={onSkip}
            className="btn-ghost text-sm sm:text-base"
          >
            No one — next
          </button>
        </div>
      </div>
    </div>
  );
}
