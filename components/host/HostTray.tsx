"use client";

import { useState } from "react";
import { ScoreAdjuster, type Adjustable } from "@/components/ScoreAdjuster";

/**
 * The host's controls, out of the way until they're wanted.
 *
 * Mid-game the television carried End segment, Fix scores, the room code,
 * sound, lights, and whatever the game itself needed. Most of those are
 * used once a night. They live behind one small button now, and the screen
 * shows the game and the one thing the host does next.
 */
export function HostTray({
  onEnd,
  scores,
  onAdjust,
  sheet,
}: {
  /** Ends the segment. Absent in the lobby, where there's nothing to end. */
  onEnd?: () => void;
  /** The host-sheet address and key, for the one host who wants the card. */
  sheet?: { url: string; key: string };
  /** Present only for games that put no scores on screen of their own. */
  scores?: Adjustable[];
  onAdjust?: (id: string, delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fixing, setFixing] = useState(false);

  return (
    <>
      <div className="fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 rounded-2xl border border-line/12 bg-midnight/90 p-2 shadow-tile backdrop-blur">
            {sheet && (
              <div className="px-2 py-1 text-right text-xs leading-snug text-moon-deep">
                <p className="font-display uppercase tracking-widest">Host&apos;s phone</p>
                <p className="text-moon/70">{sheet.url}</p>
                <p>
                  key{" "}
                  <span className="font-display tracking-[0.2em] text-moon/80">{sheet.key}</span>
                </p>
              </div>
            )}
            {scores && onAdjust && (
              <button
                onClick={() => {
                  setFixing(true);
                  setOpen(false);
                }}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Fix scores
              </button>
            )}
            {onEnd && (
            <button
              onClick={() => {
                setOpen(false);
                onEnd();
              }}
              className="btn-bad px-4 py-2 text-sm"
            >
              End segment
            </button>
            )}
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close host controls" : "Host controls"}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line/12 bg-midnight/70 font-display text-xl text-moon-dim backdrop-blur transition-colors hover:border-accent/50 hover:text-moon"
        >
          {open ? "×" : "⋯"}
        </button>
      </div>
      {fixing && scores && onAdjust && (
        <ScoreAdjuster entries={scores} onAdjust={onAdjust} onClose={() => setFixing(false)} />
      )}
    </>
  );
}
