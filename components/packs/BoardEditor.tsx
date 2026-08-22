"use client";

import { useState } from "react";
import { BOARD_VALUES, type BoardCategory } from "@/lib/packs/types";

/**
 * Writing a board by hand.
 *
 * A full board is six categories of five clues — thirty questions and thirty
 * answers — which is a lot of boxes to put on one screen at once. So it edits
 * one column at a time: pick a category along the top, fill in its five clues,
 * move on. The tabs carry their own progress so you can see at a glance which
 * columns are still short.
 */
export function BoardEditor({
  categories,
  onChange,
  min,
  max = 6,
}: {
  categories: BoardCategory[];
  onChange: (next: BoardCategory[]) => void;
  min: number;
  max?: number;
}) {
  const [open, setOpen] = useState(0);
  const current = categories[Math.min(open, categories.length - 1)];

  const setCategory = (i: number, next: BoardCategory) =>
    onChange(categories.map((c, j) => (j === i ? next : c)));

  const add = () => {
    if (categories.length >= max) return;
    onChange([
      ...categories,
      { title: "", clues: BOARD_VALUES.map(() => ({ clue: "", answer: "" })) },
    ]);
    setOpen(categories.length);
  };

  const remove = (i: number) => {
    if (categories.length <= min) return;
    onChange(categories.filter((_, j) => j !== i));
    setOpen((o) => Math.max(0, Math.min(o, categories.length - 2)));
  };

  /** How many of this column's five clues are finished. */
  const done = (c: BoardCategory) =>
    c.clues.filter((q) => q.clue.trim() && q.answer.trim()).length;

  return (
    <div>
      {/* The columns, as tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c, i) => {
          const complete = done(c) === BOARD_VALUES.length && c.title.trim();
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors",
                i === open
                  ? "border-accent bg-accent/15 text-accent-bright"
                  : "border-white/12 text-moon/75 hover:border-accent/50",
              ].join(" ")}
            >
              <span className="max-w-[14ch] truncate">
                {c.title.trim() || `Category ${i + 1}`}
              </span>
              <span
                className={[
                  "rounded-full px-1.5 text-[0.65rem] tabular-nums",
                  complete
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-white/10 text-moon-deep",
                ].join(" ")}
              >
                {done(c)}/{BOARD_VALUES.length}
              </span>
            </button>
          );
        })}
        {categories.length < max && (
          <button
            type="button"
            onClick={add}
            className="rounded-full border border-dashed border-white/20 px-4 py-2 font-display text-sm uppercase tracking-wide text-moon-deep hover:border-accent/50 hover:text-accent"
          >
            + Category
          </button>
        )}
      </div>

      {/* The open column */}
      {current && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <input
              value={current.title}
              onChange={(e) => setCategory(open, { ...current, title: e.target.value })}
              placeholder="Category name — Football, 2000s Movies, Roast the group"
              maxLength={40}
              className="field font-display uppercase tracking-wide"
            />
            <button
              type="button"
              onClick={() => remove(open)}
              disabled={categories.length <= min}
              aria-label="Remove this category"
              className="btn-ghost h-11 w-11 shrink-0 px-0 py-0 text-lg"
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {BOARD_VALUES.map((value, i) => {
              const clue = current.clues[i] ?? { clue: "", answer: "" };
              const setClue = (patch: Partial<typeof clue>) => {
                const clues = [...current.clues];
                while (clues.length < BOARD_VALUES.length) {
                  clues.push({ clue: "", answer: "" });
                }
                clues[i] = { ...clue, ...patch };
                setCategory(open, { ...current, clues });
              };
              return (
                <div
                  key={value}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-midnight/40 p-3 sm:flex-row sm:items-center"
                >
                  <span className="accent-text w-14 shrink-0 font-display text-xl font-bold tabular-nums">
                    {value}
                  </span>
                  <input
                    value={clue.clue}
                    onChange={(e) => setClue({ clue: e.target.value })}
                    placeholder="The clue, as the room hears it"
                    maxLength={200}
                    className="field flex-[3] py-2 text-base"
                  />
                  <input
                    value={clue.answer}
                    onChange={(e) => setClue({ answer: e.target.value })}
                    placeholder="The answer"
                    maxLength={120}
                    className="field flex-1 py-2 text-base"
                  />
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-sm text-moon-deep">
            Easiest at 100, hardest at 500. Anything left blank is dropped, and a
            category with no finished clues won&apos;t make the board.
          </p>
        </div>
      )}
    </div>
  );
}
