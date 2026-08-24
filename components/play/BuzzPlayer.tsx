"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type BuzzState, buzzArmed } from "@/lib/games/buzzEngine";
import type { Player, Room } from "@/lib/room/types";

type Props = {
  room: Room;
  state: BuzzState;
  me: Player;
  onBuzz: () => void;
  onPick: (c: number, r: number) => void;
};

export function BuzzPlayer({ room, state, me, onBuzz, onPick }: Props) {
  const iAmOut = state.lockedOut.includes(me.id);

  /*
   * The button is dead for a beat after the clue appears. Showing that plainly
   * matters — a button that looks live but ignores you feels broken, and one
   * that quietly locks you out for pressing it feels unfair unless it warned
   * you first.
   */
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (state.phase !== "open" || !state.openedAt) {
      setArmed(false);
      return;
    }
    const check = () => setArmed(buzzArmed(state));
    check();
    const id = window.setInterval(check, 80);
    return () => window.clearInterval(id);
  }, [state.phase, state.openedAt, state]);

  const live = state.phase === "open" && armed && !iAmOut;
  const iBuzzed = state.buzzedBy === me.id;
  const someoneElse = Boolean(state.buzzedBy) && !iBuzzed;

  if (state.phase === "done") {
    const ranked = [...room.players].sort((a, b) => b.score - a.score);
    const place = ranked.findIndex((p) => p.id === me.id) + 1;
    return (
      <Wrap>
        <p className="text-center font-display text-7xl text-accent">#{place}</p>
        <p className="text-center text-moon-dim">
          {me.score.toLocaleString()} points
        </p>
      </Wrap>
    );
  }

  // Whoever answered last chooses the next tile, from their own phone.
  if (state.phase === "picking" && state.board) {
    if (state.picker !== me.id) {
      return (
        <Wrap>
          <p className="text-center text-lg text-moon-dim">
            Waiting for the board pick…
          </p>
        </Wrap>
      );
    }
    return (
      <div className="flex min-h-dvh flex-col gap-3 p-4">
        <p className="pt-2 text-center font-display text-lg uppercase tracking-wide text-accent">
          Your pick
        </p>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {state.board.categories.map((cat, c) => (
            <div key={cat.title} className="flex flex-col gap-2">
              <p className="truncate text-center font-display text-[0.6rem] uppercase tracking-wide text-moon-deep">
                {cat.title}
              </p>
              {cat.clues.map((clue, r) => {
                const spent = state.spent.includes(`${c}-${r}`);
                return (
                  <button
                    key={r}
                    disabled={spent}
                    onClick={() => onPick(c, r)}
                    className={[
                      "flex-1 rounded-lg border py-3 font-display text-sm font-bold tabular-nums",
                      spent
                        ? "border-white/5 text-moon-deep/40"
                        : "tile-face border-white/10 text-accent",
                    ].join(" ")}
                  >
                    {spent ? "" : clue.value}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col p-4">
      <p className="py-3 text-center font-display text-sm uppercase tracking-[0.25em] text-moon-deep">
        {iBuzzed
          ? "You're in — answer out loud"
          : iAmOut
            ? "You're out this round"
            : someoneElse
              ? "Someone beat you to it"
              : state.phase === "open" && !armed
                ? "Wait for it…"
                : "Watch the TV"}
      </p>

      <motion.button
        onClick={onBuzz}
        disabled={!live}
        whileTap={{ scale: 0.94 }}
        animate={live ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className={[
          "flex flex-1 items-center justify-center rounded-3xl border-4 font-display text-5xl font-bold uppercase tracking-widest transition-colors",
          iBuzzed
            ? "border-emerald-300 bg-emerald-500/30 text-emerald-100"
            : iAmOut
              ? "border-white/10 bg-white/[0.02] text-moon-deep/40"
              : someoneElse
                ? "border-white/10 bg-white/[0.02] text-moon-deep/70"
                : live
                  ? "border-accent bg-accent/20 text-accent-bright"
                  : "border-white/10 bg-white/[0.03] text-moon-deep/70",
        ].join(" ")}
      >
        {iBuzzed ? "YOU!" : iAmOut ? "OUT" : live ? "BUZZ" : "WAIT"}
      </motion.button>

      <p className="py-3 text-center font-display text-sm uppercase tracking-widest text-accent">
        {me.emoji} {me.score.toLocaleString()}
      </p>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      {children}
    </div>
  );
}
