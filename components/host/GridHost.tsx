"use client";

import { motion } from "framer-motion";
import { useCue, useCueWhen } from "@/components/useCue";
import type { CodeGridState } from "@/lib/games/codegrid";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: CodeGridState & ViewerExtras;
  onBegin: () => void;
  onQuit: () => void;
};

/** Face-up words wear their team's colour; the assassin wears none of them. */
const FACE: Record<string, string> = {
  a: "border-sky-400/70 bg-sky-500/25 text-sky-100",
  b: "border-amber-400/70 bg-amber-500/25 text-amber-100",
  neutral: "border-white/15 bg-white/[0.06] text-moon-dim",
  assassin: "border-rose-500 bg-rose-950 text-rose-300",
};

export function GridHost({ room, state, onBegin, onQuit }: Props) {
  const players = connectedPlayers(room);
  const name = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "—";

  // A word turning over, a clue being given, and the assassin.
  useCue(state.revealed.length, state.revealed.length ? "reveal" : null);
  useCue(state.clue?.word ?? null, state.clue ? "pop" : null);
  useCueWhen(state.struckAssassin, "wrong");
  useCueWhen(state.phase === "done" && !state.struckAssassin, "fanfare");

  /*
   * The sides used to be dealt at random the instant the game loaded, key
   * cards included. Four people put into the wrong two pairs is the fastest
   * way to ruin this game, and there was no way to undo it short of quitting.
   * Now the random deal is only a starting suggestion and the room fixes it on
   * their phones while the TV shows where everybody has landed.
   */
  if (state.phase === "teams") {
    const ready = state.teams.every((t) => t.spymaster);
    return (
      <main className="flex h-dvh flex-col gap-[3vmin] p-[4vmin]">
        <h2 className="shrink-0 text-center font-display t-title uppercase tracking-tight text-moon">
          Pick your sides
        </h2>
        <p className="shrink-0 text-center t-label text-moon-deep">
          On your phone: choose a side, and one of you takes the key card.
        </p>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-[3vmin]">
          {state.teams.map((t, i) => (
            <div
              key={i}
              className={[
                "flex min-h-0 flex-col gap-[1.5vmin] rounded-3xl border p-[3vmin]",
                i === 0
                  ? "border-sky-400/50 bg-sky-500/[0.07]"
                  : "border-amber-400/50 bg-amber-500/[0.07]",
              ].join(" ")}
            >
              <p
                className={[
                  "font-display text-[clamp(1.2rem,3vw,2.6rem)] uppercase tracking-wide",
                  i === 0 ? "text-sky-200" : "text-amber-200",
                ].join(" ")}
              >
                {t.name}
              </p>
              <p className="t-label uppercase tracking-[0.2em] text-moon-deep">
                Key card
              </p>
              <p className="font-display text-[clamp(1rem,2.2vw,2rem)] text-moon">
                {t.spymaster ? name(t.spymaster) : "— nobody yet —"}
              </p>
              <p className="mt-[1vmin] t-label uppercase tracking-[0.2em] text-moon-deep">
                Guessing
              </p>
              <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] leading-relaxed text-moon/75">
                {t.members.length
                  ? t.members.map(name).join(" · ")
                  : "— nobody yet —"}
              </p>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-center gap-4">
          <button
            onClick={onBegin}
            disabled={!ready}
            className="btn-brand px-10 py-4 text-lg disabled:opacity-40"
          >
            {ready ? "Deal the words" : "Both sides need a key card"}
          </button>
          <button onClick={onQuit} className="btn-ghost px-5 py-3 text-sm">
            End segment
          </button>
        </div>
      </main>
    );
  }

  if (state.phase === "done") {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-[3vmin] p-[3vmin] text-center">
        <p className="t-label font-display uppercase text-moon-deep">
          {state.struckAssassin ? "The assassin" : "All their words"}
        </p>
        <h2 className="brand-text t-hero font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(255,107,87,0.45)]">
          {state.winner !== null ? state.teams[state.winner].name : "Nobody"}
        </h2>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <Grid state={state} reveal />
        </div>
        <button onClick={onQuit} className="btn-brand px-10 py-4 text-lg">
          Back to the lobby
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col gap-[1.5vmin] p-[1.8vmin]">
      <header className="flex shrink-0 items-center justify-between px-2">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-moon-deep">
          Code Grid
        </span>
        <div className="flex items-center gap-4">
          <Tally label={state.teams[0].name} left={state.remaining?.[0] ?? 0} tone="sky" />
          <Tally label={state.teams[1].name} left={state.remaining?.[1] ?? 0} tone="amber" />
          <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
            End segment
          </button>
        </div>
      </header>

      <p className="shrink-0 text-center font-display text-[clamp(1rem,2.4vw,2.6rem)] uppercase tracking-[0.15em] text-accent">
        {state.phase === "clue"
          ? `${name(state.teams[state.turn].spymaster)} is thinking of a clue…`
          : state.clue
            ? `“${state.clue.word}” — ${state.clue.count} · ${state.guessesLeft} ${
                state.guessesLeft === 1 ? "guess" : "guesses"
              } left`
            : ""}
      </p>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Grid state={state} />
      </div>
    </main>
  );
}

function Tally({
  label,
  left,
  tone,
}: {
  label: string;
  left: number;
  tone: "sky" | "amber";
}) {
  return (
    <span
      className={[
        "rounded-full border px-4 py-1 font-display text-sm uppercase tracking-wide",
        tone === "sky"
          ? "border-sky-400/50 text-sky-200"
          : "border-amber-400/50 text-amber-200",
      ].join(" ")}
    >
      {label} · {left}
    </span>
  );
}

function Grid({ state, reveal }: { state: CodeGridState & ViewerExtras; reveal?: boolean }) {
  return (
    // Five fixed rows filling the height they're given, rather than tiles
    // with a fixed aspect: five rows of 5:3 are 0.6x as tall as the grid is
    // wide, which walks straight off the bottom of a 16:9 TV.
    <div className="grid h-full w-full max-w-[92vw] grid-cols-5 grid-rows-5 gap-[0.8vmin]">
      {state.words.map((word, i) => {
        const shown = reveal || state.revealed.includes(i);
        const owner = state.key[i];
        return (
          <motion.div
            key={i}
            animate={{ scale: state.revealed.includes(i) ? 0.97 : 1 }}
            className={[
              "flex min-h-0 items-center justify-center rounded-xl border px-2 text-center font-display uppercase tracking-wide transition-colors",
              "text-[clamp(0.6rem,1.35vw,1.6rem)]",
              shown && owner !== "hidden"
                ? FACE[owner]
                : "tile-face border-white/10 text-moon",
            ].join(" ")}
          >
            {word}
          </motion.div>
        );
      })}
    </div>
  );
}
