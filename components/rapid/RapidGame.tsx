"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DifficultyBar } from "@/components/DifficultyBar";
import { GeneratingScreen } from "@/components/bigboard/GeneratingScreen";
import { RapidStage } from "@/components/rapid/RapidStage";
import { HowToPlay } from "@/components/HowToPlay";
import { PackWorkshop } from "@/components/packs/PackWorkshop";
import { packToPrompts } from "@/lib/packs/convert";
import { Tally } from "@/components/Tally";
import { ShowMark } from "@/components/ShowMark";
import { TeamsField, cleanTeamNames, startingTeams } from "@/components/setup/TeamsField";
import { ThemeList, usableThemes } from "@/components/setup/ThemeList";
import type { Difficulty } from "@/lib/difficulty";
import { emptyRapid, rapidReducer, rapidStandings, rapidWinners } from "@/lib/rapid/engine";
import { drawPrompts } from "@/lib/rapid/packs";
import {
  type RapidMode,
  type RapidState,
  RAPID_RULE,
  RAPID_TITLE,
} from "@/lib/rapid/types";

const ROUND_CHOICES = [3, 5, 8];

export function RapidGame({ mode }: { mode: RapidMode }) {
  const [state, dispatch] = useReducer(rapidReducer, mode, emptyRapid);
  const [names, setNames] = useState(startingTeams);
  const [themes, setThemes] = useState<string[]>([""]);
  const [rounds, setRounds] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<RapidState | null>(null);
  const hydrated = useRef(false);
  const abort = useRef<AbortController | null>(null);
  /** The rules come first. Deliberately not part of game state. */
  const [explained, setExplained] = useState(false);
  /** Set while the host is writing their own prompts. */
  const [writing, setWriting] = useState(false);

  const KEY = `bignight:rapid:${mode}:v1`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RapidState;
        if (parsed?.teams?.length) setSaved({ ...parsed, past: [] });
      }
    } catch {
      /* ignore a corrupt save */
    }
    hydrated.current = true;
  }, [KEY]);

  useEffect(() => {
    if (!hydrated.current || state.phase === "setup") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...state, past: [] }));
    } catch {
      /* private mode */
    }
  }, [state, KEY]);

  const begin = (prompts: string[]) =>
    dispatch({
      type: "START",
      teamNames: cleanTeamNames(names),
      theme: usableThemes(themes).join(" · "),
      prompts,
    });

  const start = async (useAi: boolean) => {
    setError(null);
    if (!useAi) {
      begin(drawPrompts(mode, rounds));
      return;
    }
    setGenerating(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch("/api/rapid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          count: rounds,
          themes: usableThemes(themes),
          difficulty,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't write the prompts.");
      begin(data.prompts as string[]);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Couldn't write the prompts.");
    } finally {
      setGenerating(false);
      abort.current = null;
    }
  };

  const quit = () => {
    if (!window.confirm("End the game and go back to setup?")) return;
    window.localStorage.removeItem(KEY);
    setSaved(null);
    dispatch({ type: "RESET" });
  };

  if (generating) {
    return (
      <GeneratingScreen
        categories={usableThemes(themes).length ? usableThemes(themes) : [RAPID_TITLE[mode]]}
        onCancel={() => {
          abort.current?.abort();
          setGenerating(false);
        }}
      />
    );
  }

  /* ------------------------------------------------------------- setup */
  if (writing) {
    return (
      <PackWorkshop
        gameId={mode}
        gameName={RAPID_TITLE[mode]}
        onBack={() => setWriting(false)}
        onPlay={(_kind, data) => {
          setWriting(false);
          begin(packToPrompts(data as string[]));
        }}
      />
    );
  }

  if (state.phase === "setup" && !explained) {
    return (
      <HowToPlay
        gameId={mode}
        name={RAPID_TITLE[mode]}
        startLabel="Set it up"
        onStart={() => setExplained(true)}
        onBack={() => {
          window.location.href = "/games";
        }}
      />
    );
  }

  if (state.phase === "setup") {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-10">
        <header className="flex items-center justify-between">
          <Link href="/games" className="opacity-80 transition hover:opacity-100">
            <ShowMark size="sm" />
          </Link>
          <Link
            href="/games"
            className="font-display text-xs uppercase tracking-[0.2em] text-moon-deep hover:text-moon/75"
          >
            ← Lineup
          </Link>
        </header>

        <div className="mt-10">
          <p className="t-label font-display uppercase text-moon-deep">
            Big Night presents
          </p>
          <h1 className="accent-text mt-1 font-display text-5xl font-bold uppercase tracking-tight sm:text-7xl">
            {RAPID_TITLE[mode]}
          </h1>
          <p className="mt-3 text-moon-dim">
            {RAPID_RULE[mode]} Teams take turns — no phones, you run the
            clock from here.
          </p>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/[0.08] px-5 py-4"
          >
            <p className="text-moon/90">There&apos;s a game in progress.</p>
            <button
              onClick={() => dispatch({ type: "HYDRATE", state: saved })}
              className="btn-brand"
            >
              Resume game
            </button>
          </motion.div>
        )}

        <section className="mt-10 space-y-8">
          <TeamsField names={names} onChange={setNames} />

          <ThemeList
            title="Themes"
            hint="What the prompts should lean towards. Add a few and they'll be spread across them."
            themes={themes}
            onChange={setThemes}
            difficulty={difficulty}
          />

          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
              Rounds
            </h2>
            <div className="mt-3 flex gap-2">
              {ROUND_CHOICES.map((n) => (
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className={[
                    "rounded-full border px-5 py-2 font-display tabular-nums transition-colors",
                    rounds === n
                      ? "border-accent/60 bg-accent/15 text-accent-bright"
                      : "border-white/10 bg-white/[0.03] text-moon/75 hover:border-accent/40",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-moon-deep">
              Each round, every team gets a turn.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-xl uppercase tracking-widest text-moon/75">
              Difficulty
            </h2>
            <DifficultyBar value={difficulty} onChange={setDifficulty} />
          </div>
        </section>

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
          <button onClick={() => start(true)} className="btn-brand px-16 py-5 text-2xl">
            Write the prompts
          </button>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setWriting(true)}
              className="btn-accent px-6 py-2.5 text-sm"
            >
              ✎ Write my own prompts
            </button>
            <button onClick={() => start(false)} className="btn-ghost text-sm">
              Skip — use the built-in prompts
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* -------------------------------------------------------------- play */
  return (
    <main className="flex h-dvh flex-col gap-[1.2vmin] overflow-hidden p-[1.4vmin]">
      <header className="flex shrink-0 items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <ShowMark size="sm" />
          <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-moon-deep/70 sm:inline">
            presents · {RAPID_TITLE[mode]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={!state.past.length}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Undo
          </button>
          <button onClick={quit} className="btn-ghost px-3 py-1.5 text-xs">
            Quit
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {state.phase === "winner" ? (
          <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
            <p className="t-label font-display uppercase text-moon-deep">
              {rapidWinners(state.teams).length > 1 ? "It's a tie" : "Winner"}
            </p>
            <h2 className="brand-text t-hero drop-shadow-[0_0_80px_rgba(255,107,87,0.45)] text-balance font-display font-bold uppercase tracking-tight">
              {rapidWinners(state.teams).map((t) => t.name).join(" & ")}
            </h2>
            <div className="w-full max-w-2xl space-y-2">
              {rapidStandings(state.teams).map((team, i) => (
                <div
                  key={team.id}
                  className={[
                    "flex items-center justify-between rounded-xl border px-5 py-3",
                    i === 0 ? "border-accent/50 bg-accent/[0.08]" : "border-white/10",
                  ].join(" ")}
                >
                  <span className="font-display text-xl uppercase tracking-wide text-moon">
                    {team.name}
                  </span>
                  <span className="font-display text-xl font-bold tabular-nums text-accent">
                    <Tally value={team.score} />
                  </span>
                </div>
              ))}
            </div>
            <button onClick={quit} className="btn-ghost px-8 py-4">
              New game
            </button>
          </div>
        ) : (
          <RapidStage
            state={state}
            onGo={() => dispatch({ type: "GO" })}
            onTimeUp={() => dispatch({ type: "TIME_UP" })}
            onScore={(points) => dispatch({ type: "SCORE", points })}
          />
        )}
      </div>

      {state.phase !== "winner" && (
        <div
          className="grid shrink-0 gap-[0.6vmin]"
          style={{ gridTemplateColumns: `repeat(${state.teams.length}, minmax(0, 1fr))` }}
        >
          {state.teams.map((team, i) => (
            <div
              key={team.id}
              className={[
                "flex flex-col items-center rounded-xl border px-4 py-[1.2vmin]",
                i === state.turn
                  ? "border-accent/70 bg-gradient-to-b from-accent/15 to-transparent"
                  : "border-white/10 bg-white/[0.03]",
              ].join(" ")}
            >
              <span
                className={[
                  "truncate font-display text-[clamp(0.8rem,1.2vw,1.6rem)] uppercase tracking-wider",
                  i === state.turn ? "text-accent-bright" : "text-moon-dim",
                ].join(" ")}
              >
                {team.name}
              </span>
              <span className="font-display text-[clamp(1.4rem,2.2vw,3rem)] font-bold tabular-nums text-moon">
                <Tally value={team.score} />
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
