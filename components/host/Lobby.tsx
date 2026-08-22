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
  },
  {
    id: "face-off",
    name: "Face-Off",
    href: "/face-off",
  },
  {
    id: "categories",
    name: "Categories",
    href: "/categories",
  },
  {
    id: "three-in-five",
    name: "Three in Five",
    href: "/three-in-five",
  },
];

export function Lobby({ room, onStart, onAddBots, onClearBots }: Props) {
  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => setJoinUrl(`${window.location.host}/play`), []);

  const live = room.players.filter((p) => p.connected);
  const bots = live.filter((p) => p.bot);

  return (
    /*
     * Two shapes, one screen. On a TV everything has to fit at once, because
     * nobody scrolls a television from the sofa. On a phone that same layout
     * crushes sixteen cards into a fixed height, so below lg it becomes an
     * ordinary scrolling page with cards big enough to read.
     */
    <main className="flex min-h-dvh flex-col gap-3 p-3 lg:h-dvh lg:gap-[1.4vmin] lg:overflow-hidden lg:p-[1.8vmin]">
      {/* One compact band: brand, join details, who's here. */}
      <header className="flex shrink-0 flex-col items-stretch gap-3 lg:h-[15vmin] lg:min-h-[104px] lg:flex-row lg:gap-[1.4vmin]">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 lg:gap-5 lg:px-6 lg:py-[1.4vmin]">
          <ShowMark size="sm" />
          <div className="border-l border-white/10 pl-5">
            <p className="t-label font-display uppercase text-moon-deep">
              Room code
            </p>
            <p className="accent-text font-display text-[clamp(1.75rem,4.2vw,4.5rem)] font-bold leading-none tracking-[0.1em]">
              {room.code}
            </p>
            <p className="mt-1 break-all text-[0.65rem] leading-tight text-moon-deep sm:hidden">
              {joinUrl || "…"}
            </p>
          </div>
          <div className="hidden max-w-[22ch] border-l border-white/10 pl-5 sm:block">
            <p className="t-label font-display uppercase text-moon-deep">
              Phones join at
            </p>
            <p className="break-all text-[clamp(0.65rem,0.95vw,1rem)] leading-tight text-moon/75">
              {joinUrl || "…"}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5 lg:px-5 lg:py-[1vmin]">
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

      {/*
        * Two across on a phone with a height that fits the text, so you scroll
        * through them. From lg the rows are fixed and the whole lineup fits.
        */}
      <section className="grid grid-cols-2 gap-2.5 auto-rows-[minmax(6.5rem,auto)] sm:grid-cols-3 lg:min-h-0 lg:flex-1 lg:auto-rows-auto lg:grid-cols-4 lg:grid-rows-4 lg:gap-[0.9vmin] xl:grid-cols-6 xl:grid-rows-3">
        {TV_ONLY.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            /* Each card is lit by its own game's colour, so the grid reads as a lineup. */
            className={`group block min-h-0 ${familyClass(game.id)}`}
          >
            <Card name={game.name} status="No phones needed" ready />
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
  status,
  ready,
}: {
  name: string;
  status: string;
  ready: boolean;
}) {
  return (
    <div
      className={[
        "relative flex h-full flex-col overflow-hidden rounded-2xl border p-3 text-center transition-all duration-200 lg:p-[1.2vmin]",
        ready
          ? "border-accent/40 bg-gradient-to-b from-accent/[0.14] to-transparent group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-glow"
          : "border-white/10 bg-white/[0.02] opacity-45",
      ].join(" ")}
    >
      {/* A lit edge in the game's colour — the lineup reads as families from the couch. */}
      {ready && (
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}

      {/*
       * Just the name, sitting in the middle in the same colour as the border
       * around it. The blurb that used to live under here said the same thing
       * as the rules screen you get on the way in, only shorter and worse.
       */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-1">
        <h3
          className={[
            "text-balance font-display text-base uppercase leading-tight tracking-wide lg:text-[clamp(0.9rem,1.45vw,1.8rem)]",
            ready ? "text-accent" : "text-moon-dim",
          ].join(" ")}
        >
          {name}
        </h3>
      </div>

      <span
        className={[
          "mt-2 block font-display text-[0.62rem] uppercase tracking-[0.18em]",
          ready ? "text-accent/60" : "text-moon-deep",
        ].join(" ")}
      >
        {status}
      </span>
    </div>
  );
}
