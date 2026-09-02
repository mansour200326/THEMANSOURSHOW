"use client";

import { useState } from "react";

/**
 * The room code, kept on screen for the whole night.
 *
 * It only ever appeared in the lobby, so the moment a game started the code
 * stopped existing anywhere in the room. A phone that dies, a latecomer, a
 * browser that gets closed by accident — all of them needed the code, and the
 * only way to see it again was to end the game everyone was playing.
 *
 * It sits quiet in a corner and enlarges on a tap, because for ninety-nine
 * percent of the night it's furniture and for the other one percent it's the
 * only thing anybody wants to see.
 */
export function RoomCodeChip({ code }: { code: string }) {
  const [big, setBig] = useState(false);

  if (big) {
    return (
      <button
        onClick={() => setBig(false)}
        className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-[2vmin] bg-midnight/95 backdrop-blur"
      >
        <span className="font-display text-[3vmin] uppercase tracking-[0.3em] text-moon-deep">
          Join at bignight.games
        </span>
        <span className="brand-text font-display text-[22vmin] font-bold uppercase leading-none tracking-tight">
          {code}
        </span>
        <span className="font-display text-[2vmin] uppercase tracking-[0.25em] text-moon-deep">
          Tap anywhere to go back
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setBig(true)}
      title="Show the room code"
      // Clear of the sound control, which is pinned to the bottom-left corner
      // at a higher layer and was sitting directly on top of this.
      className="fixed bottom-3 left-16 z-40 rounded-full border border-white/12 bg-midnight/70 px-4 py-1.5 font-display text-sm uppercase tracking-[0.25em] text-moon-deep backdrop-blur transition-colors hover:border-accent/50 hover:text-moon"
    >
      {code}
    </button>
  );
}
