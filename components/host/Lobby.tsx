"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShowMark } from "@/components/ShowMark";
import { familyClass } from "@/lib/games/families";
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
    id: "big-board",
    name: "Big Board",
    href: "/big-board",
    blurb:
      "The classic board. Teams pick a tile, answer out loud, and you keep score.",
  },
  {
    id: "face-off",
    name: "Face-Off",
    href: "/face-off",
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
    id: "three-in-five",
    name: "Three in Five",
    href: "/three-in-five",
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
      <header className="flex h-[15vmin] min-h-[104px] shrink-0 items-stretch gap-[1.4vmin]">
        <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-[1.4vmin]">
          <ShowMark size="sm" />
          <div className="border-l border-white/10 pl-5">
            <p className="t-label font-display uppercase text-moon-deep">
              Room code
            </p>
            <p className="accent-text font-display text-[clamp(2rem,4.2vw,4.5rem)] font-bold leading-none tracking-[0.1em]">
              {room.code}
            </p>
          </div>
          <div className="max-w-[22ch] border-l border-white/10 pl-5">
            <p className="t-label font-display uppercase text-moon-deep">
              Phones join at
            </p>
            <p className="break-all text-[clamp(0.7rem,0.95vw,1rem)] leading-tight text-moon/75">
              {joinUrl || "…"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-[1vmin]">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <span className="t-label font-display uppercase text-moon-deep">
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
                      ? "border-white/10 bg-white/[0.03] text-moon-deep"
                      : "border-accent/30 bg-accent/[0.07] text-moon",
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
              <p className="self-center text-sm text-moon-deep">
                Waiting for the first phone — the four screen-only games below
                don&apos;t need one.
              </p>
            )}
          </div>
        </div>
      </header>

      {/* The games get the room */}
      {/* Sixteen games have to fit on one screen without scrolling. */}
      <section className="grid min-h-0 flex-1 grid-cols-2 grid-rows-8 gap-[0.9vmin] sm:grid-cols-3 sm:grid-rows-6 lg:grid-cols-4 lg:grid-rows-4 xl:grid-cols-6 xl:grid-rows-3">
        {TV_ONLY.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            /* Each card is lit by its own game's colour, so the grid reads as a lineup. */
            className={`group block min-h-0 ${familyClass(game.id)}`}
          >
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
              className={`group block min-h-0 text-left disabled:cursor-not-allowed ${familyClass(
                game.id,
              )}`}
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
        "relative flex h-full flex-col overflow-hidden rounded-2xl border p-[1.2vmin] transition-all duration-200",
        ready
          ? "border-accent/40 bg-gradient-to-b from-accent/[0.14] to-transparent group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-glow"
          : "border-white/10 bg-white/[0.02] opacity-45",
      ].join(" ")}
    >
      {/* A lit edge in the game's colour — the lineup reads as families from the couch. */}
      {ready && (
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <h3 className="font-display text-[clamp(0.8rem,1.15vw,1.4rem)] uppercase leading-tight tracking-wide text-moon">
          {name}
        </h3>
        <p className="mt-1 text-balance text-[clamp(0.62rem,0.75vw,0.9rem)] leading-snug text-moon-dim">
          {blurb}
        </p>
      </div>
      <span
        className={[
          "mt-2 block font-display text-[0.62rem] uppercase tracking-[0.18em]",
          ready ? "text-accent" : "text-moon-deep",
        ].join(" ")}
      >
        {status}
      </span>
    </div>
  );
}
