"use client";

import { motion } from "framer-motion";
import { useRoundCard } from "@/components/RoundCard";
import { SketchCanvas } from "@/components/SketchCanvas";
import { Tally } from "@/components/Tally";
import { WinnerMoment } from "@/components/WinnerMoment";
import { useCue, useCueWhen } from "@/components/useCue";
import { type StrokeState, strokeColourFor, strokeDrawer, strokePair, strokeTotal } from "@/lib/games/oneStroke";
import { SKETCH_COLOURS } from "@/lib/games/sketch";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: StrokeState & ViewerExtras;
  onForce: () => void;
  onNext: () => void;
  onQuit: () => void;
};

/**
 * The picture is the whole screen, growing a line at a time. Beside it: the
 * category — the one thing the fake artist knows — and who holds the pen.
 */
export function StrokeHost({ room, state, onForce, onNext, onQuit }: Props) {
  const players = connectedPlayers(room);
  const drawerId = strokeDrawer(state);
  const drawer = playerById(room, drawerId ?? undefined);
  const fake = playerById(room, state.fakeId ?? undefined);
  const pair = strokePair(state);
  const roundCard = useRoundCard(state.round, state.pairs.length, state.phase !== "done");

  useCue(`${state.round}:${state.phase}`, state.phase === "vote" ? "whoosh" : state.phase === "reveal" ? (state.fakeWon ? "wrong" : "correct") : null);
  useCueWhen(state.phase === "done", "fanfare");

  if (state.phase === "done") {
    const ranked = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="flex min-h-dvh lg:h-dvh flex-col items-center justify-center gap-[2vmin] p-[3vmin] text-center pb-16 lg:pb-[1.6vmin]">
        <WinnerMoment>{ranked[0] ? `${ranked[0].emoji} ${ranked[0].name} wins` : "Nobody"}</WinnerMoment>
        <div className="w-full max-w-3xl space-y-2">
          {ranked.map((p, i) => (
            <div key={p.id} className={["flex items-center justify-between rounded-xl border px-5 py-3", i === 0 ? "border-accent/50 bg-accent/[0.08]" : "border-line/10"].join(" ")}>
              <span className="flex items-center gap-3 font-display text-xl uppercase tracking-wide text-moon">
                <span className="w-6 tabular-nums text-moon-dim">{i + 1}</span>
                <span>{p.emoji}</span>
                {p.name}
              </span>
              <span className="font-display text-xl font-bold tabular-nums text-accent"><Tally value={p.score} /></span>
            </div>
          ))}
        </div>
        <button onClick={onQuit} className="btn-brand px-10 py-4 text-lg">Back to the lobby</button>
      </main>
    );
  }

  const votesIn = Object.keys(state.votes).length;

  return (
    <main className="flex min-h-dvh lg:h-dvh gap-[2vmin] p-[2vmin] pb-16 lg:pb-[1.6vmin]">
      {roundCard}
      <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[1.5vmin]">
        <SketchCanvas strokes={state.strokes} live={state.live} className={state.phase === "reveal" ? "h-full max-h-[62vh] w-auto lg:max-h-[78vh]" : "h-full max-h-[78vh] w-auto"} />
        {state.phase === "reveal" && (
          <motion.p initial={{ scale: 0.94 }} animate={{ scale: 1 }} className="accent-text t-answer font-display font-bold uppercase lg:hidden">
            {pair?.word}
          </motion.p>
        )}
      </section>

      <aside className="flex w-[28vw] min-w-[260px] shrink-0 flex-col gap-[1.5vmin]">
        <span className="font-display text-[clamp(0.95rem,1.4vw,1.7rem)] uppercase tracking-[0.2em] text-moon-dim">
          Round {state.round + 1}/{state.pairs.length}
        </span>
        <div>
          <p className="font-display text-[clamp(0.8rem,1.15vw,1.35rem)] uppercase tracking-[0.25em] text-moon-dim">Category</p>
          <p className="accent-text font-display text-[clamp(1.6rem,3.4vw,3.4rem)] font-bold uppercase leading-none">
            {pair?.category}
          </p>
        </div>

        {state.phase === "draw" && (
          <p className="font-display text-[clamp(1rem,1.6vw,1.6rem)] uppercase tracking-wide text-moon">
            <span
              className="mr-2 inline-block h-[0.8em] w-[0.8em] rounded-full align-middle"
              style={{ backgroundColor: SKETCH_COLOURS[drawerId ? strokeColourFor(state, drawerId) : 0] }}
            />
            {drawer?.emoji} {drawer?.name} draws
            <span className="ml-2 text-moon-dim">· line {Math.min(state.turn + 1, strokeTotal(state))} of {strokeTotal(state)}</span>
          </p>
        )}
        {state.phase === "vote" && (
          <p className="font-display text-[clamp(1.1rem,1.8vw,1.8rem)] uppercase tracking-wide text-moon">
            Who was faking it?
            <span className="ml-2 text-moon-dim">{votesIn}/{players.length} voted</span>
          </p>
        )}
        {state.phase === "guess" && (
          <p className="font-display text-[clamp(1.1rem,1.8vw,1.8rem)] uppercase tracking-wide text-moon">
            Caught — {fake?.emoji} {fake?.name} gets one guess
          </p>
        )}
        {state.phase === "reveal" && (
          <p className="font-display text-[clamp(1.1rem,1.8vw,1.8rem)] uppercase tracking-wide text-moon">
            {fake?.emoji} {fake?.name} was the fake
            <span className="block text-moon-dim">
              {state.caught === false
                ? "and got away with it"
                : state.fakeWon
                  ? `caught, but guessed “${state.guess}”`
                  : state.guess
                    ? `caught, and guessed “${state.guess}”`
                    : "caught"}
            </span>
          </p>
        )}

        {/* One colour each, all game — the legend the room reads the picture by. */}
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
          {state.order.map((id) => {
            const p = playerById(room, id);
            if (!p) return null;
            const voted = state.votes[id] !== undefined;
            return (
              <div
                key={id}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[clamp(0.95rem,1.4vw,1.7rem)]",
                  id === drawerId ? "border-accent/60 bg-accent/[0.08] text-moon" : "border-line/10 bg-line/[0.02] text-moon-dim",
                ].join(" ")}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SKETCH_COLOURS[strokeColourFor(state, id)] }} />
                <span>{p.emoji}</span>
                <span className="font-display uppercase tracking-wide">{p.name}</span>
                <span className="ml-auto tabular-nums text-accent"><Tally value={p.score} /></span>
                {state.phase === "vote" && <span className="text-[clamp(0.8rem,1.15vw,1.35rem)] text-moon-dim">{voted ? "✓" : "…"}</span>}
              </div>
            );
          })}
        </div>

        {(state.phase === "draw" || state.phase === "vote" || state.phase === "guess") && (
          <button onClick={onForce} className="btn-ghost w-full py-3 text-[clamp(0.95rem,1.4vw,1.7rem)]">
            {state.phase === "draw" ? "Skip this line" : state.phase === "vote" ? "Close the vote" : "No guess"}
          </button>
        )}
        {state.phase === "reveal" && (
          <div className="hidden lg:block">
            <p className="font-display text-[clamp(0.8rem,1.15vw,1.35rem)] uppercase tracking-[0.25em] text-moon-dim">It was</p>
            <p className="accent-text font-display text-[clamp(1.6rem,3.2vw,3.4rem)] font-bold uppercase leading-none">
              {pair?.word}
            </p>
          </div>
        )}
        {state.phase === "reveal" && (
          <button onClick={onNext} className="btn-accent w-full py-4 text-lg">
            {state.round + 1 >= state.pairs.length ? "Final scores" : "Next picture"}
          </button>
        )}
      </aside>
    </main>
  );
}
