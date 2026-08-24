import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { z } from "zod";
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

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY on the server." },
      { status: 503 },
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

  try {
    switch (gameId) {
      case "last-one-standing":
        return NextResponse.json({
          items: await generateStandingQuestions({ themes, count: many(12), difficulty }),
        });
      case "timeline":
        return NextResponse.json({
          items: await generateTimelineRounds({ themes, count: many(6), difficulty }),
        });
      case "dial-it-in":
        return NextResponse.json({
          items: await generateSpectrums({ themes, count: many(8) }),
        });
      case "impostor":
        return NextResponse.json({
          places: await generateImpostorPlaces({ themes, count: 10 }),
        });
      case "code-grid":
        return NextResponse.json({
          words: await generateWordPack({ kind: "grid", themes, count: 30 }),
        });
      case "sketch-and-guess":
        return NextResponse.json({
          words: await generateWordPack({ kind: "sketch", themes, count: many(12) }),
        });
      case "emoji-riddles":
        return NextResponse.json({
          items: await generateEmojiRiddles({ themes, count: many(18), difficulty }),
        });
    }
  } catch (error) {
    console.error(`[content] ${gameId} generation failed:`, error);
    return NextResponse.json({ error: friendlyAiError(error) }, { status: 502 });
  }
}
