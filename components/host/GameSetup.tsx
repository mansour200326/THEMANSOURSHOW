"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DifficultyBar } from "@/components/DifficultyBar";
import type { Difficulty } from "@/lib/difficulty";

type Props = {
  gameName: string;
  /**
   * Trivia Royale needs a full board and can't start without one; every other
   * game has a bundled pack and treats generating as optional.
   */
  needsBoard?: boolean;
  onCancel: () => void;
  /** Write the content by hand instead of generating it. */
  onWriteOwn?: () => void;
  /**
   * Games where the length is the whole shape of the round get to choose it.
   * Eight minutes of one conversation is a long time if the room is four
   * people, and far too short if it's ten.
   */
  lengths?: number[];
  onStart: (config: {
    categories: string[];
    difficulty: Difficulty;
    minutes?: number;
  }) => void;
  /** Set while the board is being written. */
  busy?: boolean;
  error?: string | null;
};

const SLOTS = 4;

/**
 * The step between picking a phone game and playing it: what it's about, and
 * how hard. Same contract as the Big Board setup, condensed for the TV.
 */
export function GameSetup({
  gameName,
  needsBoard = false,
  lengths,
  onCancel,
  onWriteOwn,
  onStart,
  busy,
  error,
}: Props) {
  const [categories, setCategories] = useState<string[]>(Array(SLOTS).fill(""));
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [suggesting, setSuggesting] = useState(false);
  const [minutes, setMinutes] = useState(lengths?.[Math.floor(lengths.length / 2)]);

  const filled = categories.map((c) => c.trim()).filter(Boolean);

  const suggest = async () => {
    setSuggesting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: SLOTS, difficulty }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        setCategories((c) => c.map((v, i) => data.categories[i] ?? v));
      }
    } catch {
      /* host can still type their own */
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <p className="t-label font-display uppercase text-moon-deep">Setting up</p>
        <h1 className="accent-text font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
          {gameName}
        </h1>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg uppercase tracking-widest text-moon/75">
            {needsBoard ? "Categories" : "Themes"}
          </h2>
          <button
            onClick={suggest}
            disabled={suggesting || busy}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {suggesting ? "Thinking…" : "✦ Generate for me"}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {categories.map((value, i) => (
            <input
              key={i}
              value={value}
              onChange={(e) =>
                setCategories((c) => c.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={needsBoard ? `Category ${i + 1}` : `Theme ${i + 1}`}
              maxLength={40}
              className="field"
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg uppercase tracking-widest text-moon/75">
          Difficulty
        </h2>
        <DifficultyBar value={difficulty} onChange={setDifficulty} />
      </div>

      {lengths && (
        <div>
          <h2 className="mb-3 font-display text-lg uppercase tracking-widest text-moon/75">
            How long
          </h2>
          <div className="flex gap-2">
            {lengths.map((n) => (
              <button
                key={n}
                onClick={() => setMinutes(n)}
                className={[
                  "flex-1 rounded-xl border py-3 font-display uppercase tracking-wide tabular-nums transition-colors",
                  minutes === n
                    ? "border-accent bg-accent/15 text-accent-bright"
                    : "border-white/12 text-moon/75 hover:border-white/25",
                ].join(" ")}
              >
                {n} min
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-center text-rose-200"
        >
          {error}
        </motion.p>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => onStart({ categories: filled, difficulty, minutes })}
          disabled={(needsBoard && filled.length < 3) || (!needsBoard && !filled.length) || busy}
          className="btn-brand w-full py-5 text-xl"
        >
          {busy
            ? "Writing it…"
            : needsBoard
              ? "Build the board"
              : "Write it around these"}
        </button>
        {needsBoard && filled.length < 3 && (
          <p className="text-sm text-moon-deep">Add at least 3 categories.</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => onStart({ categories: [], difficulty, minutes })}
            disabled={busy}
            className="btn-ghost text-sm"
          >
            {needsBoard ? "Skip — use the sample board" : "Skip — use the built-in pack"}
          </button>
          {onWriteOwn && (
            <button
              onClick={onWriteOwn}
              disabled={busy}
              className="btn-ghost text-sm"
            >
              ✎ Write my own
            </button>
          )}
          <button onClick={onCancel} disabled={busy} className="btn-ghost text-sm">
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
