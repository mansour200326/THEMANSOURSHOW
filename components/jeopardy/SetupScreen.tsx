"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DifficultyBar } from "@/components/DifficultyBar";
import { ShowMark } from "@/components/ShowMark";
import type { Difficulty } from "@/lib/difficulty";
import { type Rules, defaultRules } from "@/lib/jeopardy/types";

const MIN_TEAMS = 2;
const MAX_TEAMS = 4;
const MIN_CATEGORIES = 3;
const MAX_CATEGORIES = 6;

const DEFAULT_NAMES = ["Team 1", "Team 2", "Team 3", "Team 4"];

/** Clue countdown lengths the host can pick from. */
const TIMER_CHOICES = [10, 15, 20, 30, 45, 60];

/** One tap fills the next empty category slot. */
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

export type SetupConfig = {
  teamNames: string[];
  categories: string[];
  vibe: string;
  rules: Rules;
  difficulty: Difficulty;
  source: "ai" | "sample";
};

type Props = {
  onStart: (config: SetupConfig) => void;
  canResume?: boolean;
  onResume?: () => void;
  generating?: boolean;
  error?: string | null;
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
        checked
          ? "border-cream/45 bg-cream/[0.07]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-cream" : "bg-white/15",
        ].join(" ")}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={[
            "h-5 w-5 rounded-full bg-white shadow",
            checked ? "ml-auto" : "",
          ].join(" ")}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base uppercase tracking-wider text-slate-100">
          {label}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  );
}

export function SetupScreen({
  onStart,
  canResume,
  onResume,
  generating,
  error,
}: Props) {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES.slice(0, 2));
  const [categories, setCategories] = useState<string[]>(["", "", ""]);
  const [vibe, setVibe] = useState("");
  const [rules, setRules] = useState<Rules>(defaultRules);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [suggesting, setSuggesting] = useState(false);

  /** Fill every slot with AI-invented topics, for hosts who'd rather not think. */
  const suggestCategories = async () => {
    setSuggesting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: categories.length, hint: vibe, difficulty }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        setCategories((c) => c.map((v, i) => data.categories[i] ?? v));
      }
    } catch {
      /* leave what's typed — the host can still write their own */
    } finally {
      setSuggesting(false);
    }
  };

  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) =>
    setRules((r) => ({ ...r, [key]: value }));

  const setName = (i: number, value: string) =>
    setNames((n) => n.map((v, idx) => (idx === i ? value : v)));

  const setCategory = (i: number, value: string) =>
    setCategories((c) => c.map((v, idx) => (idx === i ? value : v)));

  const addCategory = () =>
    setCategories((c) => (c.length < MAX_CATEGORIES ? [...c, ""] : c));

  const removeCategory = (i: number) =>
    setCategories((c) =>
      c.length > MIN_CATEGORIES ? c.filter((_, idx) => idx !== i) : c,
    );

  /** Drop a suggestion into the first empty slot, or add a new one. */
  const useSuggestion = (topic: string) => {
    setCategories((c) => {
      if (c.some((v) => v.trim().toLowerCase() === topic.toLowerCase())) return c;
      const empty = c.findIndex((v) => !v.trim());
      if (empty !== -1) return c.map((v, i) => (i === empty ? topic : v));
      if (c.length < MAX_CATEGORIES) return [...c, topic];
      return c;
    });
  };

  const filled = categories.map((c) => c.trim()).filter(Boolean);
  const canGenerate = filled.length >= MIN_CATEGORIES;

  const start = (source: "ai" | "sample") =>
    onStart({ teamNames: names, categories: filled, vibe, rules, difficulty, source });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/games" className="opacity-80 transition hover:opacity-100">
          <ShowMark size="sm" />
        </Link>
        <Link
          href="/games"
          className="font-display text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300"
        >
          ← Lineup
        </Link>
      </header>

      <div className="mt-10">
        <p className="t-label font-display uppercase text-slate-500">
          Huddle presents
        </p>
        <h1 className="cream-text mt-1 font-display text-5xl font-bold uppercase tracking-tight sm:text-7xl">
          Team Jeopardy
        </h1>
      </div>

      {canResume && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cream/40 bg-cream/[0.08] px-5 py-4"
        >
          <p className="text-slate-200">
            There&apos;s a game in progress on this screen.
          </p>
          <button onClick={onResume} className="btn-cream">
            Resume game
          </button>
        </motion.div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Categories + teams */}
        <section className="space-y-8">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
                Categories
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={suggestCategories}
                  disabled={suggesting}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  {suggesting ? "Thinking…" : "✦ Suggest for me"}
                </button>
                <span className="font-display text-xs uppercase tracking-widest text-slate-600">
                  {filled.length}/{MAX_CATEGORIES}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              You pick the topics — anything from Game of Thrones to roasting your
              friends. We write five clues for each.
            </p>

            <div className="mt-4 space-y-3">
              {categories.map((value, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-slate-600">
                    {i + 1}
                  </span>
                  <input
                    value={value}
                    onChange={(e) => setCategory(i, e.target.value)}
                    placeholder={
                      SUGGESTIONS[i % SUGGESTIONS.length] + "…"
                    }
                    maxLength={40}
                    className="field"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(i)}
                    disabled={categories.length <= MIN_CATEGORIES}
                    className="btn-ghost h-10 w-10 shrink-0 px-0 py-0 text-lg"
                    aria-label={`Remove category ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {categories.length < MAX_CATEGORIES && (
              <button
                type="button"
                onClick={addCategory}
                className="btn-ghost mt-3 w-full py-2.5 text-sm"
              >
                + Add category
              </button>
            )}

            <div className="mt-5">
              <p className="t-label font-display uppercase text-slate-600">
                Or tap one
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((topic) => {
                  const used = filled.some(
                    (c) => c.toLowerCase() === topic.toLowerCase(),
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
                          ? "cursor-default border-cream/40 bg-cream/10 text-cream-bright"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cream/50 hover:text-cream-bright",
                      ].join(" ")}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <label className="t-label block font-display uppercase text-slate-600">
                Extra instructions (optional)
              </label>
              <input
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="make it hard · keep it light · no spoilers past season 4"
                maxLength={200}
                className="field mt-2"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
                Teams
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNames((n) => n.slice(0, -1))}
                  disabled={names.length <= MIN_TEAMS}
                  className="btn-ghost h-9 w-9 px-0 py-0 text-lg"
                  aria-label="Remove team"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNames((n) => [
                      ...n,
                      DEFAULT_NAMES[n.length] ?? `Team ${n.length + 1}`,
                    ])
                  }
                  disabled={names.length >= MAX_TEAMS}
                  className="btn-ghost h-9 w-9 px-0 py-0 text-lg"
                  aria-label="Add team"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {names.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-slate-600">
                    {i + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(i, e.target.value)}
                    placeholder={`Team ${i + 1}`}
                    maxLength={22}
                    className="field"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
            Difficulty
          </h2>
          <div className="mt-3">
            <DifficultyBar value={difficulty} onChange={setDifficulty} />
          </div>

          <h2 className="mt-8 font-display text-xl uppercase tracking-widest text-slate-300">
            House rules
          </h2>
          <div className="mt-4 space-y-3">
            <Toggle
              label="Steals"
              hint="A wrong answer opens the clue to the other teams."
              checked={rules.steal}
              onChange={(v) => setRule("steal", v)}
            />
            <Toggle
              label="Deduct on wrong"
              hint="Wrong answers cost the clue's value. Off means no penalty."
              checked={rules.deduct}
              onChange={(v) => setRule("deduct", v)}
            />
            <Toggle
              label="Daily doubles"
              hint="Two hidden tiles. The team wagers before seeing the clue."
              checked={rules.dailyDoubles}
              onChange={(v) => setRule("dailyDoubles", v)}
            />
            <Toggle
              label="Final Jeopardy"
              hint="One last clue after the board clears. Everyone wagers and writes."
              checked={rules.finalRound}
              onChange={(v) => setRule("finalRound", v)}
            />
            <div>
              <Toggle
                label="Clue timer"
                hint={
                  rules.timer
                    ? `${rules.timerSeconds}s countdown on every clue.`
                    : "Give every clue a countdown."
                }
                checked={rules.timer}
                onChange={(v) => setRule("timer", v)}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-4">
                {TIMER_CHOICES.map((seconds) => {
                  const active = rules.timer && rules.timerSeconds === seconds;
                  return (
                    <button
                      key={seconds}
                      type="button"
                      // Picking a length turns the timer on — saves a second tap.
                      onClick={() =>
                        setRules((r) => ({
                          ...r,
                          timer: true,
                          timerSeconds: seconds,
                        }))
                      }
                      aria-pressed={active}
                      className={[
                        "rounded-full border px-3.5 py-1.5 font-display text-sm tabular-nums transition-colors",
                        active
                          ? "border-cream/60 bg-cream/15 text-cream-bright"
                          : rules.timer
                            ? "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cream/40 hover:text-cream-bright"
                            : "border-white/10 bg-white/[0.02] text-slate-600 hover:border-white/20 hover:text-slate-400",
                      ].join(" ")}
                    >
                      {seconds}s
                    </button>
                  );
                })}
              </div>
            </div>
            <Toggle
              label="Winner picks next"
              hint="Whoever got it right picks. Off means the turn just rotates."
              checked={rules.turnMode === "winner-picks"}
              onChange={(v) => setRule("turnMode", v ? "winner-picks" : "rotate")}
            />
          </div>
        </section>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-center text-rose-200"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-10 flex flex-col items-center gap-3 pb-6">
        <button
          type="button"
          onClick={() => start("ai")}
          disabled={!canGenerate || generating}
          className="btn-cream px-16 py-5 text-2xl"
        >
          {generating ? "Building the board…" : "Build my board"}
        </button>
        {!canGenerate && (
          <p className="text-sm text-slate-500">
            Add at least {MIN_CATEGORIES} categories to build a board.
          </p>
        )}
        <button
          type="button"
          onClick={() => start("sample")}
          disabled={generating}
          className="btn-ghost text-sm"
        >
          Skip it — play the sample board
        </button>
      </div>
    </main>
  );
}
