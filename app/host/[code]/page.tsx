"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import { BuzzHost } from "@/components/host/BuzzHost";
import { GameSetup } from "@/components/host/GameSetup";
import { Lobby } from "@/components/host/Lobby";
import { RoundHost } from "@/components/host/RoundHost";
import type { BuzzState } from "@/lib/games/buzzEngine";
import type { RoundState } from "@/lib/games/roundEngine";
import { useAccentFamily } from "@/components/useAccentFamily";
import { useRoom } from "@/lib/room/useRoom";

export default function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();
  const { room, status, send } = useRoom(roomCode);

  // The screen takes its colour from whatever game is running.
  useAccentFamily(room?.gameId);

  // Games that take categories get a setup step before they start.
  const [setupFor, setSetupFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const NEEDS_SETUP: Record<string, string> = { "trivia-royale": "Trivia Royale" };

  const launch = async (
    gameId: string,
    config: { categories: string[]; difficulty: string },
  ) => {
    setSetupError(null);
    if (config.categories.length < 3) {
      setSetupFor(null);
      send("game:start", { gameId });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: config.categories,
          difficulty: config.difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Board generation failed.");
      setSetupFor(null);
      send("game:start", { gameId, board: data.board });
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : "Board generation failed.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "missing") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide text-moon/90">
          Room {roomCode} is gone
        </h1>
        <p className="max-w-md text-moon-dim">
          Rooms live in the server&apos;s memory, so restarting it clears them.
          Start a fresh one and the phones can rejoin.
        </p>
        <Link href="/" className="btn-brand px-8 py-4 text-lg">
          Host a new room
        </Link>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-display uppercase tracking-[0.25em] text-moon-deep">
          Opening room {roomCode}…
        </p>
      </main>
    );
  }

  if (setupFor) {
    return (
      <GameSetup
        gameName={NEEDS_SETUP[setupFor]}
        busy={busy}
        error={setupError}
        onCancel={() => {
          setSetupFor(null);
          setSetupError(null);
        }}
        onStart={(config) => launch(setupFor, config)}
      />
    );
  }

  if (!room.gameId) {
    return (
      <Lobby
        room={room}
        onStart={(gameId) =>
          NEEDS_SETUP[gameId]
            ? setSetupFor(gameId)
            : send("game:start", { gameId })
        }
        onAddBots={() => send("bots:add")}
        onClearBots={() => send("bots:clear")}
      />
    );
  }

  const state = room.game as (RoundState | BuzzState) | null;

  if (state?.kind === "buzz") {
    return (
      <BuzzHost
        room={room}
        state={state}
        send={(type, payload) => send(type, payload)}
      />
    );
  }

  if (state?.kind === "round") {
    return (
      <RoundHost
        room={room}
        state={state}
        onForce={() => send("force")}
        onNext={() => send("next")}
        onQuit={() => send("game:end")}
      />
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <button onClick={() => send("game:end")} className="btn-ghost">
        Back to the lobby
      </button>
    </main>
  );
}
