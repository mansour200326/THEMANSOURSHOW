"use client";

import { type Difficulty, DIFFICULTIES, difficultyBlurb, difficultyLabel } from "@/lib/difficulty";
import { useT } from "@/components/LangProvider";

type Props = {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
  compact?: boolean;
};

export function DifficultyBar({ value, onChange, compact }: Props) {
  const t = useT();
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
                  ? "border-accent/60 bg-accent/15 text-accent-bright"
                  : "border-line/10 bg-line/[0.03] text-moon-dim hover:border-accent/40 hover:text-accent-bright",
              ].join(" ")}
            >
              {t(difficultyLabel[level])}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 text-sm text-moon-deep">{t(difficultyBlurb[value])}</p>
      )}
    </div>
  );
}
