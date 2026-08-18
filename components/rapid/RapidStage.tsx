"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type RapidState,
  RAPID_RULE,
  rapidPrompt,
} from "@/lib/rapid/types";

type Props = {
  state: RapidState;
  onGo: () => void;
  onTimeUp: () => void;
  onScore: (points: number) => void;
};

export function RapidStage({ state, onGo, onTimeUp, onScore }: Props) {
  const prompt = rapidPrompt(state);
  const team = state.teams[state.turn];
  const [left, setLeft] = useState(state.seconds);
  const [count, setCount] = useState(0);
  const startedAt = useRef<number>(0);

  // Clock runs locally — the reducer only cares that it finished.
  useEffect(() => {
    if (state.phase !== "running") {
      setLeft(state.seconds);
      return;
    }
    startedAt.current = Date.now();
    setLeft(state.seconds);
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const remaining = Math.max(0, state.seconds - elapsed);
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        onTimeUp();
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [state.phase, state.seconds, state.round, state.turn, onTimeUp]);

  // Fresh tally for each turn.
  useEffect(() => setCount(0), [state.round, state.turn, state.phase]);

  const urgent = left <= (state.mode === "five-seconds" ? 2 : 6);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
      <div>
        <p className="t-label font-display uppercase text-slate-500">
          Round {state.round + 1} of {state.prompts.length} · {team?.name}
        </p>
        <motion.p
          key={prompt}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="t-clue mt-2 max-w-[80vw] text-balance font-display uppercase tracking-wide text-slate-50"
        >
          {prompt}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {state.phase === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-[2vmin]"
          >
            <p className="font-display text-[clamp(0.9rem,1.5vw,1.6rem)] uppercase tracking-[0.25em] text-slate-500">
              {RAPID_RULE[state.mode]}
            </p>
            <button onClick={onGo} className="btn-cream px-16 py-5 text-2xl">
              Start the clock
            </button>
          </motion.div>
        )}

        {state.phase === "running" && (
          <motion.div
            key="running"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <motion.span
              animate={urgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: urgent ? Infinity : 0 }}
              className={[
                "font-display font-bold tabular-nums leading-none",
                "text-[clamp(6rem,26vw,22rem)]",
                urgent ? "text-rose-400" : "text-cream",
              ].join(" ")}
            >
              {left < 10 ? left.toFixed(1) : Math.ceil(left)}
            </motion.span>
          </motion.div>
        )}

        {state.phase === "judge" && (
          <motion.div
            key="judge"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-[2.5vmin]"
          >
            <p className="font-display text-[clamp(1.2rem,3vw,3rem)] uppercase tracking-[0.2em] text-rose-400">
              Time
            </p>

            {state.mode === "categories" ? (
              <>
                <p className="t-label font-display uppercase text-slate-500">
                  How many did {team?.name} get?
                </p>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setCount((c) => Math.max(0, c - 1))}
                    className="btn-ghost h-16 w-16 px-0 text-3xl"
                  >
                    −
                  </button>
                  <span className="cream-text w-32 font-display text-[clamp(3rem,8vw,7rem)] font-bold tabular-nums">
                    {count}
                  </span>
                  <button
                    onClick={() => setCount((c) => c + 1)}
                    className="btn-ghost h-16 w-16 px-0 text-3xl"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => onScore(count)}
                  className="btn-cream px-14 py-4 text-xl"
                >
                  Bank {count} {count === 1 ? "point" : "points"}
                </button>
              </>
            ) : (
              <>
                <p className="t-label font-display uppercase text-slate-500">
                  Did {team?.name} name all three?
                </p>
                <div className="flex gap-4">
                  <button onClick={() => onScore(1)} className="btn-good px-12 py-5 text-2xl">
                    ✓ Got it
                  </button>
                  <button onClick={() => onScore(0)} className="btn-bad px-12 py-5 text-2xl">
                    ✗ Missed
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
