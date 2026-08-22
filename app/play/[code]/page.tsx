"use client";

import { use, useEffect, useState } from "react";
import { BuzzPlayer } from "@/components/play/BuzzPlayer";
import { GridPlayer } from "@/components/play/GridPlayer";
import { ImpostorPlayer } from "@/components/play/ImpostorPlayer";
import { LivePlayer } from "@/components/play/LivePlayer";
import { SketchPlayer } from "@/components/play/SketchPlayer";
import { RoundPlayer } from "@/components/play/RoundPlayer";
import type { BuzzState } from "@/lib/games/buzzEngine";
import type { CodeGridState } from "@/lib/games/codegrid";
import type { ImpostorState } from "@/lib/games/impostor";
import type { LiveState } from "@/lib/games/liveEngine";
import type { RoundState } from "@/lib/games/roundEngine";
import type { SketchState } from "@/lib/games/sketch";
import type { ViewerExtras } from "@/lib/room/redact";
import { useAccentFamily } from "@/components/useAccentFamily";
import { useRoom } from "@/lib/room/useRoom";

/** Survives a refresh or a phone locking itself, so you keep your score. */
const idKey = (code: string) => `bignight:player:${code}`;

export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setPlayerId(window.localStorage.getItem(idKey(roomCode)));
  }, [roomCode]);

  // Saying who we are is what lets the server strip the other players'
  // secrets before they ever reach this phone.
  const { room, status, send } = useRoom(roomCode, playerId);

  // The screen takes its colour from whatever game is running.
  useAccentFamily(room?.gameId);

  // Rejoin automatically once the stream is live (covers refresh + reconnect).
  useEffect(() => {
    if (playerId && room && status === "open") {
      const known = room.players.find((p) => p.id === playerId);
      if (known && !known.connected) {
        send("player:join", { id: playerId, name: known.name });
      }
    }
  }, [playerId, room, status, send]);

  const join = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    window.localStorage.setItem(idKey(roomCode), id);
    setPlayerId(id);
    send("player:join", { id, name: trimmed });
  };

  if (status === "missing") {
    return (
      <Centered>
        <h1 className="font-display text-2xl uppercase text-moon/90">
          No room called {roomCode}
        </h1>
        <p className="text-moon-dim">
          Check the code on the TV — it might have been restarted.
        </p>
      </Centered>
    );
  }

  if (!room) {
    return (
      <Centered>
        <p className="font-display uppercase tracking-[0.25em] text-moon-deep">
          Connecting…
        </p>
      </Centered>
    );
  }

  const me = room.players.find((p) => p.id === playerId);

  if (!me) {
    return (
      <div className="flex min-h-dvh flex-col justify-center gap-6 p-6">
        <div className="text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-moon-deep">
            Room
          </p>
          <p className="accent-text font-display text-6xl font-bold tracking-[0.1em]">
            {roomCode}
          </p>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Your name"
          maxLength={14}
          autoFocus
          className="field text-center text-2xl"
        />
        <button
          onClick={join}
          disabled={!name.trim()}
          className="btn-accent w-full py-6 text-2xl"
        >
          Join
        </button>
      </div>
    );
  }

  const state = room.game as
    | ((
        | RoundState
        | BuzzState
        | LiveState
        | ImpostorState
        | CodeGridState
        | SketchState
      ) &
        ViewerExtras)
    | null;

  if (room.gameId && state?.kind === "buzz") {
    return (
      <BuzzPlayer
        room={room}
        state={state}
        me={me}
        onBuzz={() => send("buzz", undefined, me.id)}
        onPick={(c, r) => send("pick", { c, r }, me.id)}
      />
    );
  }

  if (room.gameId && state?.kind === "live") {
    return (
      <LivePlayer
        state={state}
        me={me}
        onSubmit={(text) => send("submit", { text }, me.id)}
        onClue={(text) => send("clue", { text }, me.id)}
      />
    );
  }

  if (room.gameId && state?.kind === "impostor") {
    return (
      <ImpostorPlayer
        room={room}
        state={state}
        me={me}
        onReady={() => send("ready", undefined, me.id)}
        onAccuse={() => send("accuse", undefined, me.id)}
        onVote={(playerId) => send("vote", { playerId }, me.id)}
        onGuessPlace={(placeIndex) => send("guess", { placeIndex }, me.id)}
      />
    );
  }

  if (room.gameId && state?.kind === "grid") {
    return (
      <GridPlayer
        state={state}
        me={me}
        onClue={(word, count) => send("clue", { word, count }, me.id)}
        onTap={(index) => send("tap", { index }, me.id)}
        onPass={() => send("pass", undefined, me.id)}
      />
    );
  }

  if (room.gameId && state?.kind === "sketch") {
    return (
      <SketchPlayer
        state={state}
        me={me}
        onStroke={(points) => send("draw", { points }, me.id)}
        onLift={() => send("lift", undefined, me.id)}
        onUndo={() => send("undo", undefined, me.id)}
        onClear={() => send("clear", undefined, me.id)}
        onGuess={(text) => send("guess", { text }, me.id)}
      />
    );
  }

  if (room.gameId && state?.kind === "round") {
    return (
      <RoundPlayer
        room={room}
        state={state}
        me={me}
        onSubmit={(text) => send("submit", { text }, me.id)}
        onVote={(optionId) => send("vote", { optionId }, me.id)}
      />
    );
  }

  return (
    <Centered>
      <p className="text-6xl">{me.emoji}</p>
      <h1 className="font-display text-3xl uppercase tracking-wide text-moon">
        {me.name}
      </h1>
      <p className="text-moon-dim">You&apos;re in. Watch the TV.</p>
      <p className="font-display text-sm uppercase tracking-widest text-accent">
        {me.score.toLocaleString()} points
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
