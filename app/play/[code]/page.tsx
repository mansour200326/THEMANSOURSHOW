"use client";

import { use, useEffect, useState } from "react";
import { RoundPlayer } from "@/components/play/RoundPlayer";
import type { RoundState } from "@/lib/games/roundEngine";
import { useRoom } from "@/lib/room/useRoom";

/** Survives a refresh or a phone locking itself, so you keep your score. */
const idKey = (code: string) => `parlour:player:${code}`;

export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();
  const { room, status, send } = useRoom(roomCode);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setPlayerId(window.localStorage.getItem(idKey(roomCode)));
  }, [roomCode]);

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
        <h1 className="font-display text-2xl uppercase text-slate-200">
          No room called {roomCode}
        </h1>
        <p className="text-slate-400">
          Check the code on the TV — it might have been restarted.
        </p>
      </Centered>
    );
  }

  if (!room) {
    return (
      <Centered>
        <p className="font-display uppercase tracking-[0.25em] text-slate-500">
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
          <p className="font-display text-xs uppercase tracking-[0.3em] text-slate-500">
            Room
          </p>
          <p className="cream-text font-display text-6xl font-bold tracking-[0.1em]">
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
          className="btn-cream w-full py-6 text-2xl"
        >
          Join
        </button>
      </div>
    );
  }

  const state = room.game as RoundState | null;

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
      <h1 className="font-display text-3xl uppercase tracking-wide text-slate-100">
        {me.name}
      </h1>
      <p className="text-slate-400">You&apos;re in. Watch the TV.</p>
      <p className="font-display text-sm uppercase tracking-widest text-cream">
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
