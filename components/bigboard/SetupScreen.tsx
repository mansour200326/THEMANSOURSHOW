"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DifficultyBar } from "@/components/DifficultyBar";
import { ShowMark } from "@/components/ShowMark";
import { TeamsField, cleanTeamNames, startingTeams } from "@/components/setup/TeamsField";
import { ThemeList, usableThemes } from "@/components/setup/ThemeList";
import type { Difficulty } from "@/lib/difficulty";
import { type Rules, defaultRules } from "@/lib/bigboard/types";
import { backHref } from "@/lib/backHref";

const MIN_CATEGORIES = 3;
const MAX_CATEGORIES = 6;

/** Clue countdown lengths the host can pick from. */
const TIMER_CHOICES = [10, 15, 20, 30, 45, 60];

export type SetupConfig = {
  teamNames: string[];
  categories: string[];
  vibe: string;
  rules: Rules;
  difficulty: Difficulty;
  source: "ai" | "sample" | "mine";
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
          ? "border-accent/45 bg-accent/[0.07]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-accent" : "bg-white/15",
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
        <span className="block font-display text-base uppercase tracking-wider text-moon">
          {label}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-moon-dim">
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
  const [names, setNames] = useState<string[]>(startingTeams);
  const [categories, setCategories] = useState<string[]>(["", "", ""]);
  const [vibe, setVibe] = useState("");
  const [rules, setRules] = useState<Rules>(defaultRules);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) =>
    setRules((r) => ({ ...r, [key]: value }));

  const filled = usableThemes(categories);
  const canGenerate = filled.length >= MIN_CATEGORIES;

  const start = (source: SetupConfig["source"]) =>
    onStart({
      teamNames: cleanTeamNames(names),
      categories: filled,
      vibe,
      rules,
      difficulty,
      source,
    });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href={backHref()} className="opacity-80 transition hover:opacity-100">
          <ShowMark size="sm" />
        </Link>
        <Link
          href={backHref()}
          className="font-display text-xs uppercase tracking-[0.2em] text-moon-deep hover:text-moon/75"
        >
          ← Back
        </Link>
      </header>

      <div className="mt-10">
        <p className="t-label font-display uppercase text-moon-deep">
          Big Night presents
        </p>
        <h1 className="accent-text mt-1 font-display text-5xl font-bold uppercase tracking-tight sm:text-7xl">
          Big Board
        </h1>
      </div>

      {canResume && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/[0.08] px-5 py-4"
        >
          <p className="text-moon/90">
            There&apos;s a game in progress on this screen.
          </p>
          <button onClick={onResume} className="btn-brand">
            Resume game
          </button>
        </motion.div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Categories + teams */}
        <section className="space-y-8">
          <ThemeList
          gameId={"big-board"}
            title="Categories"
            hint="You pick the topics — anything from Game of Thrones to roasting your friends. We write five clues for each."
            themes={categories}
            onChange={setCategories}
            difficulty={difficulty}
            vibe={vibe}
            min={MIN_CATEGORIES}
            max={MAX_CATEGORIES}
            noun="category"
          />

          <div>
            <label className="t-label block font-display uppercase text-moon-deep/70">
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

          <TeamsField names={names} onChange={setNames} />
        </section>

        {/* Rules */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
            Difficulty
          </h2>
          <div className="mt-3">
            <DifficultyBar value={difficulty} onChange={setDifficulty} />
          </div>

          <h2 className="mt-8 font-display text-xl uppercase tracking-widest text-moon/75">
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
              label="Final Round"
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
                          ? "border-accent/60 bg-accent/15 text-accent-bright"
                          : rules.timer
                            ? "border-white/10 bg-white/[0.03] text-moon/75 hover:border-accent/40 hover:text-accent-bright"
                            : "border-white/10 bg-white/[0.02] text-moon-deep/70 hover:border-white/20 hover:text-moon-dim",
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
          className="btn-brand px-16 py-5 text-2xl"
        >
          {generating ? "Building the board…" : "Build my board"}
        </button>
        {!canGenerate && (
          <p className="text-sm text-moon-deep">
            Add at least {MIN_CATEGORIES} categories to build a board.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Write the whole board yourself — categories and clues both. */}
          <button
            type="button"
            onClick={() => start("mine")}
            disabled={generating}
            className="btn-accent px-6 py-2.5 text-sm"
          >
            ✎ Write my own board
          </button>
          <button
            type="button"
            onClick={() => start("sample")}
            disabled={generating}
            className="btn-ghost text-sm"
          >
            Skip it — play the sample board
          </button>
        </div>
      </div>
    </main>
  );
}
