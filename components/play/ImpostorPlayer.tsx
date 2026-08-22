"use client";

import { useState } from "react";
import type { ImpostorState } from "@/lib/games/impostor";
import type { ViewerExtras } from "@/lib/room/redact";
import type { Player, Room } from "@/lib/room/types";
import { connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: ImpostorState & ViewerExtras;
  me: Player;
  onReady: () => void;
  onAccuse: () => void;
  onVote: (playerId: string) => void;
  onGuessPlace: (index: number) => void;
};

export function ImpostorPlayer({
  room,
  state,
  me,
  onReady,
  onAccuse,
  onVote,
  onGuessPlace,
}: Props) {
  const [naming, setNaming] = useState(false);
  const others = connectedPlayers(room).filter((p) => p.id !== me.id);
  const impostor = Boolean(state.youAreImpostor);

  if (state.phase === "reveal" || state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">
          {me.score.toLocaleString()} points
        </p>
        <p className="text-moon-dim">Look at the TV.</p>
      </Centre>
    );
  }

  if (state.phase === "deal") {
    const ready = state.ready.includes(me.id);
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-6 p-6 text-center">
        {impostor ? (
          <>
            <p className="font-display text-sm uppercase tracking-[0.3em] text-rose-400">
              You are the impostor
            </p>
            <p className="font-display text-4xl uppercase leading-tight text-moon">
              You don&apos;t know where you are
            </p>
            <p className="text-moon-dim">
              Everyone else does. Answer as if you belong, and work out the
              place before they work out you.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-sm uppercase tracking-[0.3em] text-moon-deep">
              You are at
            </p>
            <p className="accent-text font-display text-4xl uppercase leading-tight">
              {state.yourPlace}
            </p>
            <p className="font-display text-xl uppercase tracking-wide text-moon/75">
              {state.yourRole}
            </p>
            <p className="text-moon-deep">
              One of you is somewhere else. Don&apos;t make it obvious where
              this is.
            </p>
          </>
        )}
        <button
          onClick={onReady}
          disabled={ready}
          className="btn-accent w-full py-6 text-2xl"
        >
          {ready ? "Waiting for the others…" : "Got it"}
        </button>
      </main>
    );
  }

  if (state.phase === "vote") {
    const voted = state.votes[me.id];
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-4 p-5">
        <p className="text-center font-display text-xl uppercase tracking-wide text-moon">
          Who is it?
        </p>
        <div className="flex flex-col gap-2.5">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className={[
                "flex items-center gap-3 rounded-xl border px-5 py-5 text-left text-lg transition-colors",
                voted === p.id
                  ? "border-accent bg-accent/20 text-moon"
                  : "border-white/12 bg-white/[0.03] text-moon/75",
              ].join(" ")}
            >
              <span className="text-2xl">{p.emoji}</span>
              {p.name}
            </button>
          ))}
        </div>
        {impostor && <NamePlace state={state} onGuessPlace={onGuessPlace} />}
      </main>
    );
  }

  /* talking */
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-5 p-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        {impostor ? (
          <p className="font-display text-2xl uppercase tracking-wide text-rose-300">
            You&apos;re the impostor
          </p>
        ) : (
          <>
            <p className="accent-text font-display text-3xl uppercase leading-tight">
              {state.yourPlace}
            </p>
            <p className="mt-2 font-display uppercase tracking-wide text-moon/75">
              {state.yourRole}
            </p>
          </>
        )}
      </div>

      <button onClick={onAccuse} className="btn-bad w-full py-6 text-2xl">
        Call a vote
      </button>

      {impostor &&
        (naming ? (
          <NamePlace state={state} onGuessPlace={onGuessPlace} />
        ) : (
          <button
            onClick={() => setNaming(true)}
            className="btn-ghost w-full py-4"
          >
            I know where we are
          </button>
        ))}
    </main>
  );
}

/** The impostor's one shot. Getting it wrong ends the round just as fast. */
function NamePlace({
  state,
  onGuessPlace,
}: {
  state: ImpostorState;
  onGuessPlace: (index: number) => void;
}) {
  return (
    <div className="mt-2">
      <p className="mb-2 text-center font-display text-xs uppercase tracking-[0.25em] text-rose-300">
        One guess. Wrong and it&apos;s over.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {state.places.map((place, i) => (
          <button
            key={place.name}
            onClick={() => onGuessPlace(i)}
            className="rounded-xl border border-white/12 bg-white/[0.03] px-3 py-4 text-sm text-moon/75 active:border-rose-400"
          >
            {place.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
