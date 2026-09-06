"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScoreNudge } from "@/components/ScoreNudge";
import { Tally } from "@/components/Tally";
import { useCue, useCueWhen } from "@/components/useCue";
import { type OddState, oddPair } from "@/lib/games/oddOne";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: OddState & ViewerExtras;
  onForce: () => void;
  onNext: () => void;
  onQuit: () => void;
  onAdjust: (playerId: string, delta: number) => void;
};

/**
 * The television, during Bluff Trivia.
 *
 * It shows no question while people are answering. The odd one out is in
 * the room looking at this screen, and one glance at the real question
 * would tell them everything. So the TV says only that everyone has a
 * question and one of them is different, and counts down. The questions
 * appear at the reveal, side by side, which is also the moment the room
 * finds out what the odd answer was actually answering.
 */
export function OddHost({ room, state, onForce, onNext, onQuit, onAdjust }: Props) {
  const players = connectedPlayers(room);
  const pair = oddPair(state);
  const name = (id: string | null | undefined) =>
    (id && playerById(room, id)?.name) || "—";
  const emoji = (id: string) => playerById(room, id)?.emoji ?? "";

  // The answer clock. The server is only told when it hits zero.
  const [left, setLeft] = useState(state.seconds);
  useEffect(() => {
    if (state.phase !== "answer" || !state.startedAt) {
      setLeft(state.seconds);
      return;
    }
    const tick = () =>
      setLeft(Math.max(0, state.seconds - (Date.now() - state.startedAt!) / 1000));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [state.phase, state.startedAt, state.seconds, state.round]);
  useEffect(() => {
    if (state.phase === "answer" && state.startedAt && left <= 0) onForce();
  }, [left, state.phase, state.startedAt, onForce]);

  useCue(state.round, "pop");
  useCueWhen(state.phase === "vote", "whoosh");
  useCueWhen(state.phase === "reveal", state.caught ? "correct" : "wrong");
  useCueWhen(state.phase === "done", "fanfare");

  const waiting = players.filter((p) =>
    state.phase === "answer"
      ? state.answers[p.id] === undefined
      : state.votes[p.id] === undefined,
  );

  if (state.phase === "done") {
    const ranked = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="flex min-h-dvh lg:h-dvh flex-col items-center justify-center gap-[3vmin] p-[4vmin] text-center pb-16 lg:pb-[1.6vmin]">
        <p className="t-label font-display uppercase text-moon-deep">That&apos;s the game</p>
        <h2 className="brand-text t-hero font-display font-bold uppercase tracking-tight">
          {ranked[0]?.name ?? "Nobody"} wins
        </h2>
        <Standings room={room} onAdjust={onAdjust} />
        <button onClick={onQuit} className="btn-brand px-10 py-4 text-lg">
          Back to the lobby
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh lg:h-dvh flex-col gap-[2vmin] p-[2.5vmin] pb-16 lg:pb-[1.6vmin]">
      <header className="flex shrink-0 items-center justify-between">
        <span className="font-display text-[clamp(0.8rem,1.4vw,1.4rem)] uppercase tracking-[0.25em] text-moon-deep">
          Bluff Trivia · round {state.round + 1} of {state.pairs.length}
        </span>
        <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
          End segment
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.5vmin] px-[3vw] text-center">
        {/* ---- answering: no question on this screen, on purpose ---- */}
        {state.phase === "answer" && (
          <>
            <p className="t-label font-display uppercase text-moon-deep">Look at your phone</p>
            <h2 className="t-clue text-balance font-display uppercase tracking-wide text-moon">
              Everyone has a question. One of you has a different one.
            </h2>
            <p className="max-w-3xl text-[clamp(1rem,1.8vw,1.8rem)] text-moon-dim">
              Answer yours. Then work out who was answering something else.
            </p>
            <Clock left={left} seconds={state.seconds} />
            <p className="font-display text-[clamp(0.9rem,1.5vw,1.5rem)] uppercase tracking-[0.2em] text-moon-deep">
              {waiting.length
                ? `Waiting on ${waiting.map((p) => p.name).join(", ")}`
                : "Everyone's in"}
            </p>
          </>
        )}

        {/* ---- voting: the answers, with names, and still no question ---- */}
        {state.phase === "vote" && (
          <>
            <h2 className="t-clue font-display uppercase tracking-wide text-moon">
              Whose answer doesn&apos;t fit?
            </h2>
            <Answers state={state} room={room} />
            <p className="font-display text-[clamp(0.9rem,1.5vw,1.5rem)] uppercase tracking-[0.2em] text-moon-deep">
              {waiting.length
                ? `Vote on your phone · waiting on ${waiting.map((p) => p.name).join(", ")}`
                : "Counting…"}
            </p>
          </>
        )}

        {/* ---- reveal: both questions, and who had which ---- */}
        {state.phase === "reveal" && (
          <>
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={[
                "font-display text-[clamp(1.4rem,3.4vw,3.6rem)] uppercase tracking-wide",
                state.caught ? "text-emerald-300" : "text-rose-300",
              ].join(" ")}
            >
              {state.caught
                ? `Caught — it was ${emoji(state.oddId ?? "")} ${name(state.oddId)}`
                : `${emoji(state.oddId ?? "")} ${name(state.oddId)} got away with it`}
            </motion.p>
            <div className="grid w-full max-w-5xl gap-[1.5vmin] sm:grid-cols-2">
              <Question label="Everyone was asked" text={pair?.question ?? ""} />
              <Question label={`${name(state.oddId)} was asked`} text={pair?.decoy ?? ""} odd />
            </div>
            <Answers state={state} room={room} revealOdd />
          </>
        )}
      </div>

      <div className="shrink-0 space-y-[1vmin]">
        <div className="flex justify-center gap-3">
          {(state.phase === "answer" || state.phase === "vote") && (
            <button onClick={onForce} className="btn-ghost text-sm">
              {state.phase === "answer" ? "Stop waiting" : "Close the vote"}
            </button>
          )}
          {state.phase === "reveal" && (
            <button onClick={onNext} className="btn-accent px-10 py-3 text-lg">
              Next round
            </button>
          )}
        </div>
        <Standings room={room} onAdjust={onAdjust} compact />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- pieces */

function Clock({ left, seconds }: { left: number; seconds: number }) {
  const fraction = Math.max(0, Math.min(1, left / seconds));
  const urgent = left <= 5;
  return (
    <div className="flex w-full max-w-2xl items-center gap-4">
      <div className="h-[1.2vmin] min-h-[6px] flex-1 overflow-hidden rounded-full bg-line/10">
        <div
          className={["h-full rounded-full transition-[width] duration-200 ease-linear", urgent ? "bg-rose-400" : "bg-accent"].join(" ")}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className={["font-display text-[clamp(1.2rem,2.4vw,2.6rem)] tabular-nums", urgent ? "text-rose-300" : "text-moon-dim"].join(" ")}>
        {Math.ceil(left)}s
      </span>
    </div>
  );
}

function Question({ label, text, odd }: { label: string; text: string; odd?: boolean }) {
  return (
    <div className={["rounded-2xl border p-[2vmin] text-left", odd ? "border-rose-400/50 bg-rose-500/10" : "border-line/12 bg-line/[0.03]"].join(" ")}>
      <p className={["t-label font-display uppercase", odd ? "text-rose-300" : "text-moon-deep"].join(" ")}>{label}</p>
      <p className="mt-1 text-[clamp(1rem,2vw,2rem)] leading-snug text-moon">{text}</p>
    </div>
  );
}

/** The answers, one per person, big enough to read across a room. */
function Answers({ state, room, revealOdd }: { state: OddState; room: Room; revealOdd?: boolean }) {
  const count: Record<string, number> = {};
  Object.values(state.votes).forEach((t) => { count[t] = (count[t] ?? 0) + 1; });
  return (
    <div className="grid w-full max-w-5xl gap-[1vmin] sm:grid-cols-2">
      <AnimatePresence>
        {state.order.map((id) => {
          const p = playerById(room, id);
          const isOdd = revealOdd && id === state.oddId;
          return (
            <div
              key={id}
              className={["flex items-center gap-4 rounded-xl border px-5 py-[1.4vmin] text-left", isOdd ? "border-rose-400/70 bg-rose-500/15" : "border-line/10 bg-line/[0.03]"].join(" ")}
            >
              <span className="text-[clamp(1.4rem,2.6vw,2.8rem)]">{p?.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[clamp(0.8rem,1.3vw,1.3rem)] uppercase tracking-widest text-moon-deep">{p?.name}</p>
                <p className="truncate font-display text-[clamp(1.1rem,2.2vw,2.3rem)] uppercase tracking-wide text-moon">{state.answers[id]}</p>
              </div>
              {revealOdd && count[id] ? (
                <span className="shrink-0 font-display text-[clamp(1rem,1.8vw,1.8rem)] tabular-nums text-moon-dim">{count[id]} {count[id] === 1 ? "vote" : "votes"}</span>
              ) : null}
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Standings({ room, onAdjust, compact }: { room: Room; onAdjust: (id: string, d: number) => void; compact?: boolean }) {
  const ranked = [...connectedPlayers(room)].sort((a, b) => b.score - a.score);
  return (
    <div className="flex flex-wrap justify-center gap-[0.8vmin]">
      {ranked.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line/10 bg-line/[0.03] px-4 py-2">
          <span className={compact ? "text-[clamp(1rem,1.8vw,1.8rem)]" : "text-[clamp(1.4rem,2.6vw,2.6rem)]"}>{p.emoji}</span>
          <span className={["font-display uppercase tracking-wide text-moon", compact ? "text-[clamp(0.8rem,1.3vw,1.3rem)]" : "text-[clamp(1rem,1.8vw,1.8rem)]"].join(" ")}>{p.name}</span>
          <ScoreNudge step={100} size="small" onAdjust={(d) => onAdjust(p.id, d)}>
            <span className={["font-display font-bold tabular-nums text-accent", compact ? "text-[clamp(0.9rem,1.5vw,1.5rem)]" : "text-[clamp(1.2rem,2.2vw,2.2rem)]"].join(" ")}>
              <Tally value={p.score} />
            </span>
          </ScoreNudge>
        </div>
      ))}
    </div>
  );
}
