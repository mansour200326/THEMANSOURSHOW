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
  const { gameId, themes = [], difficulty = "medium" } = parsed.data;

  try {
    switch (gameId) {
      case "last-one-standing":
        return NextResponse.json({
          items: await generateStandingQuestions({ themes, count: 12, difficulty }),
        });
      case "timeline":
        return NextResponse.json({
          items: await generateTimelineRounds({ themes, count: 6, difficulty }),
        });
      case "dial-it-in":
        return NextResponse.json({
          items: await generateSpectrums({ themes, count: 8 }),
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
          words: await generateWordPack({ kind: "sketch", themes, count: 12 }),
        });
      case "emoji-riddles":
        return NextResponse.json({
          items: await generateEmojiRiddles({ themes, count: 18, difficulty }),
        });
    }
  } catch (error) {
    console.error(`[content] ${gameId} generation failed:`, error);
    return NextResponse.json({ error: friendlyAiError(error) }, { status: 502 });
  }
}
