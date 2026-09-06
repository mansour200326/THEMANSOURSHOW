"use client";

import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";
import { type OddState, ODD_MAX_ANSWER } from "@/lib/games/oddOne";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Player, type Room, connectedPlayers } from "@/lib/room/types";

type Props = {
  room: Room;
  state: OddState & ViewerExtras;
  me: Player;
  onAnswer: (text: string) => void;
  onVote: (playerId: string) => void;
};

/**
 * A phone, during Bluff Trivia.
 *
 * Shows this player their question and nobody else's. The one with the decoy
 * is not told they have it — being told would change how they answer, and
 * the point is that they answer naturally and only realise something's off
 * when the answers go up. Then everyone votes for a person, not an answer.
 */
export function OddPlayer({ room, state, me, onAnswer, onVote }: Props) {
  const [text, setText] = useState("");
  useEffect(() => setText(""), [state.round]);

  // A kick when a fresh question lands, and when the votes come in.
  useEffect(() => {
    if (state.phase === "answer") haptic("nudge");
  }, [state.phase, state.round]);
  useEffect(() => {
    if (state.phase !== "reveal") return;
    haptic(state.lastScores[me.id] ? "right" : "wrong");
  }, [state.phase, state.lastScores, me.id]);

  const answered = state.answers[me.id] !== undefined;
  const voted = state.votes[me.id] !== undefined;

  if (state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">{me.score.toLocaleString()} points</p>
        <p className="text-moon-dim">That&apos;s the game. Watch the TV.</p>
      </Centre>
    );
  }

  if (state.phase === "reveal") {
    const scored = state.lastScores[me.id] ?? 0;
    const wasMe = state.oddId === me.id;
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className={["font-display text-3xl uppercase tracking-wide", scored ? "text-emerald-300" : "text-moon-dim"].join(" ")}>
          {scored ? `+${scored}` : "Nothing that time"}
        </p>
        <p className="text-moon-dim">
          {wasMe
            ? state.caught ? "They got you." : "You got away with it."
            : state.caught ? "You found them." : "They slipped past."}
        </p>
        <p className="text-moon-deep">Look up.</p>
      </Centre>
    );
  }

  if (state.phase === "answer") {
    if (answered) {
      return (
        <Centre>
          <p className="text-6xl">{me.emoji}</p>
          <p className="font-display text-xl uppercase tracking-wide text-accent">Locked in</p>
          <p className="text-moon-deep">Waiting for everyone else.</p>
        </Centre>
      );
    }
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-5 p-6">
        <p className="t-label text-center font-display uppercase text-moon-deep">Your question</p>
        <p className="text-balance text-center text-2xl leading-snug text-moon">{state.yourQuestion ?? "…"}</p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && onAnswer(text)}
          placeholder="Your answer"
          autoFocus
          maxLength={ODD_MAX_ANSWER}
          className="field py-5 text-center text-2xl"
        />
        <button onClick={() => text.trim() && onAnswer(text)} disabled={!text.trim()} className="btn-accent w-full py-6 text-2xl">
          Lock it in
        </button>
        <p className="text-center text-sm text-moon-deep">One of you has a different question. Answer like you don&apos;t.</p>
      </main>
    );
  }

  /* ---- vote: everyone who answered, except you ---- */
  const suspects = connectedPlayers(room).filter((p) => p.id !== me.id && state.answers[p.id] !== undefined);
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-3 p-5">
      <p className="t-label text-center font-display uppercase text-moon-deep">
        {voted ? "Vote's in" : "Who had the other question?"}
      </p>
      {suspects.map((p) => {
        const mine = state.votes[me.id] === p.id;
        return (
          <button
            key={p.id}
            onClick={() => { haptic("buzz"); onVote(p.id); }}
            className={["flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors", mine ? "border-accent bg-accent/15" : "border-white/12 bg-white/[0.03] active:bg-white/10"].join(" ")}
          >
            <span className="text-3xl">{p.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xs uppercase tracking-widest text-moon-deep">{p.name}</span>
              <span className="block truncate font-display text-lg uppercase tracking-wide text-moon">{state.answers[p.id]}</span>
            </span>
          </button>
        );
      })}
      <p className="text-center text-sm text-moon-deep">Your own answer was: {state.answers[me.id]}</p>
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">{children}</main>;
}
