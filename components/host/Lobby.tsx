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

/** Games that run on this screen alone — no room, no phones. */
const TV_ONLY = [
  {
    id: "team-jeopardy",
    name: "Team Jeopardy",
    href: "/jeopardy",
    blurb:
      "The classic board. Teams pick a tile, answer out loud, and you keep score.",
  },
  {
    id: "the-feud",
    name: "The Feud",
    href: "/feud",
    blurb:
      "We surveyed 100 people. Guess the top answers before three strikes.",
  },
  {
    id: "categories",
    name: "Categories",
    href: "/categories",
    blurb:
      "Thirty seconds to name as many as you can. Two teams, one clock.",
  },
  {
    id: "five-seconds",
    name: "5 Second Rule",
    href: "/five-seconds",
    blurb: "Name three things in five seconds. Much harder than it sounds.",
  },
];

export function Lobby({ room, onStart, onAddBots, onClearBots }: Props) {
  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => setJoinUrl(`${window.location.host}/play`), []);

  const live = room.players.filter((p) => p.connected);
  const bots = live.filter((p) => p.bot);

  return (
    <main className="flex h-dvh flex-col gap-[1.4vmin] overflow-hidden p-[1.8vmin]">
      {/* One compact band: brand, join details, who's here. */}
      <header className="flex h-[19vmin] min-h-[128px] shrink-0 items-stretch gap-[1.4vmin]">
        <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-[1.4vmin]">
          <ShowMark size="sm" />
          <div className="border-l border-white/10 pl-5">
            <p className="t-label font-display uppercase text-slate-500">
              Room code
            </p>
            <p className="cream-text font-display text-[clamp(2rem,4.2vw,4.5rem)] font-bold leading-none tracking-[0.1em]">
              {room.code}
            </p>
          </div>
          <div className="max-w-[22ch] border-l border-white/10 pl-5">
            <p className="t-label font-display uppercase text-slate-500">
              Phones join at
            </p>
            <p className="break-all text-[clamp(0.7rem,0.95vw,1rem)] leading-tight text-slate-300">
              {joinUrl || "…"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-[1vmin]">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <span className="t-label font-display uppercase text-slate-500">
              In the room · {live.length}
            </span>
            <div className="flex items-center gap-2">
              {bots.length > 0 && (
                <button onClick={onClearBots} className="btn-ghost px-3 py-1 text-xs">
                  Clear bots
                </button>
              )}
              <button
                onClick={onAddBots}
                disabled={bots.length >= 3}
                className="btn-ghost px-3 py-1 text-xs"
                title="Fills the room so you can try a game on your own"
              >
                + Practice bots
              </button>
            </div>
          </div>

          <div className="mt-1 flex min-h-0 flex-1 flex-wrap content-start items-start gap-2 overflow-auto">
            <AnimatePresence>
              {live.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1",
                    p.bot
                      ? "border-white/10 bg-white/[0.03] text-slate-500"
                      : "border-cream/30 bg-cream/[0.07] text-slate-100",
                  ].join(" ")}
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="font-display text-sm uppercase tracking-wide">
                    {p.name}
                  </span>
                </motion.span>
              ))}
            </AnimatePresence>
            {live.length === 0 && (
              <p className="self-center text-sm text-slate-500">
                Waiting for the first phone — the four screen-only games below
                don&apos;t need one.
              </p>
            )}
          </div>
        </div>
      </header>

      {/* The games get the room */}
      <section className="grid min-h-0 flex-1 grid-cols-2 grid-rows-5 gap-[1.1vmin] sm:grid-cols-3 sm:grid-rows-4 xl:grid-cols-5 xl:grid-rows-2">
        {TV_ONLY.map((game) => (
          <Link key={game.id} href={game.href} className="group block min-h-0">
            <Card name={game.name} blurb={game.blurb} status="No phones needed" ready />
          </Link>
        ))}

        {gameList.map((game) => {
          const ready = live.length >= game.minPlayers;
          return (
            <button
              key={game.id}
              type="button"
              disabled={!ready}
              onClick={() => onStart(game.id)}
              className="group block min-h-0 text-left disabled:cursor-not-allowed"
            >
              <Card
                name={game.name}
                blurb={game.blurb}
                ready={ready}
                status={
                  ready
                    ? "Ready"
                    : `Needs ${game.minPlayers} ${
                        game.minPlayers === 1 ? "phone" : "phones"
                      }`
                }
              />
            </button>
          );
        })}
      </section>
    </main>
  );
}

function Card({
  name,
  blurb,
  status,
  ready,
}: {
  name: string;
  blurb: string;
  status: string;
  ready: boolean;
}) {
  return (
    <div
      className={[
        "flex h-full flex-col rounded-2xl border p-[1.6vmin] transition-all duration-200",
        ready
          ? "border-cream/25 bg-gradient-to-b from-cream/[0.08] to-transparent group-hover:-translate-y-1 group-hover:border-cream/70 group-hover:shadow-glow"
          : "border-white/8 bg-white/[0.02] opacity-45",
      ].join(" ")}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <h3 className="font-display text-[clamp(0.95rem,1.5vw,1.75rem)] uppercase leading-tight tracking-wide text-slate-50">
          {name}
        </h3>
        <p className="mt-1.5 text-balance text-[clamp(0.7rem,0.92vw,1rem)] leading-snug text-slate-400">
          {blurb}
        </p>
      </div>
      <span
        className={[
          "mt-2 block font-display text-[0.62rem] uppercase tracking-[0.18em]",
          ready ? "text-cream/70" : "text-slate-500",
        ].join(" ")}
      >
        {status}
      </span>
    </div>
  );
}
