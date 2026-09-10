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
import { recordNight } from "@/lib/night/report";

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
  /** True while the board being written is for a rematch, so the screen says so. */
  const [rematching, setRematching] = useState(false);
  /** A line for the board screen when a rematch had to fall back to the old board. */
  const [notice, setNotice] = useState<string | null>(null);
  /** What the last written board was asked for, so a rematch can ask again. */
  const lastConfig = useRef<SetupConfig | null>(null);
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

  // Played to the end: the scores join the night this board was opened from.
  const reported = useRef(false);
  useEffect(() => {
    if (state.phase !== "winner") {
      reported.current = false;
      return;
    }
    if (reported.current) return;
    reported.current = true;
    recordNight(
      "big-board",
      "Big Board",
      state.teams.map((t) => ({ name: t.name, points: t.score })),
    );
  }, [state.phase, state.teams]);

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

  const handleStart = async (config: SetupConfig, rematch = false) => {
    setGenError(null);
    setNotice(null);

    if (config.source === "sample") {
      begin(config, sampleBoard, sampleFinalClue);
      return;
    }

    if (config.source === "mine") {
      setWriting(config);
      return;
    }

    lastConfig.current = config;
    setRematching(rematch);
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
      const message = error instanceof Error ? error.message : "Board generation failed.";
      if (rematch) {
        // The room is standing there. Play the old board rather than a form.
        dispatch({ type: "REMATCH" });
        setNotice(`Couldn't write a new board (${message}). Same board, fresh scores.`);
        return;
      }
      setGenError(message);
    } finally {
      abortRef.current = null;
      setRematching(false);
    }
  };

  /*
   * Rematch used to mean the same board with the scores wiped, which is
   * fine for a sample board and useless for a written one: the room has
   * just heard every answer. A written board is written again — same
   * categories, same difficulty, same teams — and the library keeps the
   * new clues clear of the old ones. After a reload the original request
   * is gone, so it's rebuilt from the board on screen.
   */
  const rematch = () => {
    const names = state.teams.map((t) => t.name);
    const remembered = lastConfig.current;
    const config: SetupConfig | null = remembered
      ? { ...remembered, teamNames: names }
      : state.board.categories.length >= 3
        ? {
            teamNames: names,
            categories: state.board.categories.map((c) => c.title),
            vibe: "",
            rules: state.rules,
            difficulty: "medium",
            source: "ai",
          }
        : null;
    if (!config || config.source !== "ai" || state.board === sampleBoard) {
      dispatch({ type: "REMATCH" });
      return;
    }
    void handleStart(config, true);
  };

  if (pending) {
    return (
      <Generating
        title={rematching ? "Writing a fresh board" : "Writing the board"}
        items={pending.categories}
        note={
          rematching
            ? "New clues, same categories, same teams. Nothing from the last game comes back."
            : "Five clues for every category, plus one Final Round."
        }
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
    <main className="flex min-h-dvh lg:h-dvh flex-col gap-[1.2vmin] lg:overflow-hidden p-[1.4vmin]">
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
            {notice && (
              <p
                onClick={() => setNotice(null)}
                className="mx-auto mb-[1vmin] max-w-3xl rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-2 text-center text-[clamp(0.9rem,1.3vw,1.5rem)] text-rose-100"
              >
                {notice}
              </p>
            )}
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
                onRematch={rematch}
                rewrites={state.board !== sampleBoard && (Boolean(lastConfig.current) || state.board.categories.length >= 3)}
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
