"use client";

import { type Difficulty, DIFFICULTIES, difficultyBlurb, difficultyLabel } from "@/lib/difficulty";

type Props = {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
  compact?: boolean;
};

export function DifficultyBar({ value, onChange, compact }: Props) {
  return (
    <div>
      <div className="flex gap-2">
        {DIFFICULTIES.map((level) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              aria-pressed={active}
              className={[
                "flex-1 rounded-xl border py-2.5 font-display uppercase tracking-wider transition-colors",
                compact ? "text-sm" : "text-base",
                active
                  ? "border-cream/60 bg-cream/15 text-cream-bright"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cream/40 hover:text-cream-bright",
              ].join(" ")}
            >
              {difficultyLabel[level]}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 text-sm text-slate-500">{difficultyBlurb[value]}</p>
      )}
    </div>
  );
}
