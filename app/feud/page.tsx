"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FeudBoard } from "@/components/feud/FeudBoard";
import { type FeudConfig, FeudSetup } from "@/components/feud/FeudSetup";
import { GeneratingScreen } from "@/components/jeopardy/GeneratingScreen";
import { ShowMark } from "@/components/ShowMark";
import {
  emptyFeud,
  feudReducer,
  feudStandings,
  feudWinners,
} from "@/lib/feud/engine";
import { sampleFeudPack } from "@/lib/feud/samplePack";
import { type FeudQuestion, type FeudState, otherTeam } from "@/lib/feud/types";

const KEY = "parlour:feud:v1";

export default function FeudPage() {
  const [state, dispatch] = useReducer(feudReducer, undefined, emptyFeud);
  const [saved, setSaved] = useState<FeudState | null>(null);
  const [generating, setGenerating] = useState<FeudConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FeudState;
        if (parsed?.teams?.length) setSaved({ ...parsed, past: [] });
      }
    } catch {
      /* corrupt save is not worth surfacing */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (state.phase === "setup") return; // don't wipe a save just by sitting here
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...state, past: [] }));
    } catch {
      /* private mode — game still runs in memory */
    }
  }, [state]);

  const begin = (config: FeudConfig, questions: FeudQuestion[]) => {
    setGenerating(null);
    dispatch({
      type: "START",
      teamNames: config.teamNames,
      theme: config.theme,
      questions,
    });
  };

  const start = async (config: FeudConfig) => {
    setError(null);
    if (config.source === "sample") {
      begin(config, sampleFeudPack.slice(0, config.rounds));
      return;
    }

    setGenerating(config);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch("/api/feud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: config.theme, rounds: config.rounds }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Survey generation failed.");
      begin(config, data.questions as FeudQuestion[]);
    } catch (e) {
      if (controller.signal.aborted) return;
      setGenerating(null);
      setError(e instanceof Error ? e.message : "Survey generation failed.");
    } finally {
      abort.current = null;
    }
  };

  if (generating) {
    return (
      <GeneratingScreen
        categories={[generating.theme.trim() || "The Feud"]}
        onCancel={() => {
          abort.current?.abort();
          setGenerating(null);
        }}
      />
    );
  }

  if (state.phase === "setup") {
    return (
      <FeudSetup
        onStart={start}
        error={error}
        canResume={Boolean(saved)}
        onResume={() => saved && dispatch({ type: "HYDRATE", state: saved })}
      />
    );
  }

  const quit = () => {
    if (!window.confirm("End the game and go back to setup?")) return;
    window.localStorage.removeItem(KEY);
    setSaved(null);
    dispatch({ type: "RESET" });
  };

  return (
    <main className="flex h-dvh flex-col gap-[1.2vmin] overflow-hidden p-[1.4vmin]">
      <header className="flex shrink-0 items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <ShowMark size="sm" />
          <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-slate-600 sm:inline">
            presents · The Feud{state.theme ? ` · ${state.theme}` : ""}
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

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase + state.round}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {state.phase === "face-off" && (
              <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
                <p className="t-label font-display uppercase text-slate-500">
                  Round {state.round + 1}
                </p>
                <p className="t-clue max-w-[80vw] text-balance font-display uppercase tracking-wide text-slate-50">
                  Who takes the board?
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {state.teams.map((team, i) => (
                    <button
                      key={team.id}
                      onClick={() => dispatch({ type: "SET_CONTROL", team: i })}
                      className="btn-cream px-12 py-5 text-2xl"
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(state.phase === "play" || state.phase === "steal") && (
              <FeudBoard
                state={state}
                onReveal={(index) => dispatch({ type: "REVEAL", index })}
                onStrike={() => dispatch({ type: "STRIKE" })}
                onStealHit={(index) => dispatch({ type: "STEAL_HIT", index })}
                onStealMiss={() => dispatch({ type: "STEAL_MISS" })}
              />
            )}

            {state.phase === "round-end" && (
              <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
                <p className="t-label font-display uppercase text-slate-500">
                  {state.outcome === "stolen"
                    ? "Stolen"
                    : state.outcome === "cleared"
                      ? "Board cleared"
                      : "Held on"}
                </p>
                <p className="cream-text t-hero font-display font-bold uppercase">
                  +{state.pot}
                </p>
                <p className="font-display text-[clamp(1.2rem,2.4vw,2.6rem)] uppercase tracking-wide text-slate-200">
                  {state.outcome === "stolen"
                    ? state.teams[otherTeam(state)]?.name
                    : state.teams[state.control]?.name}
                </p>
                <button
                  onClick={() => dispatch({ type: "NEXT_ROUND" })}
                  className="btn-cream px-12 py-4 text-xl"
                >
                  {state.round + 1 >= state.questions.length
                    ? "Final standings"
                    : "Next round"}
                </button>
              </div>
            )}

            {state.phase === "winner" && (
              <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
                <p className="t-label font-display uppercase text-slate-500">
                  {feudWinners(state.teams).length > 1 ? "It's a tie" : "Champions"}
                </p>
                <h2 className="cream-text t-hero text-balance font-display font-bold uppercase tracking-tight">
                  {feudWinners(state.teams)
                    .map((t) => t.name)
                    .join(" & ")}
                </h2>
                <div className="w-full max-w-2xl space-y-2">
                  {feudStandings(state.teams).map((team, i) => (
                    <div
                      key={team.id}
                      className={[
                        "flex items-center justify-between rounded-xl border px-5 py-3",
                        i === 0
                          ? "border-cream/50 bg-cream/[0.08]"
                          : "border-white/10",
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
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {state.phase !== "winner" && (
        <div
          className="grid shrink-0 gap-[0.6vmin]"
          style={{
            gridTemplateColumns: `repeat(${state.teams.length}, minmax(0, 1fr))`,
          }}
        >
          {state.teams.map((team, i) => {
            const active =
              (state.phase === "play" && i === state.control) ||
              (state.phase === "steal" && i === otherTeam(state));
            return (
              <div
                key={team.id}
                className={[
                  "flex flex-col items-center rounded-xl border px-4 py-[1.2vmin]",
                  active
                    ? "border-cream/70 bg-gradient-to-b from-cream/15 to-transparent"
                    : "border-white/10 bg-white/[0.03]",
                ].join(" ")}
              >
                <span
                  className={[
                    "truncate font-display text-[clamp(0.8rem,1.2vw,1.6rem)] uppercase tracking-wider",
                    active ? "text-cream-bright" : "text-slate-400",
                  ].join(" ")}
                >
                  {team.name}
                </span>
                <span className="font-display text-[clamp(1.4rem,2.2vw,3rem)] font-bold tabular-nums text-slate-50">
                  {team.score}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
