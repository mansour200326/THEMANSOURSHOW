"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

/**
 * Games that run entirely on this screen. They ignore the room — no phones, no
 * players — but they belong in the same menu, because "start a game" shouldn't
 * mean two different places depending on which game you want.
 */
const TV_ONLY = [
  {
    id: "team-jeopardy",
    name: "Team Jeopardy",
    href: "/jeopardy",
    blurb: "Classic board, two to four teams.",
  },
  {
    id: "the-feud",
    name: "The Feud",
    href: "/feud",
    blurb: "Survey board, two teams, three strikes.",
  },
  {
    id: "categories",
    name: "Categories",
    href: "/categories",
    blurb: "30 seconds to name as many as you can.",
  },
  {
    id: "five-seconds",
    name: "5 Second Rule",
    href: "/five-seconds",
    blurb: "Name three. Five seconds. Go.",
  },
];

export function Lobby({ room, onStart, onAddBots, onClearBots }: Props) {
  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => setJoinUrl(`${window.location.host}/play`), []);

  const live = room.players.filter((p) => p.connected);
  const bots = live.filter((p) => p.bot);

  return (
    <main className="flex h-dvh flex-col gap-[1.6vmin] overflow-hidden p-[2vmin]">
      <header className="flex shrink-0 items-center justify-between">
        <ShowMark size="sm" />
        <span className="font-display text-xs uppercase tracking-[0.2em] text-slate-600">
          Lobby
        </span>
      </header>

      <div className="flex min-h-0 flex-1 gap-[2vmin]">
        {/* Join instructions */}
        <section className="flex w-[34%] shrink-0 flex-col items-center justify-center gap-[1.5vmin] rounded-2xl border border-white/10 bg-white/[0.02] p-[2vmin] text-center">
          <p className="t-label font-display uppercase text-slate-500">
            On your phone, go to
          </p>
          <p className="break-all font-display text-[clamp(0.9rem,1.9vw,2rem)] uppercase tracking-wide text-slate-100">
            {joinUrl || "…"}
          </p>
          <p className="t-label mt-[1.5vmin] font-display uppercase text-slate-500">
            Room code
          </p>
          <p className="cream-text font-display text-[clamp(3.5rem,10vw,9rem)] font-bold leading-none tracking-[0.08em]">
            {room.code}
          </p>
          <p className="mt-[1vmin] max-w-xs text-balance text-sm text-slate-500">
            Only needed for the phone games — the two below run on this screen
            alone.
          </p>
        </section>

        {/* Who's here */}
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-[2vmin]">
          <div className="flex shrink-0 items-baseline justify-between gap-4">
            <h2 className="font-display text-[clamp(1rem,1.7vw,1.9rem)] uppercase tracking-widest text-slate-300">
              In the room
            </h2>
            <div className="flex items-center gap-2">
              {bots.length > 0 && (
                <button onClick={onClearBots} className="btn-ghost px-3 py-1.5 text-xs">
                  Clear bots
                </button>
              )}
              <button
                onClick={onAddBots}
                disabled={bots.length >= 3}
                className="btn-ghost px-3 py-1.5 text-xs"
                title="Fills the room so you can try a game on your own"
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
                  <span className="text-[clamp(1.4rem,2.3vw,2.3rem)]">{p.emoji}</span>
                  <span
                    className={[
                      "truncate font-display text-[clamp(0.85rem,1.2vw,1.4rem)] uppercase tracking-wide",
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

      {/* Every game, in one place */}
      <section className="shrink-0">
        <h2 className="mb-[1vmin] font-display text-xs uppercase tracking-[0.25em] text-slate-500">
          Start a game
        </h2>
        <div className="grid grid-cols-3 gap-[1vmin] lg:grid-cols-5 xl:grid-cols-10">
          {/* Runs on this screen — no room needed */}
          {TV_ONLY.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="rounded-xl border border-cream/35 bg-cream/[0.07] px-4 py-[1.5vmin] transition-all hover:-translate-y-0.5 hover:border-cream/70 hover:shadow-glow"
            >
              <span className="block font-display text-[clamp(0.8rem,1.2vw,1.4rem)] uppercase tracking-wide text-slate-100">
                {game.name}
              </span>
              <span className="mt-0.5 block font-display text-[0.6rem] uppercase tracking-widest text-cream/70">
                No phones needed
              </span>
            </Link>
          ))}

          {/* Needs phones in the room */}
          {gameList.map((game) => {
            const ready = live.length >= game.minPlayers;
            return (
              <button
                key={game.id}
                type="button"
                disabled={!ready}
                onClick={() => onStart(game.id)}
                className={[
                  "rounded-xl border px-4 py-[1.5vmin] text-left transition-all",
                  ready
                    ? "border-cream/35 bg-cream/[0.07] hover:-translate-y-0.5 hover:border-cream/70 hover:shadow-glow"
                    : "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50",
                ].join(" ")}
              >
                <span className="block font-display text-[clamp(0.8rem,1.2vw,1.4rem)] uppercase tracking-wide text-slate-100">
                  {game.name}
                </span>
                <span className="mt-0.5 block font-display text-[0.6rem] uppercase tracking-widest text-slate-500">
                  {ready ? "Ready" : `Needs ${game.minPlayers} phones`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
