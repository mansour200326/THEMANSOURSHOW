"use client";

import { useState } from "react";
import type { CodeGridState } from "@/lib/games/codegrid";
import type { ViewerExtras } from "@/lib/room/redact";
import type { Player } from "@/lib/room/types";

type Props = {
  state: CodeGridState & ViewerExtras;
  me: Player;
  onClue: (word: string, count: number) => void;
  onTap: (index: number) => void;
  onPass: () => void;
};

/** The key card, as seen by the two people allowed to see it. */
const KEY_FACE: Record<string, string> = {
  a: "border-sky-400/70 bg-sky-500/30 text-sky-100",
  b: "border-amber-400/70 bg-amber-500/30 text-amber-100",
  neutral: "border-white/15 bg-white/[0.05] text-moon-deep",
  assassin: "border-rose-500 bg-rose-900 text-rose-200",
  hidden: "border-white/12 bg-white/[0.03] text-moon/75",
};

export function GridPlayer({ state, me, onClue, onTap, onPass }: Props) {
  const [word, setWord] = useState("");
  const [count, setCount] = useState(2);

  const team = state.yourTeam;
  const spymaster = Boolean(state.youAreSpymaster);
  const myTurn = team === state.turn;

  if (state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">
          {state.winner !== null ? state.teams[state.winner].name : "Nobody"} win
        </p>
        <p className="text-moon-dim">Look at the TV.</p>
      </Centre>
    );
  }

  if (team === undefined) {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="text-moon-dim">
          You joined mid-game — watch this one out.
        </p>
      </Centre>
    );
  }

  /* ---- the spymaster's key card ---- */
  if (spymaster) {
    const key = state.yourKey ?? [];
    return (
      <main className="flex min-h-dvh flex-col gap-3 p-3">
        <p className="text-center font-display text-xs uppercase tracking-[0.25em] text-accent">
          Only you can see this · {state.teams[team].name}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {state.words.map((w, i) => (
            <div
              key={i}
              className={[
                "flex aspect-square items-center justify-center rounded-lg border px-0.5 text-center text-[0.6rem] font-medium leading-tight",
                KEY_FACE[key[i] ?? "hidden"],
                state.revealed.includes(i) ? "opacity-35 line-through" : "",
              ].join(" ")}
            >
              {w}
            </div>
          ))}
        </div>

        {myTurn && state.phase === "clue" ? (
          <div className="mt-auto flex flex-col gap-3">
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="One word…"
              maxLength={30}
              className="field py-4 text-center text-xl"
            />
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={[
                    "h-12 w-12 rounded-full border font-display text-lg tabular-nums",
                    count === n
                      ? "border-accent bg-accent/20 text-accent-bright"
                      : "border-white/12 text-moon/75",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => word.trim() && onClue(word.trim(), count)}
              disabled={!word.trim()}
              className="btn-accent w-full py-5 text-xl"
            >
              Say it
            </button>
          </div>
        ) : (
          <p className="mt-auto pb-4 text-center text-moon-deep">
            {myTurn ? "Your team is guessing. Say nothing." : "Not your turn."}
          </p>
        )}
      </main>
    );
  }

  /* ---- everyone else taps the grid ---- */
  return (
    <main className="flex min-h-dvh flex-col gap-3 p-3">
      <p className="text-center font-display text-xs uppercase tracking-[0.25em] text-moon-deep">
        {state.teams[team].name} ·{" "}
        {myTurn
          ? state.phase === "guess"
            ? `“${state.clue?.word}” — ${state.guessesLeft} left`
            : "Waiting on your clue-giver"
          : "Other team's turn"}
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {state.words.map((w, i) => {
          const open = state.revealed.includes(i);
          return (
            <button
              key={i}
              onClick={() => onTap(i)}
              disabled={!myTurn || state.phase !== "guess" || open}
              className={[
                "flex aspect-square items-center justify-center rounded-lg border px-0.5 text-center text-[0.6rem] font-medium leading-tight transition-colors",
                open
                  ? "border-white/10 bg-white/[0.02] text-moon-deep/40 line-through"
                  : myTurn && state.phase === "guess"
                    ? "border-white/15 bg-white/[0.05] text-moon active:border-accent active:bg-accent/20"
                    : "border-white/10 bg-white/[0.02] text-moon-deep",
              ].join(" ")}
            >
              {w}
            </button>
          );
        })}
      </div>
      {myTurn && state.phase === "guess" && (
        <button onClick={onPass} className="btn-ghost mt-auto w-full py-4">
          We&apos;ll stop there
        </button>
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
