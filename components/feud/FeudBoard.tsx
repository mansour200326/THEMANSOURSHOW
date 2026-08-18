"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  type FeudState,
  STRIKES_ALLOWED,
  currentQuestion,
  otherTeam,
} from "@/lib/feud/types";

type Props = {
  state: FeudState;
  onReveal: (index: number) => void;
  onStrike: () => void;
  onStealHit: (index: number) => void;
  onStealMiss: () => void;
};

export function FeudBoard({
  state,
  onReveal,
  onStrike,
  onStealHit,
  onStealMiss,
}: Props) {
  const question = currentQuestion(state);
  if (!question) return null;

  const stealing = state.phase === "steal";
  const controlTeam = state.teams[state.control];
  const stealTeam = state.teams[otherTeam(state)];

  return (
    <div className="flex h-full flex-col gap-[1.5vmin]">
      {/* Question */}
      <p className="shrink-0 text-balance px-[4vw] text-center font-display text-[clamp(1.2rem,3vw,3.4rem)] uppercase leading-tight tracking-wide text-slate-50">
        {question.question}
      </p>

      {/* Who's up + strikes */}
      <div className="flex shrink-0 items-center justify-center gap-[2vmin]">
        <span className="font-display text-[clamp(0.9rem,1.6vw,1.8rem)] uppercase tracking-[0.2em] text-cream">
          {stealing ? `${stealTeam?.name} — one guess to steal` : controlTeam?.name}
        </span>
        <span className="flex gap-2">
          {Array.from({ length: STRIKES_ALLOWED }).map((_, i) => (
            <span
              key={i}
              className={[
                "flex h-[4vmin] max-h-12 min-h-8 w-[4vmin] min-w-8 max-w-12 items-center justify-center rounded-lg border font-display text-[clamp(1rem,1.8vw,2rem)] font-bold",
                i < state.strikes
                  ? "border-rose-500/70 bg-rose-500/20 text-rose-300"
                  : "border-white/10 text-slate-700",
              ].join(" ")}
            >
              ✗
            </span>
          ))}
        </span>
      </div>

      {/* Board */}
      <div className="grid min-h-0 flex-1 grid-cols-1 content-center gap-[0.8vmin] px-[6vw] sm:grid-cols-2">
        {question.answers.map((answer, i) => {
          const open = state.revealed.includes(i);
          const clickable =
            !open && (state.phase === "play" || state.phase === "steal");

          return (
            <button
              key={answer.text}
              type="button"
              disabled={!clickable}
              onClick={() => (stealing ? onStealHit(i) : onReveal(i))}
              className={[
                "relative flex items-center justify-between overflow-hidden rounded-xl border px-5 py-[1.6vmin] text-left transition-all",
                open
                  ? "tile-face border-white/15 shadow-tile"
                  : clickable
                    ? "border-white/10 bg-white/[0.03] hover:border-cream/50 hover:bg-white/[0.06]"
                    : "border-white/8 bg-white/[0.02]",
              ].join(" ")}
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.span
                    key="open"
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 20 }}
                    className="flex w-full items-center justify-between gap-4"
                  >
                    <span className="truncate font-display text-[clamp(1rem,2vw,2.3rem)] uppercase tracking-wide text-slate-50">
                      {answer.text}
                    </span>
                    <span className="cream-text shrink-0 font-display text-[clamp(1.2rem,2.2vw,2.6rem)] font-bold tabular-nums">
                      {answer.points}
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="closed"
                    className="flex w-full items-center justify-center font-display text-[clamp(1.2rem,2.2vw,2.6rem)] font-bold tabular-nums text-slate-600"
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Pot + host controls */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-[2vw]">
        <div className="text-left">
          <p className="t-label font-display uppercase text-slate-500">Pot</p>
          <p className="cream-text font-display text-[clamp(1.6rem,3vw,3.6rem)] font-bold tabular-nums">
            {state.pot}
          </p>
        </div>

        {state.phase === "play" && (
          <button onClick={onStrike} className="btn-bad px-10 py-4 text-xl">
            Strike ✗
          </button>
        )}
        {stealing && (
          <button onClick={onStealMiss} className="btn-ghost px-8 py-4 text-lg">
            Steal missed
          </button>
        )}

        <div className="text-right">
          <p className="t-label font-display uppercase text-slate-500">
            Round {state.round + 1}/{state.questions.length}
          </p>
        </div>
      </div>
    </div>
  );
}
