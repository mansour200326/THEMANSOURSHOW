"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type FeudState,
  STRIKES_ALLOWED,
  currentQuestion,
} from "@/lib/feud/types";

type Props = {
  state: FeudState;
  onGuess: (text: string) => void;
  onReveal: (index: number) => void;
  onStrike: () => void;
  onNextRound: () => void;
};

export function FeudBoard({
  state,
  onGuess,
  onReveal,
  onStrike,
  onNextRound,
}: Props) {
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const question = currentQuestion(state);

  // Clear the box and take focus back after every guess, so the host can just
  // keep typing as the team keeps shouting.
  useEffect(() => {
    setDraft("");
    box.current?.focus();
  }, [state.lastGuess?.at, state.round, state.phase]);

  if (!question) return null;

  const submit = () => {
    const text = draft.trim();
    if (text) onGuess(text);
  };

  const feedback = state.lastGuess;
  const over = state.phase === "round-end";
  const lastRound = state.round + 1 >= state.questions.length;

  const controlTeam = state.teams[state.control];

  return (
    <div className="flex h-full flex-col gap-[1.5vmin]">
      {/* Question */}
      <p className="shrink-0 text-balance px-[4vw] text-center font-display text-[clamp(1.2rem,3vw,3.4rem)] uppercase leading-tight tracking-wide text-slate-50">
        {question.question}
      </p>

      {/* Who's up + strikes */}
      <div className="flex shrink-0 items-center justify-center gap-[2vmin]">
        <span className="font-display text-[clamp(0.9rem,1.6vw,1.8rem)] uppercase tracking-[0.2em] text-cream">
          {over
            ? state.outcome === "cleared"
              ? "Board cleared"
              : "Both teams struck out"
            : controlTeam?.name}
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

      {/* The board just changed hands */}
      <AnimatePresence>
        {state.handoverAt && (
          <motion.p
            key={state.handoverAt}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="shrink-0 text-center font-display text-[clamp(0.9rem,1.7vw,1.9rem)] uppercase tracking-[0.2em] text-rose-300"
          >
            Three strikes — {controlTeam?.name} takes over the board
          </motion.p>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid min-h-0 flex-1 grid-cols-1 content-center gap-[0.8vmin] px-[6vw] sm:grid-cols-2">
        {question.answers.map((answer, i) => {
          const open = state.revealed.includes(i);
          const clickable = !open && state.phase === "play";

          return (
            <button
              key={answer.text}
              type="button"
              disabled={!clickable}
              onClick={() => onReveal(i)}
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

      {/* Round over — the board above stays up so everything can be read */}
      {over && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 items-center justify-between gap-6 px-[2vw]"
        >
          <p className="font-display text-[clamp(0.85rem,1.4vw,1.5rem)] uppercase tracking-wider text-slate-400">
            {state.outcome === "cleared"
              ? "Every answer found"
              : "The rest are shown above"}
          </p>
          <button onClick={onNextRound} className="btn-cream px-12 py-4 text-xl">
            {lastRound ? "Final standings" : "Next round"}
          </button>
          <p className="t-label font-display uppercase text-slate-500">
            Round {state.round + 1}/{state.questions.length}
          </p>
        </motion.div>
      )}

      {/* Answer box + pot */}
      {!over && (
      <div className="flex shrink-0 items-end gap-[1.5vw] px-[2vw]">
        <div className="shrink-0 text-left">
          <p className="t-label font-display uppercase text-slate-500">Pot</p>
          <p className="cream-text font-display text-[clamp(1.6rem,3vw,3.6rem)] font-bold tabular-nums">
            {state.pot}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex gap-2">
            <input
              ref={box}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Type what they said…"
              autoFocus
              className="field flex-1 text-[clamp(1rem,1.8vw,1.6rem)]"
            />
            <button onClick={submit} className="btn-cream px-8 text-lg">
              Enter
            </button>
          </div>

          {/* Did that land? */}
          <div className="mt-1 h-6">
            <AnimatePresence initial={false}>
              {feedback && (
                <motion.p
                  key={feedback.at}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={[
                    "font-display text-sm uppercase tracking-wider",
                    feedback.matched !== null ? "text-emerald-300" : "text-rose-400",
                  ].join(" ")}
                >
                  {feedback.matched !== null
                    ? `“${feedback.text}” → ${question.answers[feedback.matched]?.text}`
                    : `“${feedback.text}” — not on the board`}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {state.phase === "play" && (
            <button onClick={onStrike} className="btn-bad px-6 py-3">
              Strike ✗
            </button>
          )}
          <p className="t-label mt-1 font-display uppercase text-slate-500">
            Round {state.round + 1}/{state.questions.length}
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
