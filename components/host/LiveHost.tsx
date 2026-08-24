"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCue, useCueWhen } from "@/components/useCue";
import { Tally } from "@/components/Tally";
import {
  type LiveState,
  liveCurrent,
  liveShuffledEvents,
} from "@/lib/games/liveEngine";
import { type Room, connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: LiveState;
  onForce: () => void;
  onNext: () => void;
  onQuit: () => void;
};

const TITLES: Record<LiveState["variant"], string> = {
  standing: "Last One Standing",
  timeline: "Timeline",
  dial: "Dial It In",
};

export function LiveHost({ room, state, onForce, onNext, onQuit }: Props) {
  const item = liveCurrent(state);
  const players = connectedPlayers(room);
  const byId = (id: string) => players.find((p) => p.id === id);
  const lead = state.lead ? byId(state.lead) : undefined;

  /*
   * The clock lives on the TV — the server is only told once it hits zero,
   * which keeps a ticking number out of the room state. When it does, the
   * round closes on whatever has been submitted, so one person sitting on
   * their hands can't hold up an elimination game they can't be knocked out of.
   */
  const [left, setLeft] = useState(state.seconds);
  useEffect(() => {
    if (!state.startedAt || !state.seconds) {
      setLeft(state.seconds);
      return;
    }
    const tick = () => {
      const gone = (Date.now() - state.startedAt!) / 1000;
      setLeft(Math.max(0, state.seconds - gone));
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [state.startedAt, state.seconds, state.phase]);

  useEffect(() => {
    const ticking = state.phase === "collect" || state.phase === "brief";
    if (ticking && state.seconds > 0 && state.startedAt && left <= 0) onForce();
  }, [left, state.phase, state.seconds, state.startedAt, onForce]);

  const urgent = left <= 5 && left > 0;
  useCue(
    (state.phase === "collect" || state.phase === "brief") && urgent
      ? Math.ceil(left)
      : null,
    "tick",
  );

  // The answer going up, and whether anybody got it.
  useCue(
    `${state.round}:${state.phase}`,
    state.phase === "reveal"
      ? state.correct.length
        ? "correct"
        : "wrong"
      : null,
  );
  useCueWhen(state.phase === "done", "fanfare");

  if (state.phase === "done") {
    const standings = [...players].sort((a, b) => b.score - a.score);
    const survivors = players.filter((p) => !state.benched.includes(p.id));
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-[3vmin] p-[3vmin] text-center">
        <p className="t-label font-display uppercase text-moon-deep">
          {TITLES[state.variant]} — that&apos;s the lot
        </p>
        <h2 className="brand-text t-hero text-balance font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(255,107,87,0.45)]">
          {state.variant === "standing" && survivors.length === 1
            ? survivors[0].name
            : (standings[0]?.name ?? "Nobody")}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {standings.map((p) => (
            <span
              key={p.id}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-display uppercase tracking-wide text-moon/75"
            >
              {p.emoji} {p.name} · <Tally value={p.score} />
            </span>
          ))}
        </div>
        <button onClick={onQuit} className="btn-brand mt-4 px-10 py-4 text-lg">
          Back to the lobby
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col gap-[2vmin] p-[2vmin]">
      <header className="flex shrink-0 items-center justify-between px-2">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-moon-deep">
          {TITLES[state.variant]} · Round {state.round + 1}/{state.items.length}
        </span>
        <div className="flex gap-2">
          {state.phase !== "reveal" && (
            <button onClick={onForce} className="btn-ghost px-3 py-1.5 text-xs">
              Stop waiting
            </button>
          )}
          <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
            End segment
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3vmin] text-center">
        <p className="t-clue max-w-[85vw] text-balance font-display uppercase leading-tight tracking-wide text-moon">
          {item?.prompt}
        </p>

        {/* ---- Last One Standing ---- */}
        {state.variant === "standing" && (
          <>
            {state.phase === "reveal" && (
              <motion.p
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="accent-text t-answer font-display font-bold uppercase"
              >
                {item?.answer}
              </motion.p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {players.map((p) => {
                const out = state.benched.includes(p.id);
                const answered = state.answers[p.id] !== undefined;
                const right = state.correct.includes(p.id);
                return (
                  <span
                    key={p.id}
                    className={[
                      "flex items-center gap-2 rounded-full border px-4 py-2 font-display uppercase tracking-wide transition-colors",
                      out
                        ? "border-white/10 text-moon-deep line-through opacity-50"
                        : state.phase === "reveal" && right
                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                          : answered
                            ? "border-accent/60 bg-accent/10 text-accent-bright"
                            : "border-white/10 text-moon/75",
                    ].join(" ")}
                  >
                    <span>{p.emoji}</span>
                    {p.name}
                    {state.phase === "reveal" && state.answers[p.id] && (
                      <span className="normal-case text-moon-dim">
                        — {state.answers[p.id]}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </>
        )}

        {/* ---- Timeline ---- */}
        {state.variant === "timeline" && (
          <div className="w-full max-w-[70vw]">
            {state.phase === "collect" ? (
              <div className="flex flex-col gap-[1.2vmin]">
                {liveShuffledEvents(state).map((event, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-dusk/60 px-6 py-[1.6vmin] text-left font-display text-[clamp(1rem,1.9vw,2rem)] uppercase tracking-wide text-moon/75"
                  >
                    {event}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-[1.2vmin]">
                {(item?.events ?? []).map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.18 }}
                    className="flex items-center gap-4 rounded-xl border border-accent/50 bg-accent/[0.08] px-6 py-[1.6vmin] text-left"
                  >
                    <span className="accent-text font-display text-[clamp(1.2rem,2.4vw,2.6rem)] font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <span className="font-display text-[clamp(1rem,1.9vw,2rem)] uppercase tracking-wide text-moon">
                      {event}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- Dial It In ---- */}
        {state.variant === "dial" && (
          <div className="w-full max-w-[75vw]">
            <div className="flex items-center justify-between font-display text-[clamp(0.9rem,1.7vw,1.9rem)] uppercase tracking-[0.15em] text-moon-dim">
              <span>{item?.left}</span>
              <span>{item?.right}</span>
            </div>

            <div className="relative mt-[1.5vmin] h-[6vmin] min-h-[44px] overflow-hidden rounded-full border border-white/10 bg-gradient-to-r from-dusk via-dusk-lit to-dusk">
              {state.phase === "reveal" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-y-0 w-[3px] bg-accent shadow-glow"
                  style={{ left: `${item?.target ?? 50}%` }}
                />
              )}
              {state.phase === "reveal" &&
                Object.entries(state.answers).map(([id, value]) => (
                  <motion.span
                    key={id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl"
                    style={{ left: `${Number(value)}%` }}
                  >
                    {byId(id)?.emoji ?? "•"}
                  </motion.span>
                ))}
            </div>

            <p className="mt-[2vmin] font-display text-[clamp(1rem,2.2vw,2.4rem)] uppercase tracking-[0.2em] text-accent">
              {state.phase === "brief"
                ? `${lead?.name ?? "Someone"} is thinking of a clue…`
                : state.clue
                  ? `“${state.clue}” — ${lead?.name}`
                  : ""}
            </p>
          </div>
        )}

        {/* The clock, and who's still to answer */}
        {(state.phase === "collect" || state.phase === "brief") &&
          state.seconds > 0 && (
            <div className="flex flex-col items-center gap-[1vmin]">
              <motion.span
                animate={urgent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: urgent ? Infinity : 0 }}
                className={[
                  "font-display font-bold tabular-nums leading-none",
                  "text-[clamp(2.5rem,9vw,7rem)]",
                  urgent ? "text-rose-400" : "text-accent",
                ].join(" ")}
              >
                {Math.ceil(left)}
              </motion.span>
              {state.phase === "collect" && (
                <p className="font-display text-sm uppercase tracking-[0.2em] text-moon-deep">
                  {Object.keys(state.answers).length} in ·{" "}
                  {
                    players.filter(
                      (p) =>
                        !state.benched.includes(p.id) &&
                        state.answers[p.id] === undefined &&
                        !(state.variant === "dial" && p.id === state.lead),
                    ).length
                  }{" "}
                  still to answer
                </p>
              )}
            </div>
          )}
      </div>

      <AnimatePresence>
        {state.phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex shrink-0 items-center justify-center gap-6"
          >
            <button onClick={onNext} className="btn-accent px-12 py-4 text-xl">
              Next round
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex shrink-0 flex-wrap justify-center gap-2">
        {players.map((p) => (
          <span
            key={p.id}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-display text-xs uppercase tracking-wide text-moon-dim"
          >
            {p.emoji} {p.name} · <Tally value={p.score} />
            {state.lastScores[p.id] ? (
              <span className="ml-1 text-emerald-300">
                +{state.lastScores[p.id]}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </main>
  );
}
