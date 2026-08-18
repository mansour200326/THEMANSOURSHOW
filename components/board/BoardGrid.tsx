"use client";

import { motion } from "framer-motion";
import { type Board, type TileRef, tileKey } from "@/lib/board/types";

type Props = {
  board: Board;
  /** tileKey[] already played */
  spent: string[];
  onPick?: (ref: TileRef) => void;
  disabled?: boolean;
  /** Reveal where the daily doubles were hiding (end of game). */
  showDailyDoubles?: string[];
};

/**
 * The board itself knows nothing about teams, scores or turns — Trivia Royale
 * (Phase 4) renders the same grid and just swaps what onPick does.
 */
export function BoardGrid({
  board,
  spent,
  onPick,
  disabled,
  showDailyDoubles = [],
}: Props) {
  const cols = board.categories.length;
  const rows = Math.max(...board.categories.map((c) => c.clues.length));

  return (
    <div className="flex h-full w-full flex-col gap-[0.5vmin]">
      {/* Category headers */}
      <div
        className="grid gap-[0.5vmin]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {board.categories.map((cat) => (
          <div
            key={cat.title}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-stage-tile/70 to-stage-tileDeep px-2 py-[1.6vmin] text-center"
          >
            <h3 className="t-category font-display font-semibold uppercase tracking-wider text-slate-100">
              {cat.title}
            </h3>
          </div>
        ))}
      </div>

      {/* Clue tiles */}
      <div
        className="grid min-h-0 flex-1 gap-[0.5vmin]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          board.categories.map((cat, c) => {
            const clue = cat.clues[r];
            const key = tileKey(c, r);
            const isSpent = !clue || spent.includes(key);
            const wasDaily = showDailyDoubles.includes(key);

            if (isSpent) {
              return (
                <div
                  key={key}
                  className="flex items-center justify-center rounded-lg border border-white/5 bg-ink-900/40"
                >
                  {wasDaily && (
                    <span className="font-display text-xs uppercase tracking-widest text-cream/50">
                      DD
                    </span>
                  )}
                </div>
              );
            }

            return (
              <motion.button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onPick?.({ c, r })}
                whileHover={disabled ? undefined : { scale: 1.02 }}
                whileTap={disabled ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="tile-face tile-face-hover group flex items-center justify-center rounded-lg
                           border border-white/10 shadow-tile transition-colors
                           disabled:cursor-default"
              >
                <span className="cream-text t-tile-value font-display font-bold tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                  {clue.value}
                </span>
              </motion.button>
            );
          }),
        )}
      </div>
    </div>
  );
}
