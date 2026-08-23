"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCue, useCueWhen } from "@/components/useCue";
import {
  type RapidState,
  RAPID_RULE,
  rapidPrompt,
} from "@/lib/rapid/types";

type Props = {
  state: RapidState;
  /** Categories: the bidding is settled. */
  onBid: (team: number, count: number) => void;
  onGo: () => void;
  onTimeUp: () => void;
  onScore: (points: number) => void;
};

export function RapidStage({ state, onBid, onGo, onTimeUp, onScore }: Props) {
  const prompt = rapidPrompt(state);
  const team = state.teams[state.turn];
  const [left, setLeft] = useState(state.seconds);
  const [count, setCount] = useState(0);
  // Who's winning the bidding, and at what. Both reset with the category.
  const [bidTeam, setBidTeam] = useState(0);
  const [bid, setBid] = useState(5);
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

  // A new category means new bidding.
  useEffect(() => {
    setBid(5);
    setBidTeam(0);
  }, [state.round]);

  const urgent = left <= (state.mode === "three-in-five" ? 2 : 6);

  // A tick a second while the clock runs down, and a klaxon when it stops.
  useCue(state.phase === "running" && urgent ? Math.ceil(left) : null, "tick");
  useCue(state.phase, state.phase === "running" ? "whoosh" : null);
  useCueWhen(state.phase === "judge", "timeup");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
      <div>
        <p className="t-label font-display uppercase text-moon-deep">
          Round {state.round + 1} of {state.prompts.length}
          {state.phase === "bidding" ? " · up for bids" : ` · ${team?.name}`}
          {state.mode === "categories" && state.phase !== "bidding" && state.bid
            ? ` · called ${state.bid}`
            : ""}
        </p>
        <motion.p
          key={prompt}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="t-clue mt-2 max-w-[80vw] text-balance font-display uppercase tracking-wide text-moon"
        >
          {prompt}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {state.phase === "bidding" && (
          <motion.div
            key="bidding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-[2vmin]"
          >
            <p className="font-display text-[clamp(0.9rem,1.5vw,1.6rem)] uppercase tracking-[0.25em] text-moon-deep">
              Bid against each other — how many can you name?
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {state.teams.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setBidTeam(i)}
                  className={[
                    "rounded-full border px-8 py-3 font-display text-[clamp(1rem,2vw,1.8rem)] uppercase tracking-wide transition-colors",
                    i === bidTeam
                      ? "border-accent bg-accent/20 text-accent-bright"
                      : "border-white/15 text-moon/70",
                  ].join(" ")}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={() => setBid((b) => Math.max(1, b - 1))}
                aria-label="Lower the bid"
                className="btn-ghost h-16 w-16 px-0 text-3xl"
              >
                −
              </button>
              <span className="accent-text w-32 font-display text-[clamp(3rem,8vw,7rem)] font-bold tabular-nums">
                {bid}
              </span>
              <button
                onClick={() => setBid((b) => b + 1)}
                aria-label="Raise the bid"
                className="btn-ghost h-16 w-16 px-0 text-3xl"
              >
                +
              </button>
            </div>

            <button
              onClick={() => onBid(bidTeam, bid)}
              className="btn-accent px-14 py-4 text-xl"
            >
              {state.teams[bidTeam]?.name} takes it at {bid}
            </button>
            <p className="max-w-[60ch] text-[clamp(0.75rem,1.1vw,1rem)] text-moon-deep">
              Whoever bids highest plays the category alone. Reach the number and
              you score everything you named; fall short and the other side takes
              the bid.
            </p>
          </motion.div>
        )}

        {state.phase === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-[2vmin]"
          >
            <p className="font-display text-[clamp(0.9rem,1.5vw,1.6rem)] uppercase tracking-[0.25em] text-moon-deep">
              {state.mode === "categories"
                ? `${team?.name} — name ${state.bid} or more`
                : RAPID_RULE[state.mode]}
            </p>
            <button onClick={onGo} className="btn-accent px-16 py-5 text-2xl">
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
            className="flex flex-col items-center gap-[1.5vmin]"
          >
            <motion.span
              animate={urgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: urgent ? Infinity : 0 }}
              className={[
                "font-display font-bold tabular-nums leading-none",
                "text-[clamp(6rem,26vw,22rem)]",
                urgent ? "text-rose-400" : "text-accent",
              ].join(" ")}
            >
              {left < 10 ? left.toFixed(1) : Math.ceil(left)}
            </motion.span>

            {/*
              * Nobody wants to watch eleven seconds run down after a team has
              * already dried up, or already got there. Stopping the clock is
              * the same as the clock stopping itself.
              */}
            <button onClick={onTimeUp} className="btn-ghost px-10 py-3 text-lg">
              Finish now
            </button>
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
                <p className="t-label font-display uppercase text-moon-deep">
                  How many did {team?.name} get? They called {state.bid}.
                </p>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setCount((c) => Math.max(0, c - 1))}
                    className="btn-ghost h-16 w-16 px-0 text-3xl"
                  >
                    −
                  </button>
                  <span className="accent-text w-32 font-display text-[clamp(3rem,8vw,7rem)] font-bold tabular-nums">
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
                  className={[
                    "px-14 py-4 text-xl",
                    count >= state.bid ? "btn-good" : "btn-bad",
                  ].join(" ")}
                >
                  {count >= state.bid
                    ? `Made it — ${count} to ${team?.name}`
                    : `Short — ${state.bid} to ${state.teams[(state.turn + 1) % state.teams.length]?.name}`}
                </button>
              </>
            ) : (
              <>
                <p className="t-label font-display uppercase text-moon-deep">
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
