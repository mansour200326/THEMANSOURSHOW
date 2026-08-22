"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/difficulty";

export const MIN_THEMES = 1;
export const MAX_THEMES = 6;

const SUGGESTIONS = [
  "Game of Thrones",
  "Football",
  "2000s Movies",
  "Roast the group",
  "Anime",
  "Cars",
  "Rap Lyrics",
  "Geography",
  "Food",
  "Video Games",
  "History",
  "Science",
];

type Props = {
  title: string;
  hint: string;
  themes: string[];
  onChange: (themes: string[]) => void;
  difficulty?: Difficulty;
  /** Extra steer for the suggestion generator, if the game collects one. */
  vibe?: string;
  min?: number;
  max?: number;
  /** Word for one entry, used on the add button and the labels. */
  noun?: string;
};

/**
 * A list of topics rather than a single box, so one round can be football and
 * the next can be roasting the group. Shared by every game that generates its
 * own content — they all send the list straight to the writer.
 */
export function ThemeList({
  title,
  hint,
  themes,
  onChange,
  difficulty = "medium",
  vibe = "",
  min = MIN_THEMES,
  max = MAX_THEMES,
  noun = "theme",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filled = themes.map((t) => t.trim()).filter(Boolean);

  const set = (i: number, value: string) =>
    onChange(themes.map((t, j) => (j === i ? value : t)));

  const suggest = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: themes.length, hint: vibe, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't think of any.");
      if (Array.isArray(data.categories)) {
        onChange(themes.map((v, i) => data.categories[i] ?? v));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't think of any.");
    } finally {
      setBusy(false);
    }
  };

  /** Tapping a chip fills the first empty slot, or adds one. */
  const useSuggestion = (topic: string) => {
    const empty = themes.findIndex((t) => !t.trim());
    if (empty >= 0) return set(empty, topic);
    if (themes.length < max) onChange([...themes, topic]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={suggest}
            disabled={busy}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {busy ? "Thinking…" : "✦ Suggest for me"}
          </button>
          <span className="font-display text-xs tabular-nums text-moon-deep">
            {filled.length}/{themes.length}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-moon-deep">{hint}</p>

      <div className="mt-4 space-y-3">
        {themes.map((value, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-moon-deep/70">
              {i + 1}
            </span>
            <input
              value={value}
              onChange={(e) => set(i, e.target.value)}
              placeholder={`${SUGGESTIONS[i % SUGGESTIONS.length]}…`}
              maxLength={60}
              className="field"
            />
            <button
              type="button"
              onClick={() => onChange(themes.filter((_, j) => j !== i))}
              disabled={themes.length <= min}
              className="btn-ghost h-10 w-10 shrink-0 px-0 py-0 text-lg"
              aria-label={`Remove ${noun} ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {themes.length < max && (
        <button
          type="button"
          onClick={() => onChange([...themes, ""])}
          className="btn-ghost mt-3 w-full py-2.5 text-sm"
        >
          + Add {noun}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-rose-300">{error}</p>
      )}

      <div className="mt-5">
        <p className="t-label font-display uppercase text-moon-deep/70">
          Or tap one
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((topic) => {
            const used = filled.some(
              (t) => t.toLowerCase() === topic.toLowerCase(),
            );
            return (
              <button
                key={topic}
                type="button"
                onClick={() => useSuggestion(topic)}
                disabled={used}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  used
                    ? "cursor-default border-accent/40 bg-accent/10 text-accent-bright"
                    : "border-white/10 bg-white/[0.03] text-moon/75 hover:border-accent/50 hover:text-accent-bright",
                ].join(" ")}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** What actually gets sent to the writer. */
export const usableThemes = (themes: string[]) =>
  themes.map((t) => t.trim()).filter(Boolean);
