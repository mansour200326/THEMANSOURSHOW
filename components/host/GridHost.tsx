"use client";

import { motion } from "framer-motion";
import type { CodeGridState } from "@/lib/games/codegrid";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: CodeGridState & ViewerExtras;
  onQuit: () => void;
};

/** Face-up words wear their team's colour; the assassin wears none of them. */
const FACE: Record<string, string> = {
  a: "border-sky-400/70 bg-sky-500/25 text-sky-100",
  b: "border-amber-400/70 bg-amber-500/25 text-amber-100",
  neutral: "border-white/15 bg-white/[0.06] text-moon-dim",
  assassin: "border-rose-500 bg-rose-950 text-rose-300",
};

export function GridHost({ room, state, onQuit }: Props) {
  const players = connectedPlayers(room);
  const name = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "—";

  if (state.phase === "done") {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-[3vmin] p-[3vmin] text-center">
        <p className="t-label font-display uppercase text-moon-deep">
          {state.struckAssassin ? "The assassin" : "All their words"}
        </p>
        <h2 className="brand-text t-hero font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(255,107,87,0.45)]">
          {state.winner !== null ? state.teams[state.winner].name : "Nobody"}
        </h2>
        <Grid state={state} reveal />
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
    <div className="grid w-full max-w-[92vw] grid-cols-5 gap-[0.8vmin]">
      {state.words.map((word, i) => {
        const shown = reveal || state.revealed.includes(i);
        const owner = state.key[i];
        return (
          <motion.div
            key={i}
            animate={{ scale: state.revealed.includes(i) ? 0.97 : 1 }}
            className={[
              "flex aspect-[5/3] items-center justify-center rounded-xl border px-2 text-center font-display uppercase tracking-wide transition-colors",
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
