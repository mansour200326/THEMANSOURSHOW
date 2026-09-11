"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountIn } from "@/components/CountIn";
import { useRoundCard } from "@/components/RoundCard";
import { Tally } from "@/components/Tally";
import { WinnerMoment } from "@/components/WinnerMoment";
import { useCue, useCueWhen } from "@/components/useCue";
import type { ActState } from "@/lib/games/actOut";
import { clockLeft } from "@/lib/games/leadIn";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: ActState & ViewerExtras;
  onStart: () => void;
  onTimeUp: () => void;
  onNext: () => void;
  onQuit: () => void;
};

/**
 * The television during charades is mostly a clock. The word is never here —
 * this is the one screen the whole room can see — so what it shows is the
 * time, the words already got, and who's up.
 */
export function ActHost({ room, state, onStart, onTimeUp, onNext, onQuit }: Props) {
  const actor = playerById(room, state.actorId ?? undefined);
  const [left, setLeft] = useState(state.seconds);
  const roundCard = useRoundCard(state.turn, state.turns, state.phase !== "done");

  useEffect(() => {
    if (state.phase !== "acting" || !state.startedAt) {
      setLeft(state.seconds);
      return;
    }
    const tick = () => setLeft(Math.ceil(clockLeft(state.startedAt, state.seconds)));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [state.phase, state.startedAt, state.seconds]);

  useEffect(() => {
    if (state.phase === "acting" && left === 0) onTimeUp();
  }, [left, state.phase, onTimeUp]);

  useCue(state.got.length, state.got.length ? "correct" : null);
  useCue(state.phase === "acting" && left <= 10 ? left : null, "tick");
  useCueWhen(state.phase === "turnOver", "whoosh");
  useCueWhen(state.phase === "done", "fanfare");

  if (state.phase === "done") {
    const ranked = [...connectedPlayers(room)].sort((a, b) => b.score - a.score);
    return (
      <main className="flex min-h-dvh lg:h-dvh flex-col items-center justify-center gap-[2vmin] p-[3vmin] text-center pb-16 lg:pb-[1.6vmin]">
        <WinnerMoment>{ranked[0] ? `${ranked[0].emoji} ${ranked[0].name} wins` : "Nobody"}</WinnerMoment>
        <div className="w-full max-w-3xl space-y-2">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={[
                "flex items-center justify-between rounded-xl border px-5 py-3",
                i === 0 ? "border-accent/50 bg-accent/[0.08]" : "border-line/10",
              ].join(" ")}
            >
              <span className="flex items-center gap-3 font-display text-xl uppercase tracking-wide text-moon">
                <span className="w-6 tabular-nums text-moon-dim">{i + 1}</span>
                <span>{p.emoji}</span>
                {p.name}
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-accent">
                <Tally value={p.score} />
              </span>
            </div>
          ))}
        </div>
        <button onClick={onQuit} className="btn-brand px-10 py-4 text-lg">
          Back to the lobby
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh lg:h-dvh flex-col items-center gap-[2vmin] p-[2vmin] pb-16 lg:pb-[1.6vmin]">
      {roundCard}
      {state.phase === "acting" && <CountIn startedAt={state.startedAt} />}
      <header className="flex w-full shrink-0 items-center justify-between">
        <span className="font-display text-[clamp(0.8rem,1.15vw,1.35rem)] uppercase tracking-[0.25em] text-moon-dim">
          Turn {state.turn + 1} of {state.turns}
        </span>
        <span className="font-display text-[clamp(0.8rem,1.15vw,1.35rem)] uppercase tracking-[0.25em] text-moon-dim">
          {state.got.length} got
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2vmin] text-center">
        <p className="font-display text-[clamp(1.4rem,3.2vw,3.6rem)] uppercase tracking-wide text-moon">
          {actor?.emoji} {actor?.name}
          <span className="text-moon-dim">
            {state.phase === "ready" ? " is up" : state.phase === "acting" ? " is acting" : " — time"}
          </span>
        </p>

        {state.phase === "ready" && (
          <>
            <p className="max-w-2xl text-balance text-[clamp(1rem,1.8vw,1.8rem)] text-moon-dim">
              The word is on their phone. No talking, no pointing at things in the room.
              Everyone else: shout.
            </p>
            <button onClick={onStart} className="btn-accent px-12 py-4 text-xl">
              Start the clock
            </button>
          </>
        )}

        {state.phase === "acting" && (
          <p
            className={[
              "font-display text-[clamp(6rem,22vmin,20rem)] font-bold leading-none tabular-nums",
              left <= 10 ? "text-rose-400" : "accent-text",
            ].join(" ")}
          >
            {left}
          </p>
        )}

        {(state.phase === "acting" || state.phase === "turnOver") && (
          <div className="flex max-w-5xl flex-wrap justify-center gap-2">
            <AnimatePresence initial={false}>
              {state.got.map((g, i) => {
                const by = playerById(room, g.by ?? undefined);
                return (
                  <motion.span
                    key={`${i}-${g.word}`}
                    // Transform only: a chip that fades in can be left invisible
                    // by a throttled tab, and this one is the score.
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 font-display text-[clamp(0.9rem,1.5vw,1.6rem)] uppercase tracking-wide text-emerald-200"
                  >
                    {g.word}
                    {by && <span className="text-[0.9em]">{by.emoji}</span>}
                  </motion.span>
                );
              })}
            </AnimatePresence>
            {state.phase === "turnOver" &&
              state.passed.map((word, i) => (
                <span
                  key={`p-${i}`}
                  className="rounded-full border border-line/10 px-4 py-2 font-display text-[clamp(0.9rem,1.5vw,1.6rem)] uppercase tracking-wide text-moon-dim line-through"
                >
                  {word}
                </span>
              ))}
          </div>
        )}

        {state.phase === "turnOver" && (
          <button onClick={onNext} className="btn-accent px-10 py-3 text-lg">
            {state.turn + 1 >= state.turns ? "Final scores" : "Next up"}
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap justify-center gap-[0.6vmin]">
        {connectedPlayers(room).map((p) => (
          <div
            key={p.id}
            className={[
              "flex items-center gap-3 rounded-xl border px-4 py-[0.9vmin]",
              p.id === state.actorId ? "border-accent/50 bg-accent/[0.08]" : "border-line/10 bg-line/[0.03]",
            ].join(" ")}
          >
            <span className="text-[clamp(1.3rem,2.3vw,2.6rem)]">{p.emoji}</span>
            <span className="font-display text-[clamp(0.9rem,1.6vw,1.7rem)] uppercase tracking-wide text-moon/85">
              {p.name}
            </span>
            <span className="font-display text-[clamp(1rem,1.9vw,2.1rem)] font-bold tabular-nums text-accent">
              <Tally value={p.score} />
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
