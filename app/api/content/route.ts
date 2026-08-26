import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { serveContent } from "@/lib/library/serve";
import { currentHost } from "@/lib/plan/host";
import { GATE_COPY, canPlay } from "@/lib/plan/limits";
import { z } from "zod";
import type { Written } from "@/lib/ai";
import {
  friendlyAiError,
  generateEmojiRiddles,
  generateImpostorPlaces,
  generateSpectrums,
  generateStandingQuestions,
  generateTimelineRounds,
  generateWordPack,
  hasApiKey,
} from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const RequestSchema = z.object({
  gameId: z.enum([
    "last-one-standing",
    "timeline",
    "dial-it-in",
    "impostor",
    "code-grid",
    "sketch-and-guess",
    "emoji-riddles",
  ]),
  themes: z.array(z.string().max(80)).max(6).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  /** How many rounds the host chose, so the pack is written to fit. */
  rounds: z.number().int().min(1).max(30).optional(),
});

/**
 * One endpoint for the room games that write their own content. Each returns
 * the slot its engine reads — items, places or words — which is what
 * `game:start` carries through to init.
 */
export async function POST(request: Request) {
  // Public URL, no accounts, our API key. See lib/rateLimit.ts.
  const limit = rateLimit(`content:${callerKey(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That's a lot of writing in one hour. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const { gameId, themes = [], difficulty = "medium", rounds } = parsed.data;

  /*
   * Write as much as the host asked to play, not a fixed number. These used
   * to be hardcoded, so choosing six rounds still paid for twelve questions
   * and choosing twelve quietly got you six.
   */
  const many = (fallback: number) =>
    rounds && rounds > 0 ? Math.min(30, Math.max(3, rounds)) : fallback;

  const host = await currentHost();
  if (!canPlay(host.plan, gameId)) {
    return NextResponse.json(
      { error: GATE_COPY.game.line, gate: "game" },
      { status: 402 },
    );
  }

  /*
   * Which generator writes this game, and what the result is called on the
   * way back. The key matters: the client already destructures `items`,
   * `places` or `words`, and the library shouldn't change that.
   */
  const writers: Record<
    string,
    { key: "items" | "places" | "words"; write: () => Promise<Written<unknown>> }
  > = {
    "last-one-standing": {
      key: "items",
      write: () => generateStandingQuestions({ themes, count: many(12), difficulty }),
    },
    timeline: {
      key: "items",
      write: () => generateTimelineRounds({ themes, count: many(6), difficulty }),
    },
    "dial-it-in": {
      key: "items",
      write: () => generateSpectrums({ themes, count: many(8) }),
    },
    impostor: {
      key: "places",
      write: () => generateImpostorPlaces({ themes, count: 10 }),
    },
    "code-grid": {
      key: "words",
      write: () => generateWordPack({ kind: "grid", themes, count: 30 }),
    },
    "sketch-and-guess": {
      key: "words",
      write: () => generateWordPack({ kind: "sketch", themes, count: many(12) }),
    },
    "emoji-riddles": {
      key: "items",
      write: () => generateEmojiRiddles({ themes, count: many(18), difficulty }),
    },
  };

  const writer = writers[gameId];
  if (!writer) {
    return NextResponse.json({ error: "Unknown game." }, { status: 400 });
  }

  try {
    // Library first, model only for what isn't already written. The round
    // count is part of the key by way of the theme: a six-round pack and a
    // twelve-round one are different content for the same theme, so the
    // count rides along in the difficulty slot rather than silently serving
    // somebody the wrong length.
    const served = await serveContent({
      gameType: gameId,
      themes,
      difficulty: `${difficulty}:${rounds ?? "default"}`,
      host,
      canWrite: hasApiKey,
      write: writer.write,
    });

    if (!served.ok) {
      // Out of allowance is a decision the host can act on; nothing to serve
      // and nothing to write with is a server problem, and they read very
      // differently to whoever is standing in front of the television.
      return served.blocked === "plan"
        ? NextResponse.json(
            { error: GATE_COPY[served.gate].line, gate: served.gate },
            { status: 402 },
          )
        : NextResponse.json(
            {
              error:
                "Nothing written for that yet, and the writing service isn't configured. Try the bundled pack.",
            },
            { status: 503 },
          );
    }

    return NextResponse.json({
      [writer.key]: served.content,
      boardId: served.boardId,
    });
  } catch (error) {
    console.error(`[content] ${gameId} generation failed:`, error);
    return NextResponse.json({ error: friendlyAiError(error) }, { status: 502 });
  }
}
