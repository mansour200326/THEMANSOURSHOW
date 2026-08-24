"use client";

import { useState } from "react";
import { SketchCanvas } from "@/components/SketchCanvas";
import { SKETCH_COLOURS, type SketchState } from "@/lib/games/sketch";
import type { ViewerExtras } from "@/lib/room/redact";
import type { Player } from "@/lib/room/types";

type Props = {
  state: SketchState & ViewerExtras;
  me: Player;
  onStroke: (points: number[], colour: number) => void;
  onLift: () => void;
  onUndo: () => void;
  onClear: () => void;
  onGuess: (text: string) => void;
};

export function SketchPlayer({
  state,
  me,
  onStroke,
  onLift,
  onUndo,
  onClear,
  onGuess,
}: Props) {
  const [text, setText] = useState("");
  const [colour, setColour] = useState(0);
  const drawing = state.drawerId === me.id;

  if (state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">
          {me.score.toLocaleString()} points
        </p>
      </Centre>
    );
  }

  if (state.phase === "reveal") {
    const scored = state.lastScores[me.id] ?? 0;
    return (
      <Centre>
        <p className="font-display text-sm uppercase tracking-[0.25em] text-moon-deep">
          It was
        </p>
        <p className="accent-text font-display text-4xl uppercase">
          {state.words[state.round]}
        </p>
        <p
          className={[
            "font-display text-2xl uppercase tracking-wide",
            scored ? "text-emerald-300" : "text-moon-dim",
          ].join(" ")}
        >
          {scored ? `+${scored}` : "Nothing that time"}
        </p>
      </Centre>
    );
  }

  if (drawing) {
    return (
      <main className="flex min-h-dvh flex-col gap-3 p-4">
        <div className="text-center">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-moon-deep">
            Draw this — no letters, no numbers
          </p>
          <p className="accent-text font-display text-3xl uppercase">
            {state.yourWord}
          </p>
        </div>
        <SketchCanvas
          strokes={state.strokes}
          live={state.live}
          colour={colour}
          onStroke={onStroke}
          onLift={onLift}
          className="w-full"
        />

        {/* Big enough to hit with a thumb while the clock is running. */}
        <div className="grid grid-cols-6 gap-2">
          {SKETCH_COLOURS.map((hex, i) => (
            <button
              key={hex}
              type="button"
              onClick={() => setColour(i)}
              aria-label={`Colour ${i + 1}`}
              aria-pressed={colour === i}
              className={[
                "h-11 rounded-full border-2 transition-transform",
                colour === i
                  ? "scale-110 border-moon shadow-glow"
                  : "border-white/20 active:scale-95",
              ].join(" ")}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>

        <div className="mt-auto flex gap-2">
          <button onClick={onUndo} className="btn-ghost flex-1 py-4">
            Undo
          </button>
          <button onClick={onClear} className="btn-ghost flex-1 py-4">
            Clear
          </button>
        </div>
      </main>
    );
  }

  if (state.solved.includes(me.id)) {
    const place = state.solved.indexOf(me.id) + 1;
    return (
      <Centre>
        <p className="text-6xl">🎉</p>
        <p className="font-display text-3xl uppercase tracking-wide text-emerald-300">
          Got it — #{place}
        </p>
        <p className="text-moon-deep">Don&apos;t say it out loud.</p>
      </Centre>
    );
  }

  const mine = state.guesses[me.id] ?? [];

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-6">
      <p className="text-center text-moon-dim">What is it?</p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) {
            onGuess(text);
            setText("");
          }
        }}
        placeholder="Type a guess"
        autoFocus
        maxLength={40}
        className="field py-5 text-center text-2xl"
      />
      <button
        onClick={() => {
          if (!text.trim()) return;
          onGuess(text);
          setText("");
        }}
        disabled={!text.trim()}
        className="btn-accent w-full py-6 text-2xl"
      >
        Guess
      </button>
      {mine.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {mine.slice(-4).map((g, i) => (
            <span
              key={i}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-moon-deep line-through"
            >
              {g}
            </span>
          ))}
        </div>
      )}
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
