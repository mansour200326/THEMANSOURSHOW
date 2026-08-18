"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DifficultyBar } from "@/components/DifficultyBar";
import { GeneratingScreen } from "@/components/jeopardy/GeneratingScreen";
import { RapidStage } from "@/components/rapid/RapidStage";
import { ShowMark } from "@/components/ShowMark";
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
  const [names, setNames] = useState(["Team 1", "Team 2"]);
  const [theme, setTheme] = useState("");
  const [rounds, setRounds] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<RapidState | null>(null);
  const hydrated = useRef(false);
  const abort = useRef<AbortController | null>(null);

  const KEY = `huddle:rapid:${mode}:v1`;

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
    dispatch({ type: "START", teamNames: names, theme, prompts });

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
        body: JSON.stringify({ mode, count: rounds, theme, difficulty }),
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
        categories={[theme.trim() || RAPID_TITLE[mode]]}
        onCancel={() => {
          abort.current?.abort();
          setGenerating(false);
        }}
      />
    );
  }

  /* ------------------------------------------------------------- setup */
  if (state.phase === "setup") {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-10">
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
            {RAPID_TITLE[mode]}
          </h1>
          <p className="mt-3 text-slate-400">
            {RAPID_RULE[mode]} Two teams take turns — no phones, you run the
            clock from here.
          </p>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cream/40 bg-cream/[0.08] px-5 py-4"
          >
            <p className="text-slate-200">There&apos;s a game in progress.</p>
            <button
              onClick={() => dispatch({ type: "HYDRATE", state: saved })}
              className="btn-cream"
            >
              Resume game
            </button>
          </motion.div>
        )}

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
              Teams
            </h2>
            <div className="mt-4 space-y-3">
              {names.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-slate-600">
                    {i + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(e) =>
                      setNames((n) => n.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    maxLength={22}
                    className="field"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
              Theme
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              What the prompts should lean towards. Leave it blank for a bit of
              everything.
            </p>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="food · sport · films · the 90s"
              maxLength={200}
              className="field mt-3"
            />
          </div>

          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-slate-300">
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
                      ? "border-cream/60 bg-cream/15 text-cream-bright"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cream/40",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Each round, every team gets a turn.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-xl uppercase tracking-widest text-slate-300">
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
          <button onClick={() => start(true)} className="btn-cream px-16 py-5 text-2xl">
            Write the prompts
          </button>
          <button onClick={() => start(false)} className="btn-ghost text-sm">
            Skip — use the built-in prompts
          </button>
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
          <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-slate-600 sm:inline">
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
            <p className="t-label font-display uppercase text-slate-500">
              {rapidWinners(state.teams).length > 1 ? "It's a tie" : "Winner"}
            </p>
            <h2 className="cream-text t-hero text-balance font-display font-bold uppercase tracking-tight">
              {rapidWinners(state.teams).map((t) => t.name).join(" & ")}
            </h2>
            <div className="w-full max-w-2xl space-y-2">
              {rapidStandings(state.teams).map((team, i) => (
                <div
                  key={team.id}
                  className={[
                    "flex items-center justify-between rounded-xl border px-5 py-3",
                    i === 0 ? "border-cream/50 bg-cream/[0.08]" : "border-white/10",
                  ].join(" ")}
                >
                  <span className="font-display text-xl uppercase tracking-wide text-slate-100">
                    {team.name}
                  </span>
                  <span className="font-display text-xl font-bold tabular-nums text-cream">
                    {team.score}
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
                  ? "border-cream/70 bg-gradient-to-b from-cream/15 to-transparent"
                  : "border-white/10 bg-white/[0.03]",
              ].join(" ")}
            >
              <span
                className={[
                  "truncate font-display text-[clamp(0.8rem,1.2vw,1.6rem)] uppercase tracking-wider",
                  i === state.turn ? "text-cream-bright" : "text-slate-400",
                ].join(" ")}
              >
                {team.name}
              </span>
              <span className="font-display text-[clamp(1.4rem,2.2vw,3rem)] font-bold tabular-nums text-slate-50">
                {team.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
