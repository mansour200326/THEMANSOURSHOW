"use client";

import { useEffect, useState } from "react";
import type { ActState } from "@/lib/games/actOut";
import { clockLeft } from "@/lib/games/leadIn";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Player, type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: ActState & ViewerExtras;
  me: Player;
  onStart: () => void;
  onGot: (by: string | null) => void;
  onPass: () => void;
};

/**
 * The actor's phone is the hat: it holds the word, and two buttons. Everyone
 * else's phone says one thing — shout — and stays out of the way.
 */
export function ActPlayer({ room, state, me, onStart, onGot, onPass }: Props) {
  const acting = state.actorId === me.id;
  const actor = playerById(room, state.actorId ?? undefined);
  const [left, setLeft] = useState(state.seconds);
  const [naming, setNaming] = useState(false);

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

  // A new word means the naming panel is over.
  useEffect(() => setNaming(false), [state.cursor, state.phase]);

  if (state.phase === "done") {
    const ranked = [...room.players].sort((a, b) => b.score - a.score);
    const place = ranked.findIndex((p) => p.id === me.id) + 1;
    return (
      <Centre>
        <p className="font-display text-6xl text-accent">#{place}</p>
        <p className="text-moon-dim">{me.score.toLocaleString()} points</p>
      </Centre>
    );
  }

  if (state.phase === "turnOver") {
    const gained = state.lastScores[me.id] ?? 0;
    return (
      <Centre>
        <p className="font-display text-sm uppercase tracking-[0.25em] text-moon-deep">
          Time
        </p>
        <p className="font-display text-3xl uppercase text-moon">
          {state.got.length} got
        </p>
        <p className={["font-display text-5xl font-bold", gained ? "text-emerald-300" : "text-moon-deep/70"].join(" ")}>
          {gained ? `+${gained}` : "—"}
        </p>
      </Centre>
    );
  }

  if (!acting) {
    return (
      <Centre>
        <p className="text-6xl">{actor?.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">
          {actor?.name} {state.phase === "ready" ? "is up" : "is acting"}
        </p>
        {state.phase === "acting" ? (
          <>
            <p className="font-display text-7xl font-bold tabular-nums text-accent">{left}</p>
            <p className="accent-text font-display text-xl uppercase tracking-[0.2em]">Shout it out</p>
          </>
        ) : (
          <p className="text-moon-deep">Look at them, not at this.</p>
        )}
      </Centre>
    );
  }

  if (state.phase === "ready") {
    return (
      <Centre>
        <p className="font-display text-sm uppercase tracking-[0.25em] text-moon-deep">You&apos;re up</p>
        <p className="max-w-xs text-balance text-moon-dim">
          Stand where everyone can see you. The word appears when the clock starts.
        </p>
        <button onClick={onStart} className="btn-accent w-full max-w-xs py-6 text-2xl">
          Start
        </button>
      </Centre>
    );
  }

  /* acting */
  const others = connectedPlayers(room).filter((p) => p.id !== me.id);
  return (
    <main className="flex min-h-dvh flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-[0.25em] text-moon-deep">
          {state.got.length} got
        </span>
        <span className={["font-display text-3xl font-bold tabular-nums", left <= 10 ? "text-rose-400" : "text-accent"].join(" ")}>
          {left}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-moon-deep">Act this</p>
        <p className="accent-text text-balance font-display text-[clamp(2rem,10vw,3.4rem)] font-bold uppercase leading-tight">
          {state.yourWord}
        </p>
      </div>

      {naming ? (
        <div className="flex flex-col gap-2">
          <p className="text-center font-display text-sm uppercase tracking-[0.2em] text-moon-dim">
            Who got it?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => onGot(p.id)}
                className="rounded-xl border border-line/15 bg-line/[0.04] px-4 py-4 text-left font-display text-lg uppercase tracking-wide text-moon active:border-accent/70"
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
          <button onClick={() => onGot(null)} className="btn-ghost w-full py-3">
            Everyone at once
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={onPass} className="btn-ghost flex-1 py-6 text-xl">
            Pass
          </button>
          <button onClick={() => setNaming(true)} className="btn-accent flex-[2] py-6 text-2xl">
            Got it
          </button>
        </div>
      )}
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
