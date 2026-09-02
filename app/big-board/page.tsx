"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BoardGrid } from "@/components/board/BoardGrid";
import { ClueStage } from "@/components/bigboard/ClueStage";
import { FinalStage } from "@/components/bigboard/FinalStage";
import { Generating } from "@/components/Generating";
import { ScoreBar } from "@/components/bigboard/ScoreBar";
import { SetupScreen, type SetupConfig } from "@/components/bigboard/SetupScreen";
import { WagerStage } from "@/components/bigboard/WagerStage";
import { WinnerScreen } from "@/components/bigboard/WinnerScreen";
import { HowToPlay } from "@/components/HowToPlay";
import { useCue, useCueWhen } from "@/components/useCue";
import { play } from "@/lib/sound";
import { PackWorkshop } from "@/components/packs/PackWorkshop";
import { ShowMark } from "@/components/ShowMark";
import { clueAt } from "@/lib/board/types";
import {
  activeValue,
  emptyState,
  maxDailyWager,
  reducer,
} from "@/lib/bigboard/engine";
import { packToBoard } from "@/lib/packs/convert";
import type { BoardCategory } from "@/lib/packs/types";
import { sampleBoard, sampleFinalClue } from "@/lib/bigboard/sampleBoard";
import { clearGame, loadGame, saveGame } from "@/lib/bigboard/storage";
import type { GameState } from "@/lib/bigboard/types";
import type { Board, FinalClue } from "@/lib/board/types";
import { backHref } from "@/lib/backHref";

/**
 * Big Board keeps no record of how the host called an answer, so the cue is
 * worked out from the scoreboard: a tile closing with the total up is a
 * correct answer, down or flat is a wrong one.
 */
function useJudgementCue(spent: number, teams: { score: number }[]) {
  const total = teams.reduce((sum, t) => sum + t.score, 0);
  const last = useRef({ spent, total });
  useEffect(() => {
    if (spent !== last.current.spent) {
      play(total > last.current.total ? "correct" : "wrong");
    }
    last.current = { spent, total };
  }, [spent, total]);
}

function BigBoardStage() {
  const [state, dispatch] = useReducer(reducer, sampleBoard, emptyState);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [isFullscreen, setFullscreen] = useState(false);
  const [pending, setPending] = useState<SetupConfig | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Hooks, so above every early return — the setup screen, the workshop and
  // the board are all this one component.
  useCue(
    state.active ? `${state.active.c}:${state.active.r}` : null,
    state.active ? "pop" : null,
  );
  useJudgementCue(state.spent.length, state.teams);
  useCueWhen(state.phase === "winner", "fanfare");

  /** The rules come first. Deliberately not part of game state. */
  const [explained, setExplained] = useState(false);
  /** Set while the host is writing their own board. */
  const [writing, setWriting] = useState<SetupConfig | null>(null);

  // Look for a game left running on this screen. Offered, never forced.
  useEffect(() => {
    setSaved(loadGame());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) saveGame(state);
  }, [state]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }, []);

  const quit = () => {
    if (!window.confirm("End the game and go back to setup?")) return;
    clearGame();
    setSaved(null);
    dispatch({ type: "RESET" });
  };

  const begin = (
    config: SetupConfig,
    board: Board,
    finalClue: FinalClue,
  ) => {
    setPending(null);
    dispatch({
      type: "START",
      teamNames: config.teamNames,
      theme: config.categories.join(" · "),
      rules: config.rules,
      board,
      finalClue,
    });
  };

  const handleStart = async (config: SetupConfig) => {
    setGenError(null);

    if (config.source === "sample") {
      begin(config, sampleBoard, sampleFinalClue);
      return;
    }

    if (config.source === "mine") {
      setWriting(config);
      return;
    }

    setPending(config);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: config.categories,
          vibe: config.vibe,
          difficulty: config.difficulty,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Board generation failed.");
      begin(config, data.board as Board, data.finalClue as FinalClue);
    } catch (error) {
      if (controller.signal.aborted) return;
      setPending(null);
      setGenError(
        error instanceof Error ? error.message : "Board generation failed.",
      );
    } finally {
      abortRef.current = null;
    }
  };

  if (pending) {
    return (
      <Generating
        title="Writing the board"
        items={pending.categories}
        note="Five clues for every category, plus one Final Round."
        onCancel={() => {
          abortRef.current?.abort();
          setPending(null);
        }}
      />
    );
  }

  if (state.phase === "setup" && !explained) {
    return (
      <HowToPlay
        gameId="big-board"
        name="Big Board"
        startLabel="Set it up"
        onStart={() => setExplained(true)}
        onBack={() => {
          window.location.href = backHref();
        }}
      />
    );
  }

  if (writing) {
    return (
      <PackWorkshop
        gameId="big-board"
        gameName="Big Board"
        onBack={() => setWriting(null)}
        onPlay={(_kind, data) => {
          const board = packToBoard(data as BoardCategory[]);
          setWriting(null);
          // A hand-written board has no final round unless one is written for
          // it, so the bundled one stands in rather than the game ending early.
          begin(writing, board, sampleFinalClue);
        }}
      />
    );
  }

  if (state.phase === "setup") {
    return (
      <SetupScreen
        canResume={Boolean(saved)}
        onResume={() => saved && dispatch({ type: "HYDRATE", state: saved })}
        onStart={handleStart}
        error={genError}
      />
    );
  }

  const active = state.active ? clueAt(state.board, state.active) : null;
  const activeCategory = state.active
    ? state.board.categories[state.active.c].title
    : "";

  return (
    <main className="flex h-dvh flex-col gap-[1.2vmin] overflow-hidden p-[1.4vmin]">
      {/* Chrome */}
      <header className="flex shrink-0 items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <ShowMark size="sm" />
          <span className="hidden font-display text-xs uppercase tracking-[0.2em] text-moon-deep/70 sm:inline">
            presents · Big Board
            {state.theme ? ` · ${state.theme}` : ""}
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
          <button
            onClick={toggleFullscreen}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
          <button onClick={quit} className="btn-ghost px-3 py-1.5 text-xs">
            Quit
          </button>
        </div>
      </header>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase + (state.active ? `${state.active.c}-${state.active.r}` : "")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {state.phase === "board" && (
              <div className="flex h-full flex-col gap-[1.2vmin]">
                <p className="shrink-0 text-center font-display text-[clamp(0.85rem,1.5vw,1.9rem)] uppercase tracking-[0.25em] text-moon-dim">
                  <span className="text-accent-bright">
                    {state.teams[state.turn]?.name}
                  </span>{" "}
                  — pick a category
                </p>
                <div className="min-h-0 flex-1">
                  <BoardGrid
                    board={state.board}
                    spent={state.spent}
                    onPick={(ref) => dispatch({ type: "PICK", ref })}
                  />
                </div>
              </div>
            )}

            {state.phase === "wager" && state.active && (
              <WagerStage
                teamName={state.teams[state.turn]?.name ?? ""}
                category={activeCategory}
                score={state.teams[state.turn]?.score ?? 0}
                maxWager={maxDailyWager(state, state.turn)}
                onSubmit={(amount) => dispatch({ type: "SET_WAGER", amount })}
                onCancel={() => dispatch({ type: "UNDO" })}
              />
            )}

            {state.phase === "clue" && active && (
              <ClueStage
                category={activeCategory}
                clue={active.clue}
                answer={active.answer}
                image={active.image}
                value={activeValue(state)}
                isDaily={state.activeIsDaily}
                teams={state.teams}
                turn={state.turn}
                lockedOut={state.lockedOut}
                rules={state.rules}
                onJudge={(teamIndex, correct) =>
                  dispatch({ type: "JUDGE", teamIndex, correct })
                }
                onSkip={() => dispatch({ type: "SKIP" })}
              />
            )}

            {(state.phase === "final-wager" ||
              state.phase === "final-clue" ||
              state.phase === "final-judge") &&
              state.final && (
                <FinalStage
                  phase={state.phase}
                  final={state.final}
                  teams={state.teams}
                  rules={state.rules}
                  onWager={(teamId, amount) =>
                    dispatch({ type: "SET_FINAL_WAGER", teamId, amount })
                  }
                  onLockWagers={() => dispatch({ type: "LOCK_FINAL_WAGERS" })}
                  onShowJudging={() => dispatch({ type: "SHOW_FINAL_JUDGING" })}
                  onJudge={(teamId, correct) =>
                    dispatch({ type: "JUDGE_FINAL", teamId, correct })
                  }
                  onFinish={() => dispatch({ type: "FINISH_FINAL" })}
                />
              )}

            {state.phase === "winner" && (
              <WinnerScreen
                teams={state.teams}
                onRematch={() => dispatch({ type: "REMATCH" })}
                onNewGame={() => {
                  clearGame();
                  setSaved(null);
                  dispatch({ type: "RESET" });
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scores */}
      {state.phase !== "winner" && (
        <div className="shrink-0">
          <ScoreBar
            teams={state.teams}
            activeIndex={state.phase === "board" ? state.turn : null}
            onAdjust={(teamId, delta) => dispatch({ type: "ADJUST", teamId, delta })}
          />
        </div>
      )}
    </main>
  );
}

/**
 * Big Board is a quiz, so the whole screen runs on the trivia accent.
 */
export default function BigBoardPage() {
  return (
    <div className="g-trivia contents">
      <BigBoardStage />
    </div>
  );
}
