"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShowMark } from "@/components/ShowMark";
import { gameList } from "@/lib/games/registry";
import type { Room } from "@/lib/room/types";

type Props = {
  room: Room;
  onStart: (gameId: string) => void;
  onAddBots: () => void;
  onClearBots: () => void;
};

export function Lobby({ room, onStart, onAddBots, onClearBots }: Props) {
  const [joinUrl, setJoinUrl] = useState("");

  // Whatever address the TV used is the address the phones can reach.
  useEffect(() => setJoinUrl(`${window.location.host}/play`), []);

  const live = room.players.filter((p) => p.connected);
  const bots = live.filter((p) => p.bot);

  return (
    <main className="flex h-dvh flex-col gap-[2vmin] overflow-hidden p-[2vmin]">
      <header className="flex shrink-0 items-center justify-between">
        <ShowMark size="sm" />
        <span className="font-display text-xs uppercase tracking-[0.2em] text-slate-600">
          Lobby
        </span>
      </header>

      <div className="flex min-h-0 flex-1 gap-[2vmin]">
        {/* Join instructions */}
        <section className="flex w-[38%] shrink-0 flex-col items-center justify-center gap-[2vmin] rounded-2xl border border-white/10 bg-white/[0.02] p-[2vmin] text-center">
          <p className="t-label font-display uppercase text-slate-500">
            On your phone, go to
          </p>
          <p className="break-all font-display text-[clamp(1rem,2.2vw,2.4rem)] uppercase tracking-wide text-slate-100">
            {joinUrl || "…"}
          </p>

          <p className="t-label mt-[2vmin] font-display uppercase text-slate-500">
            Room code
          </p>
          <p className="cream-text font-display text-[clamp(4rem,12vw,11rem)] font-bold leading-none tracking-[0.08em]">
            {room.code}
          </p>
        </section>

        {/* Who's here */}
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-[2vmin]">
          <div className="flex shrink-0 items-baseline justify-between gap-4">
            <h2 className="font-display text-[clamp(1rem,1.8vw,2rem)] uppercase tracking-widest text-slate-300">
              In the room
            </h2>
            <div className="flex items-center gap-2">
              {bots.length > 0 && (
                <button
                  onClick={onClearBots}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  Clear bots
                </button>
              )}
              <button
                onClick={onAddBots}
                disabled={bots.length >= 3}
                className="btn-ghost px-3 py-1.5 text-xs"
                title="Fills the room so you can try a segment on your own"
              >
                + Practice bots
              </button>
              <span className="font-display text-sm tabular-nums text-slate-500">
                {live.length}
              </span>
            </div>
          </div>

          <div className="mt-[1.5vmin] grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-[1vmin] overflow-auto sm:grid-cols-3">
            <AnimatePresence>
              {live.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.85, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    p.bot
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-cream/25 bg-cream/[0.06]",
                  ].join(" ")}
                >
                  <span className="text-[clamp(1.5rem,2.5vw,2.5rem)]">
                    {p.emoji}
                  </span>
                  <span
                    className={[
                      "truncate font-display text-[clamp(0.9rem,1.3vw,1.5rem)] uppercase tracking-wide",
                      p.bot ? "text-slate-500" : "text-slate-100",
                    ].join(" ")}
                  >
                    {p.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {live.length === 0 && (
              <p className="col-span-full self-center text-center text-slate-500">
                Waiting for the first phone…
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Pick a segment */}
      <section className="shrink-0">
        <h2 className="mb-[1vmin] font-display text-xs uppercase tracking-[0.25em] text-slate-500">
          Start a segment
        </h2>
        <div className="grid grid-cols-2 gap-[1vmin] sm:grid-cols-4">
          {gameList.map((game) => {
            const ready = live.length >= game.minPlayers;
            return (
              <button
                key={game.id}
                type="button"
                disabled={!ready}
                onClick={() => onStart(game.id)}
                className={[
                  "rounded-xl border px-4 py-[1.6vmin] text-left transition-all",
                  ready
                    ? "border-cream/35 bg-cream/[0.07] hover:-translate-y-0.5 hover:border-cream/70"
                    : "cursor-not-allowed border-white/8 bg-white/[0.02] opacity-50",
                ].join(" ")}
              >
                <span className="block font-display text-[clamp(0.85rem,1.3vw,1.5rem)] uppercase tracking-wide text-slate-100">
                  {game.name}
                </span>
                <span className="mt-0.5 block font-display text-[0.65rem] uppercase tracking-widest text-slate-500">
                  {ready ? "Ready" : `Needs ${game.minPlayers}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
