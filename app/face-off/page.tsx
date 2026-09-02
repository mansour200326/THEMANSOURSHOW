"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FeudBoard } from "@/components/feud/FeudBoard";
import { type FeudConfig, FeudSetup } from "@/components/feud/FeudSetup";
import { Generating } from "@/components/Generating";
import { HowToPlay } from "@/components/HowToPlay";
import { PackWorkshop } from "@/components/packs/PackWorkshop";
import { packToSurvey } from "@/lib/packs/convert";
import type { SurveyRound } from "@/lib/packs/types";
import { ShowMark } from "@/components/ShowMark";
import {
  emptyFeud,
  feudReducer,
  feudStandings,
  feudWinners,
} from "@/lib/feud/engine";
import { resolveGuess } from "@/lib/feud/judge";
import { sampleFeudPack } from "@/lib/feud/samplePack";
import { type FeudQuestion, type FeudState, otherTeam } from "@/lib/feud/types";
import { backHref } from "@/lib/backHref";
import { ScoreFixer } from "@/components/ScoreAdjuster";

const KEY = "bignight:feud:v1";

function FaceOffStage() {
  const [state, dispatch] = useReducer(feudReducer, undefined, emptyFeud);
  const [saved, setSaved] = useState<FeudState | null>(null);
  const [generating, setGenerating] = useState<FeudConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const abort = useRef<AbortController | null>(null);
  /** True while a guess is still being judged. */
  const [checking, setChecking] = useState(false);
  const judging = useRef<AbortController | null>(null);
  /** The rules come first. Deliberately not part of game state. */
  const [explained, setExplained] = useState(false);
  /** Set while the host is writing their own survey. */
  const [writing, setWriting] = useState<FeudConfig | null>(null);

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
      theme: config.themes.join(" · "),
      questions,
      clockSeconds: config.clockSeconds,
    });
  };

  const start = async (config: FeudConfig) => {
    setError(null);
    if (config.source === "mine") {
      setWriting(config);
      return;
    }
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
        body: JSON.stringify({ themes: config.themes, rounds: config.rounds }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Survey generation failed.");
      // The generator sometimes hands back more rounds than were asked for.
      begin(config, (data.questions as FeudQuestion[]).slice(0, config.rounds));
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
      <Generating
        title="Writing the survey"
        items={generating.themes.length ? generating.themes : ["Face-Off"]}
        note="A question and its top answers for every round, ranked the way a hundred people would have."
        onCancel={() => {
          abort.current?.abort();
          setGenerating(null);
        }}
      />
    );
  }

  if (writing) {
    return (
      <PackWorkshop
        gameId="face-off"
        gameName="Face-Off"
        onBack={() => setWriting(null)}
        onPlay={(_kind, data) => {
          const questions = packToSurvey(data as SurveyRound[]);
          const config = writing;
          setWriting(null);
          begin(config, questions.slice(0, config.rounds));
        }}
      />
    );
  }

  if (state.phase === "setup" && !explained) {
    return (
      <HowToPlay
        gameId="face-off"
        name="Face-Off"
        startLabel="Set it up"
        onStart={() => setExplained(true)}
        onBack={() => {
          window.location.href = backHref();
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

  /**
   * Work out what they said, then tell the board. Deciding can mean a round
   * trip, so the board shows a "checking" state until this resolves rather
   * than striking a team for the network being slow.
   */
  const guess = async (text: string) => {
    const question = state.questions[state.round];
    if (!question) return;

    judging.current?.abort();
    const run = new AbortController();
    judging.current = run;
    setChecking(true);
    try {
      const { index, repeat } = await resolveGuess({
        question: question.question,
        guess: text,
        answers: question.answers,
        revealed: state.revealed,
        signal: run.signal,
      });
      if (run.signal.aborted) return;
      dispatch({ type: "GUESS", text, matched: index, repeat });
    } finally {
      if (judging.current === run) {
        judging.current = null;
        setChecking(false);
      }
    }
  };

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
          <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-moon-deep/70 sm:inline">
            presents · Face-Off{state.theme ? ` · ${state.theme}` : ""}
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
          <ScoreFixer
            entries={state.teams.map((t, i) => ({
              id: String(i),
              name: t.name,
              score: t.score,
            }))}
            step={10}
            onAdjust={(id, delta) => dispatch({ type: "ADJUST", teamIndex: Number(id), delta })}
          />
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
                <p className="t-label font-display uppercase text-moon-deep">
                  Round {state.round + 1}
                </p>
                <p className="t-clue max-w-[80vw] text-balance font-display uppercase tracking-wide text-moon">
                  Who takes the board?
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {state.teams.map((team, i) => (
                    <button
                      key={team.id}
                      onClick={() => dispatch({ type: "SET_CONTROL", team: i })}
                      className="btn-accent px-12 py-5 text-2xl"
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(state.phase === "play" || state.phase === "round-end") && (
              <FeudBoard
                state={state}
                onGuess={guess}
                checking={checking}
                onReveal={(index) => dispatch({ type: "REVEAL", index })}
                onStrike={() => dispatch({ type: "STRIKE" })}
                onNextRound={() => dispatch({ type: "NEXT_ROUND" })}
                onClock={(run) => dispatch({ type: "CLOCK", run })}
              />
            )}

            {state.phase === "winner" && (
              <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
                <p className="t-label font-display uppercase text-moon-deep">
                  {feudWinners(state.teams).length > 1 ? "It's a tie" : "Champions"}
                </p>
                <h2 className="brand-text t-hero drop-shadow-[0_0_80px_rgba(255,107,87,0.45)] text-balance font-display font-bold uppercase tracking-tight">
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
                          ? "border-accent/50 bg-accent/[0.08]"
                          : "border-white/10",
                      ].join(" ")}
                    >
                      <span className="font-display text-xl uppercase tracking-wide text-moon">
                        {team.name}
                      </span>
                      <span className="font-display text-xl font-bold tabular-nums text-accent">
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
            const active = state.phase === "play" && i === state.control;
            return (
              <div
                key={team.id}
                className={[
                  "flex flex-col items-center rounded-xl border px-4 py-[1.2vmin]",
                  active
                    ? "border-accent/70 bg-gradient-to-b from-accent/15 to-transparent"
                    : "border-white/10 bg-white/[0.03]",
                ].join(" ")}
              >
                <span
                  className={[
                    "truncate font-display text-[clamp(0.8rem,1.2vw,1.6rem)] uppercase tracking-wider",
                    active ? "text-accent-bright" : "text-moon-dim",
                  ].join(" ")}
                >
                  {team.name}
                </span>
                <span className="font-display text-[clamp(1.4rem,2.2vw,3rem)] font-bold tabular-nums text-moon">
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

/**
 * Face-Off is a survey of people, not a quiz — it runs on the social accent.
 */
export default function FaceOffPage() {
  return (
    <div className="g-social contents">
      <FaceOffStage />
    </div>
  );
}
