"use client";

import { useEffect, useState } from "react";
import {
  type LiveState,
  liveCurrent,
  liveShuffledEvents,
} from "@/lib/games/liveEngine";
import type { Player } from "@/lib/room/types";

type Props = {
  state: LiveState;
  me: Player;
  onSubmit: (text: string) => void;
  onClue: (text: string) => void;
};

/**
 * The same countdown the TV is showing. Answering under time pressure only
 * works if the person answering can see the pressure.
 */
function useCountdown(startedAt: number | null, seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!startedAt || !seconds) {
      setLeft(seconds);
      return;
    }
    const tick = () =>
      setLeft(Math.max(0, seconds - (Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [startedAt, seconds]);
  return left;
}

function Clock({ left, seconds }: { left: number; seconds: number }) {
  if (!seconds) return null;
  const fraction = Math.max(0, Math.min(1, left / seconds));
  const urgent = left <= 5;
  return (
    <div className="mb-1">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-200 ease-linear",
            urgent ? "bg-rose-400" : "bg-accent",
          ].join(" ")}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <p
        className={[
          "mt-1 text-center font-display text-sm tabular-nums",
          urgent ? "text-rose-400" : "text-moon-deep",
        ].join(" ")}
      >
        {Math.ceil(left)}s
      </p>
    </div>
  );
}

export function LivePlayer({ state, me, onSubmit, onClue }: Props) {
  const item = liveCurrent(state);
  const left = useCountdown(state.startedAt, state.seconds);
  const clock = <Clock left={left} seconds={state.seconds} />;
  const benched = state.benched.includes(me.id);
  const submitted = state.answers[me.id] !== undefined;
  const leading = state.lead === me.id;

  if (state.phase === "done") {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-2xl uppercase tracking-wide text-moon">
          {me.score.toLocaleString()} points
        </p>
        <p className="text-moon-dim">That&apos;s the segment. Watch the TV.</p>
      </Centre>
    );
  }

  if (benched) {
    return (
      <Centre>
        <p className="text-6xl opacity-40">{me.emoji}</p>
        <p className="font-display text-xl uppercase tracking-wide text-moon-dim">
          You&apos;re on the bench
        </p>
        <p className="text-moon-deep">Heckling is still allowed.</p>
      </Centre>
    );
  }

  if (state.phase === "reveal") {
    const scored = state.lastScores[me.id] ?? 0;
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p
          className={[
            "font-display text-3xl uppercase tracking-wide",
            scored ? "text-emerald-300" : "text-moon-dim",
          ].join(" ")}
        >
          {scored ? `+${scored}` : "Nothing that time"}
        </p>
        <p className="text-moon-deep">Look up.</p>
      </Centre>
    );
  }

  /* ---- Dial It In: the clue-giver sees the target ---- */
  if (state.variant === "dial" && leading) {
    if (state.phase === "brief") {
      return (
        <ClueBox
          left={item?.left ?? ""}
          right={item?.right ?? ""}
          target={item?.target ?? 50}
          clock={clock}
          onSend={onClue}
        />
      );
    }
    return (
      <Centre>
        <p className="font-display text-xl uppercase tracking-wide text-accent">
          “{state.clue}”
        </p>
        <p className="text-moon-dim">
          That&apos;s all you get to say. No pointing.
        </p>
      </Centre>
    );
  }

  if (submitted) {
    return (
      <Centre>
        <p className="text-6xl">{me.emoji}</p>
        <p className="font-display text-xl uppercase tracking-wide text-accent">
          Locked in
        </p>
        <p className="text-moon-deep">Waiting for everyone else.</p>
      </Centre>
    );
  }

  if (state.variant === "standing") {
    return <AnswerBox prompt={item?.prompt ?? ""} clock={clock} onSend={onSubmit} />;
  }

  if (state.variant === "timeline") {
    return (
      <OrderBox
        events={liveShuffledEvents(state)}
        shuffled={state.shuffled}
        clock={clock}
        onSend={onSubmit}
      />
    );
  }

  return (
    <DialBox
      left={item?.left ?? ""}
      right={item?.right ?? ""}
      clue={state.clue}
      clock={clock}
      onSend={onSubmit}
    />
  );
}

/* ------------------------------------------------------------- pieces */

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}

function AnswerBox({
  prompt,
  clock,
  onSend,
}: {
  prompt: string;
  clock: React.ReactNode;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-5 p-6">
      {clock}
      <p className="text-center text-lg text-moon/75">{prompt}</p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && text.trim() && onSend(text)}
        placeholder="Your answer"
        autoFocus
        maxLength={60}
        className="field py-5 text-center text-2xl"
      />
      <button
        onClick={() => text.trim() && onSend(text)}
        disabled={!text.trim()}
        className="btn-accent w-full py-6 text-2xl"
      >
        Lock it in
      </button>
    </main>
  );
}

/**
 * Tap the events in the order you think they happened. Tapping is far kinder
 * than dragging on a phone, and it's the same number of touches.
 */
function OrderBox({
  events,
  shuffled,
  clock,
  onSend,
}: {
  events: string[];
  shuffled: number[];
  clock: React.ReactNode;
  onSend: (text: string) => void;
}) {
  const [order, setOrder] = useState<number[]>([]);

  const toggle = (position: number) =>
    setOrder((o) =>
      o.includes(position) ? o.filter((p) => p !== position) : [...o, position],
    );

  const done = order.length === events.length;

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-5">
      {clock}
      <p className="text-center text-moon-dim">
        Tap them in order — earliest first.
      </p>
      <div className="flex flex-col gap-2.5">
        {events.map((event, position) => {
          const place = order.indexOf(position);
          return (
            <button
              key={position}
              onClick={() => toggle(position)}
              className={[
                "flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                place >= 0
                  ? "border-accent/70 bg-accent/15 text-moon"
                  : "border-white/12 bg-white/[0.03] text-moon/75",
              ].join(" ")}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 font-display tabular-nums">
                {place >= 0 ? place + 1 : ""}
              </span>
              <span className="text-base leading-snug">{event}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() =>
          // Send the true event indices, in the order they were tapped.
          onSend(order.map((position) => shuffled[position]).join(","))
        }
        disabled={!done}
        className="btn-accent w-full py-5 text-xl"
      >
        {done ? "Lock it in" : `${order.length}/${events.length} placed`}
      </button>
    </main>
  );
}

function ClueBox({
  left,
  right,
  target,
  clock,
  onSend,
}: {
  left: string;
  right: string;
  target: number;
  clock: React.ReactNode;
  onSend: (text: string) => void;
}) {
  const [clue, setClue] = useState("");
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-5 p-6">
      {clock}
      <p className="text-center font-display uppercase tracking-widest text-accent">
        Only you can see this
      </p>
      <Spectrum left={left} right={right} marker={target} />
      <input
        value={clue}
        onChange={(e) => setClue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && clue.trim() && onSend(clue)}
        placeholder="One clue…"
        autoFocus
        maxLength={40}
        className="field py-5 text-center text-2xl"
      />
      <button
        onClick={() => clue.trim() && onSend(clue)}
        disabled={!clue.trim()}
        className="btn-accent w-full py-6 text-2xl"
      >
        Say it
      </button>
    </main>
  );
}

function DialBox({
  left,
  right,
  clue,
  clock,
  onSend,
}: {
  left: string;
  right: string;
  clue: string;
  clock: React.ReactNode;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState(50);
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 p-6">
      {clock}
      <p className="text-center font-display text-2xl uppercase tracking-wide text-accent">
        “{clue}”
      </p>
      <Spectrum left={left} right={right} marker={value} />
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-12 w-full accent-[rgb(var(--accent-rgb))]"
        aria-label="Where on the spectrum"
      />
      <button
        onClick={() => onSend(String(value))}
        className="btn-accent w-full py-6 text-2xl"
      >
        Lock it in
      </button>
    </main>
  );
}

function Spectrum({
  left,
  right,
  marker,
}: {
  left: string;
  right: string;
  marker: number;
}) {
  return (
    <div>
      <div className="flex justify-between font-display text-xs uppercase tracking-widest text-moon-dim">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="relative mt-2 h-14 overflow-hidden rounded-full border border-white/10 bg-gradient-to-r from-dusk via-dusk-lit to-dusk">
        <div
          className="absolute inset-y-0 w-[4px] -translate-x-1/2 bg-accent"
          style={{ left: `${marker}%` }}
        />
      </div>
    </div>
  );
}
