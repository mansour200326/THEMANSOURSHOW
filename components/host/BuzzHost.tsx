"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BoardGrid } from "@/components/board/BoardGrid";
import { type BuzzState, buzzCurrent } from "@/lib/games/buzzEngine";
import { type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: BuzzState;
  send: (type: string, payload?: Record<string, unknown>) => void;
};

export function BuzzHost({ room, state, send }: Props) {
  const item = buzzCurrent(state);
  const buzzer = playerById(room, state.buzzedBy ?? undefined);

  // The host has to know the answer to judge a buzz, but putting it on the TV
  // spoils it for everyone still playing. This shows it small, host-side only,
  // and resets itself on every new item so it can't leak into the next one.
  const [peek, setPeek] = useState(false);
  useEffect(() => setPeek(false), [item?.prompt]);

  return (
    <main className="flex h-dvh flex-col gap-[1.2vmin] overflow-hidden p-[1.6vmin]">
      <header className="flex shrink-0 items-center justify-between">
        <span className="font-display text-xs uppercase tracking-[0.25em] text-slate-500">
          {state.mode === "sequence"
            ? `Riddle ${Math.min(state.index + 1, state.items.length)} of ${state.items.length}`
            : "Pick a tile, then race for it"}
        </span>
        <button onClick={() => send("game:end")} className="btn-ghost px-3 py-1.5 text-xs">
          End game
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {state.phase === "done" ? (
          <Standings room={room} />
        ) : state.phase === "picking" && state.board ? (
          <div className="flex h-full w-full flex-col gap-[1.2vmin]">
            <p className="shrink-0 text-center font-display text-[clamp(0.85rem,1.5vw,1.8rem)] uppercase tracking-[0.25em] text-slate-400">
              <span className="text-cream-bright">
                {playerById(room, state.picker ?? undefined)?.name ?? "Host"}
              </span>{" "}
              picks
            </p>
            <div className="min-h-0 flex-1">
              <BoardGrid
                board={state.board}
                spent={state.spent}
                onPick={(ref) => send("pick", { c: ref.c, r: ref.r })}
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-[3vmin] px-[4vw] text-center">
            {/* The prompt — emoji get huge, clues stay readable */}
            <motion.p
              key={item?.prompt}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className={
                state.mode === "sequence"
                  ? "text-[clamp(4rem,16vw,16rem)] leading-none"
                  : "t-clue text-balance font-display uppercase tracking-wide text-slate-50"
              }
            >
              {item?.prompt}
            </motion.p>

            <AnimatePresence mode="wait">
              {state.phase === "buzzed" && buzzer ? (
                <motion.div
                  key="buzzed"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-[clamp(3rem,7vw,6rem)]">{buzzer.emoji}</span>
                  <span className="cream-text font-display text-[clamp(2rem,5vw,5rem)] font-bold uppercase">
                    {buzzer.name}
                  </span>
                  <span className="font-display text-sm uppercase tracking-[0.25em] text-slate-500">
                    Answer out loud
                  </span>
                </motion.div>
              ) : state.phase === "open" ? (
                <motion.p
                  key="open"
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="font-display text-[clamp(1.1rem,2.4vw,2.6rem)] uppercase tracking-[0.3em] text-cream"
                >
                  Buzz in
                </motion.p>
              ) : null}
            </AnimatePresence>

            {state.revealed && item && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="cream-text t-answer font-display font-bold uppercase"
              >
                {item.answer}
              </motion.p>
            )}

            {state.lockedOut.length > 0 && state.phase === "open" && (
              <p className="font-display text-sm uppercase tracking-[0.2em] text-rose-400">
                Out: {state.lockedOut.map((id) => playerById(room, id)?.name).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Host controls */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
        {state.phase === "buzzed" && (
          <>
            <button onClick={() => send("judge", { correct: true })} className="btn-good px-10 py-3 text-lg">
              ✓ Correct
            </button>
            <button onClick={() => send("judge", { correct: false })} className="btn-bad px-10 py-3 text-lg">
              ✗ Wrong
            </button>
            <button onClick={() => send("reopen")} className="btn-ghost text-sm">
              Misfire — reopen
            </button>
          </>
        )}
        {state.phase === "open" && (
          <>
            <button onClick={() => send("reveal")} className="btn-ghost text-sm">
              Show on TV
            </button>
            <button onClick={() => send("skip")} className="btn-ghost text-sm">
              Nobody — next
            </button>
          </>
        )}

        {/* Host-only answer check — small on purpose. */}
        {item && (state.phase === "open" || state.phase === "buzzed") && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeek((v) => !v)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              {peek ? "Hide" : "Peek"}
            </button>
            <span
              className={[
                "font-display text-xs uppercase tracking-wider transition-opacity",
                peek ? "text-cream/80 opacity-100" : "select-none opacity-0",
              ].join(" ")}
            >
              {item.answer}
            </span>
          </div>
        )}
        {state.phase === "scored" && (
          <button onClick={() => send("continue")} className="btn-cream px-10 py-3 text-lg">
            Next
          </button>
        )}
        {state.phase === "done" && (
          <button onClick={() => send("game:end")} className="btn-cream px-10 py-3 text-lg">
            Back to the lobby
          </button>
        )}
      </div>

      {/* Scores */}
      <div className="flex shrink-0 flex-wrap justify-center gap-[0.6vmin]">
        {connectedPlayers(room).map((p) => (
          <div
            key={p.id}
            className={[
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors",
              state.buzzedBy === p.id
                ? "border-cream/70 bg-cream/15"
                : state.lockedOut.includes(p.id)
                  ? "border-rose-500/40 bg-rose-500/5 opacity-50"
                  : "border-white/10 bg-white/[0.03]",
            ].join(" ")}
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="font-display text-sm uppercase tracking-wide text-slate-300">
              {p.name}
            </span>
            <span
              className={[
                "font-display text-sm font-bold tabular-nums",
                p.score < 0 ? "text-rose-400" : "text-cream",
              ].join(" ")}
            >
              {p.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

function Standings({ room }: { room: Room }) {
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full max-w-3xl space-y-2">
      <p className="mb-[2vmin] text-center font-display text-[clamp(1.5rem,4vw,4rem)] uppercase text-cream">
        Game over
      </p>
      {ranked.map((p, i) => (
        <div
          key={p.id}
          className={[
            "flex items-center justify-between rounded-xl border px-5 py-3",
            i === 0 ? "border-cream/50 bg-cream/[0.08]" : "border-white/10",
          ].join(" ")}
        >
          <span className="flex items-center gap-3 font-display text-xl uppercase tracking-wide text-slate-100">
            <span className="w-6 tabular-nums text-slate-500">{i + 1}</span>
            <span>{p.emoji}</span>
            {p.name}
          </span>
          <span className="font-display text-xl font-bold tabular-nums text-cream">
            {p.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
