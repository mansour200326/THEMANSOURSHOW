"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SketchCanvas } from "@/components/SketchCanvas";
import type { SketchState } from "@/lib/games/sketch";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: SketchState & ViewerExtras;
  onTimeUp: () => void;
  onNext: () => void;
  onQuit: () => void;
};

export function SketchHost({ room, state, onTimeUp, onNext, onQuit }: Props) {
  const players = connectedPlayers(room);
  const drawer = players.find((p) => p.id === state.drawerId);
  const [left, setLeft] = useState(state.seconds);

  // Same as Impostor: the clock runs on the TV and the server is only told
  // when it hits zero, so a ticking number never touches the room state.
  useEffect(() => {
    if (state.phase !== "drawing" || !state.startedAt) {
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
    if (state.phase === "drawing" && left === 0) onTimeUp();
  }, [left, state.phase, onTimeUp]);

  if (state.phase === "done") {
    const standings = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-[3vmin] p-[3vmin] text-center">
        <p className="t-label font-display uppercase text-moon-deep">
          Sketch &amp; Guess — pens down
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

  const guessing = players.filter((p) => p.id !== state.drawerId);

  return (
    <main className="flex h-dvh gap-[2vmin] p-[2vmin]">
      <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[1.5vmin]">
        <SketchCanvas
          strokes={state.strokes}
          live={state.live}
          className="h-full max-h-[78vh] w-auto"
        />
        {state.phase === "reveal" && (
          <motion.p
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="accent-text t-answer font-display font-bold uppercase"
          >
            {state.words[state.round]}
          </motion.p>
        )}
      </section>

      <aside className="flex w-[26vw] min-w-[240px] shrink-0 flex-col gap-[1.5vmin]">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-moon-deep">
            Round {state.round + 1}/{state.totalRounds ?? state.words.length}
          </span>
          <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
            End
          </button>
        </div>

        <p
          className={[
            "text-center font-display text-[clamp(2rem,5vw,4.5rem)] font-bold tabular-nums leading-none",
            left <= 15 && state.phase === "drawing" ? "text-rose-400" : "accent-text",
          ].join(" ")}
        >
          {state.phase === "drawing" ? left : "—"}
        </p>

        <p className="text-center font-display text-sm uppercase tracking-wide text-moon-dim">
          {drawer?.emoji} {drawer?.name} is drawing
        </p>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
          <AnimatePresence initial={false}>
            {guessing.map((p) => {
              const place = state.solved.indexOf(p.id);
              const last = state.guesses[p.id]?.slice(-1)[0];
              return (
                <motion.div
                  key={p.id}
                  layout
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    place >= 0
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.02] text-moon-dim",
                  ].join(" ")}
                >
                  <span>{p.emoji}</span>
                  <span className="font-display uppercase tracking-wide">
                    {p.name}
                  </span>
                  <span className="ml-auto truncate">
                    {place >= 0 ? `#${place + 1}` : (last ?? "…")}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {state.phase === "reveal" && (
          <button onClick={onNext} className="btn-accent w-full py-4 text-lg">
            Next drawing
          </button>
        )}
      </aside>
    </main>
  );
}
