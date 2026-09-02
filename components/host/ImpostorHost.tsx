"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCue, useCueWhen } from "@/components/useCue";
import { Tally } from "@/components/Tally";
import {
  type ImpostorState,
  impostorPlace,
} from "@/lib/games/impostor";
import { type Room, connectedPlayers } from "@/lib/room/types";
import { ScoreNudge } from "@/components/ScoreNudge";

type Props = {
  /** Host putting a score right by hand. */
  onAdjust: (playerId: string, delta: number) => void;
  room: Room;
  state: ImpostorState;
  onStart: () => void;
  onForce: () => void;
  onTimeUp: () => void;
  onNext: () => void;
  onQuit: () => void;
};

export function ImpostorHost({
  onAdjust,
  room,
  state,
  onStart,
  onForce,
  onTimeUp,
  onNext,
  onQuit,
}: Props) {
  const players = connectedPlayers(room);
  const byId = (id: string | null) => players.find((p) => p.id === id);
  const [left, setLeft] = useState(state.seconds);

  // The clock lives on the TV. The server only needs telling once it hits zero,
  // which keeps a ticking timer out of the room state entirely.
  useEffect(() => {
    if (state.phase !== "talk" || !state.startedAt) {
      setLeft(state.seconds);
      return;
    }
    const tick = () => {
      const gone = Math.floor((Date.now() - state.startedAt!) / 1000);
      setLeft(Math.max(0, state.seconds - gone));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [state.phase, state.startedAt, state.seconds]);

  useEffect(() => {
    if (state.phase === "talk" && left === 0) onTimeUp();
  }, [left, state.phase, onTimeUp]);

  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  // The last ten seconds tick; the vote and the verdict get their own cues.
  useCue(state.phase === "talk" && left <= 10 ? left : null, "tick");
  useCue(state.phase, state.phase === "vote" ? "whoosh" : null);
  useCue(
    state.outcome,
    state.outcome === "impostor-caught"
      ? "correct"
      : state.outcome
        ? "wrong"
        : null,
  );
  useCueWhen(state.phase === "done", "fanfare");

  if (state.phase === "done") {
    const standings = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-[3vmin] p-[3vmin] text-center">
        <p className="t-label font-display uppercase text-moon-deep">
          Impostor — that&apos;s the lot
        </p>
        <h2 className="brand-text t-hero font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(255,107,87,0.45)]">
          {standings[0]?.name ?? "Nobody"}
        </h2>
        <button onClick={onQuit} className="btn-brand px-10 py-4 text-lg">
          Back to the lobby
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col gap-[2vmin] p-[2vmin]">
      <header className="flex shrink-0 items-center justify-between px-2">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-moon-deep">
          Impostor · Round {state.round + 1}
        </span>
        <div className="flex gap-2">
          {state.phase === "deal" && (
            <button onClick={onStart} className="btn-ghost px-3 py-1.5 text-xs">
              Start without them
            </button>
          )}
          {state.phase === "vote" && (
            <button onClick={onForce} className="btn-ghost px-3 py-1.5 text-xs">
              Close the vote
            </button>
          )}
          <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
            End segment
          </button>
        </div>
      </header>

      {state.phase === "deal" && (
        <Centre>
          <p className="t-clue font-display uppercase tracking-wide text-moon">
            Check your phone
          </p>
          <p className="text-[clamp(0.9rem,1.6vw,1.6rem)] text-moon-dim">
            One of you is somewhere else entirely.
          </p>
          <div className="mt-[2vmin] flex flex-wrap justify-center gap-3">
            {players.map((p) => (
              <span
                key={p.id}
                className={[
                  "rounded-full border px-4 py-2 font-display uppercase tracking-wide",
                  state.ready.includes(p.id)
                    ? "border-accent/60 bg-accent/10 text-accent-bright"
                    : "border-white/10 text-moon-deep",
                ].join(" ")}
              >
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
        </Centre>
      )}

      {state.phase === "talk" && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-[2vmin]">
          <p
            className={[
              "shrink-0 font-display text-[clamp(3rem,11vw,11rem)] font-bold tabular-nums leading-none",
              left <= 30 ? "text-rose-400" : "accent-text",
            ].join(" ")}
          >
            {clock}
          </p>
          <p className="shrink-0 font-display text-sm uppercase tracking-[0.25em] text-moon-deep">
            Ask each other questions · anyone can call a vote from their phone
          </p>
          <div className="grid min-h-0 flex-1 w-full grid-cols-2 content-start gap-[1vmin] overflow-auto px-[4vw] sm:grid-cols-3 lg:grid-cols-5">
            {state.places.map((place) => (
              <div
                key={place.name}
                className="rounded-lg border border-white/10 bg-dusk/50 px-3 py-[1.2vmin] text-center font-display text-[clamp(0.7rem,1.15vw,1.3rem)] uppercase tracking-wide text-moon/75"
              >
                {place.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.phase === "vote" && (
        <Centre>
          <p className="t-clue font-display uppercase tracking-wide text-moon">
            Who is it?
          </p>
          <p className="text-[clamp(0.9rem,1.6vw,1.6rem)] text-moon-dim">
            {byId(state.calledBy)?.name ?? "Someone"} called it. Everyone votes
            on their phone.
          </p>
          <div className="mt-[2vmin] flex flex-wrap justify-center gap-3">
            {players.map((p) => (
              <span
                key={p.id}
                className={[
                  "rounded-full border px-4 py-2 font-display uppercase tracking-wide",
                  state.votes[p.id]
                    ? "border-accent/60 bg-accent/10 text-accent-bright"
                    : "border-white/10 text-moon-deep",
                ].join(" ")}
              >
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
        </Centre>
      )}

      {state.phase === "reveal" && (
        <Centre>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="t-label font-display uppercase text-moon-deep"
          >
            {state.outcome === "impostor-caught"
              ? "Caught"
              : state.outcome === "place-guessed"
                ? "Named it"
                : "Got away with it"}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="accent-text t-hero font-display font-bold uppercase tracking-tight"
          >
            {byId(state.impostorId)?.name ?? "Nobody"}
          </motion.h2>
          <p className="text-[clamp(1rem,2vw,2rem)] text-moon-dim">
            It was <span className="text-accent">{impostorPlace(state)?.name}</span>
            {state.guessedPlace !== null && (
              <>
                {" "}
                · they guessed{" "}
                <span className="text-accent">
                  {state.places[state.guessedPlace]?.name}
                </span>
              </>
            )}
          </p>
          <button onClick={onNext} className="btn-accent mt-[2vmin] px-12 py-4 text-xl">
            Next round
          </button>
        </Centre>
      )}

      <div className="flex shrink-0 flex-wrap justify-center gap-2">
        {players.map((p) => (
          <span
            key={p.id}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-display text-xs uppercase tracking-wide text-moon-dim"
          >
            {p.emoji} {p.name} ·{" "}
            <ScoreNudge
              step={100}
              size="small"
              onAdjust={(delta) => onAdjust(p.id, delta)}
            >
              <Tally value={p.score} />
            </ScoreNudge>
          </span>
        ))}
      </div>
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[1.5vmin] text-center">
      {children}
    </div>
  );
}
