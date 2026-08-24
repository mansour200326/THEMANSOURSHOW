"use client";

import { use } from "react";
import Link from "next/link";
import { useRef, useState } from "react";
import { BuzzHost } from "@/components/host/BuzzHost";
import { GridHost } from "@/components/host/GridHost";
import { ImpostorHost } from "@/components/host/ImpostorHost";
import { LiveHost } from "@/components/host/LiveHost";
import { SketchHost } from "@/components/host/SketchHost";
import { GameSetup } from "@/components/host/GameSetup";
import { RoomCodeChip } from "@/components/host/RoomCodeChip";
import { Generating } from "@/components/Generating";
import { HowToPlay } from "@/components/HowToPlay";
import { PackWorkshop } from "@/components/packs/PackWorkshop";
import { packToStartPayload } from "@/lib/packs/convert";
import { Lobby } from "@/components/host/Lobby";
import { RoundHost } from "@/components/host/RoundHost";
import type { BuzzState } from "@/lib/games/buzzEngine";
import type { CodeGridState } from "@/lib/games/codegrid";
import type { ImpostorState } from "@/lib/games/impostor";
import type { LiveState } from "@/lib/games/liveEngine";
import type { RoundState } from "@/lib/games/roundEngine";
import type { SketchState } from "@/lib/games/sketch";
import { useAccentFamily } from "@/components/useAccentFamily";
import { games } from "@/lib/games/registry";
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

  // Every game explains itself first; some then ask what they're about.
  const [explaining, setExplaining] = useState<string | null>(null);
  const [setupFor, setSetupFor] = useState<string | null>(null);
  /** Set while the host is writing their own content for a game. */
  const [writingFor, setWritingFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** The themes being written from, for the loading screen. */
  const [writingThemes, setWritingThemes] = useState<string[]>([]);
  const writingAbort = useRef<AbortController | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  /** Games that ask what they should be about before they start. */
  const NEEDS_SETUP: Record<string, string> = {
    "trivia-royale": "Trivia Royale",
    "last-one-standing": "Last One Standing",
    timeline: "Timeline",
    "dial-it-in": "Dial It In",
    impostor: "Impostor",
    "code-grid": "Code Grid",
    "sketch-and-guess": "Sketch & Guess",
    "emoji-riddles": "Emoji Riddles",
  };

  const launch = async (
    gameId: string,
    config: { categories: string[]; difficulty: string; minutes?: number },
  ) => {
    // The round length is a setting, not content — it goes with every start,
    // written pack or not.
    const seconds = config.minutes ? config.minutes * 60 : undefined;
    setSetupError(null);
    // Trivia Royale needs a full board; the rest are happy with their
    // bundled pack if the host doesn't want to wait for a written one.
    const board = gameId === "trivia-royale";
    if (board ? config.categories.length < 3 : config.categories.length === 0) {
      setSetupFor(null);
      send("game:start", { gameId, seconds });
      return;
    }
    setBusy(true);
    setWritingThemes(config.categories);
    const controller = new AbortController();
    writingAbort.current = controller;
    try {
      const res = await fetch(board ? "/api/board" : "/api/content", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          board
            ? { categories: config.categories, difficulty: config.difficulty }
            : {
                gameId,
                themes: config.categories,
                difficulty: config.difficulty,
              },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't write that one.");
      setSetupFor(null);
      send("game:start", {
        gameId,
        board: data.board,
        items: data.items,
        places: data.places,
        words: data.words,
        seconds,
      });
    } catch (e) {
      // A cancel isn't an error worth putting on the TV.
      if (!controller.signal.aborted) {
        setSetupError(e instanceof Error ? e.message : "Couldn't write that one.");
      }
    } finally {
      writingAbort.current = null;
      setBusy(false);
      setWritingThemes([]);
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

  if (busy) {
    return (
      <Generating
        title={`Writing ${setupFor ? NEEDS_SETUP[setupFor] : "it"}`}
        items={writingThemes}
        onCancel={() => {
          // Actually stop the request, rather than just hiding the screen and
          // letting the game start anyway when it lands.
          writingAbort.current?.abort();
          setBusy(false);
        }}
      />
    );
  }

  if (writingFor) {
    return (
      <PackWorkshop
        gameId={writingFor}
        gameName={games[writingFor]?.name ?? "This game"}
        onBack={() => setWritingFor(null)}
        onPlay={(kind, data) => {
          const gameId = writingFor;
          setWritingFor(null);
          send("game:start", {
            gameId,
            ...packToStartPayload(gameId, kind, data),
          });
        }}
      />
    );
  }

  if (explaining) {
    const game = games[explaining];
    return (
      <HowToPlay
        gameId={explaining}
        name={game?.name ?? "Next up"}
        startLabel={NEEDS_SETUP[explaining] ? "Set it up" : "Start the game"}
        onBack={() => setExplaining(null)}
        onWriteOwn={() => {
          const id = explaining;
          setExplaining(null);
          setWritingFor(id);
        }}
        onStart={() => {
          const id = explaining;
          setExplaining(null);
          if (NEEDS_SETUP[id]) setSetupFor(id);
          else send("game:start", { gameId: id });
        }}
      />
    );
  }

  if (setupFor) {
    return (
      <GameSetup
        gameName={NEEDS_SETUP[setupFor]}
        needsBoard={setupFor === "trivia-royale"}
        lengths={setupFor === "impostor" ? [4, 6, 8, 10] : undefined}
        busy={busy}
        error={setupError}
        onCancel={() => {
          setSetupFor(null);
          setSetupError(null);
        }}
        onStart={(config) => launch(setupFor, config)}
        onWriteOwn={() => {
          const id = setupFor;
          setSetupFor(null);
          setWritingFor(id);
        }}
      />
    );
  }

  if (!room.gameId) {
    return (
      <Lobby
        room={room}
        onStart={(gameId) => setExplaining(gameId)}
        onKick={(playerId) => send("player:kick", { id: playerId })}
        onAddBots={() => send("bots:add")}
        onClearBots={() => send("bots:clear")}
      />
    );
  }

  const state = room.game as
    | (RoundState | BuzzState | LiveState | ImpostorState | CodeGridState | SketchState)
    | null;

  const inGame = (() => {
    if (state?.kind === "buzz") {
      return (
        <BuzzHost
          room={room}
          state={state}
          send={(type, payload) => send(type, payload)}
        />
      );
    }

    if (state?.kind === "live") {
      return (
        <LiveHost
          room={room}
          state={state}
          onForce={() => send("force")}
          onNext={() => send("next")}
          onQuit={() => send("game:end")}
        />
      );
    }

    if (state?.kind === "impostor") {
      return (
        <ImpostorHost
          room={room}
          state={state}
          onStart={() => send("start")}
          onForce={() => send("force")}
          onTimeUp={() => send("timeup")}
          onNext={() => send("next")}
          onQuit={() => send("game:end")}
        />
      );
    }

    if (state?.kind === "grid") {
      return (
        <GridHost
          room={room}
          state={state}
          onBegin={() => send("begin")}
          onQuit={() => send("game:end")}
        />
      );
    }

    if (state?.kind === "sketch") {
      return (
        <SketchHost
          room={room}
          state={state}
          onTimeUp={() => send("timeup")}
          onNext={() => send("next")}
          onQuit={() => send("game:end")}
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
  })();

  // The code used to vanish the moment a game started, so a phone that died
  // mid-night had no way back into the room.
  return (
    <>
      {inGame}
      <RoomCodeChip code={roomCode} />
    </>
  );
}
