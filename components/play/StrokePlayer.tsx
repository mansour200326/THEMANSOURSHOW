"use client";

import { useState } from "react";
import { SketchCanvas } from "@/components/SketchCanvas";
import { type StrokeState, strokeColourFor, strokeDrawer, strokePair } from "@/lib/games/oneStroke";
import { SKETCH_COLOURS } from "@/lib/games/sketch";
import type { ViewerExtras } from "@/lib/room/redact";
import { type Player, type Room, connectedPlayers, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: StrokeState & ViewerExtras;
  me: Player;
  onStroke: (points: number[], colour: number, width: number) => void;
  onLift: () => void;
  onVote: (playerId: string) => void;
  onGuess: (text: string) => void;
};

/**
 * Every phone shows the picture and the category. The artists' phones also
 * show the word; the fake's says so. When it's your line, the canvas takes
 * one stroke and hands the pen on the moment you lift.
 */
export function StrokePlayer({ room, state, me, onStroke, onLift, onVote, onGuess }: Props) {
  const [text, setText] = useState("");
  const drawerId = strokeDrawer(state);
  const myTurn = drawerId === me.id;
  const pair = strokePair(state);
  const colour = strokeColourFor(state, me.id);

  if (state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">{me.score.toLocaleString()} points</p>
      </Centre>
    );
  }

  if (state.phase === "reveal") {
    const scored = state.lastScores[me.id] ?? 0;
    const fake = playerById(room, state.fakeId ?? undefined);
    return (
      <Centre>
        <p className="font-display text-sm uppercase tracking-[0.25em] text-moon-deep">It was</p>
        <p className="accent-text font-display text-4xl uppercase">{pair?.word}</p>
        <p className="text-moon-dim">
          {fake?.emoji} {fake?.name} was the fake{state.fakeWon ? " — and won it" : ""}
        </p>
        <p className={["font-display text-2xl uppercase tracking-wide", scored ? "text-emerald-300" : "text-moon-dim"].join(" ")}>
          {scored ? `+${scored}` : "Nothing that time"}
        </p>
      </Centre>
    );
  }

  const secret = state.youAreFake ? (
    <p className="font-display text-2xl uppercase tracking-wide text-rose-300">You&apos;re the fake — bluff it</p>
  ) : (
    <p className="accent-text font-display text-3xl uppercase">{state.yourWord}</p>
  );

  if (state.phase === "guess") {
    if (!state.youAreFake) {
      return (
        <Centre>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-moon-deep">Caught</p>
          <p className="text-moon-dim">The fake gets one guess at the word. Say nothing.</p>
        </Centre>
      );
    }
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-4 p-6">
        <p className="text-center font-display text-sm uppercase tracking-[0.25em] text-moon-deep">
          They got you. One guess: what was the {pair?.category.toLowerCase()}?
        </p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) onGuess(text); }}
          placeholder="Your guess"
          autoFocus
          maxLength={40}
          className="field py-5 text-center text-2xl"
        />
        <button onClick={() => text.trim() && onGuess(text)} disabled={!text.trim()} className="btn-accent w-full py-6 text-2xl">
          Guess
        </button>
      </main>
    );
  }

  if (state.phase === "vote") {
    const mine = state.votes[me.id];
    const others = connectedPlayers(room).filter((p) => p.id !== me.id);
    return (
      <main className="flex min-h-dvh flex-col gap-4 p-5">
        <SketchCanvas strokes={state.strokes} live={state.live} className="mx-auto w-3/4" />
        <p className="text-center font-display text-lg uppercase tracking-wide text-moon">
          {mine ? "Vote in — look at the TV" : "Who was faking it?"}
        </p>
        {!mine && (
          <div className="grid grid-cols-2 gap-2">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => onVote(p.id)}
                className="flex items-center gap-2 rounded-xl border border-line/15 bg-line/[0.04] px-4 py-4 text-left font-display text-lg uppercase tracking-wide text-moon active:border-accent/70"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SKETCH_COLOURS[strokeColourFor(state, p.id)] }} />
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  /* draw */
  const drawer = playerById(room, drawerId ?? undefined);
  return (
    <main className="flex min-h-dvh flex-col gap-3 p-4">
      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-moon-deep">{pair?.category}</p>
        {secret}
      </div>
      <SketchCanvas
        strokes={state.strokes}
        live={state.live}
        colour={colour}
        width={1}
        onStroke={myTurn ? onStroke : undefined}
        onLift={myTurn ? onLift : undefined}
        className="w-full"
      />
      <p className="text-center font-display text-sm uppercase tracking-[0.2em] text-moon-dim">
        {myTurn ? (
          <span className="text-accent">Your line — one stroke, then lift</span>
        ) : (
          <>
            <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: SKETCH_COLOURS[drawerId ? strokeColourFor(state, drawerId) : 0] }} />
            {drawer?.name} is drawing
          </>
        )}
      </p>
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
