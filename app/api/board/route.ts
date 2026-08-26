import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { generateTriviaBoard, friendlyAiError, hasApiKey } from "@/lib/ai";
import { serveContent } from "@/lib/library/serve";
import { currentHost } from "@/lib/plan/host";
import { GATE_COPY, canPlay } from "@/lib/plan/limits";

export const runtime = "nodejs";
/** Board generation is slow by web standards — give it room on Vercel. */
export const maxDuration = 300;

const RequestSchema = z.object({
  categories: z.array(z.string()).min(3).max(6),
  vibe: z.string().max(300).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(request: Request) {
  // Public URL, no accounts, our API key. See lib/rateLimit.ts.
  const limit = rateLimit(`board:${callerKey(request)}`, 20, 60 * 60 * 1000);
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
    return NextResponse.json(
      { error: "Give me between 3 and 6 categories." },
      { status: 400 },
    );
  }

  const categories = parsed.data.categories
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (categories.length < 3) {
    return NextResponse.json(
      { error: "Give me at least 3 categories." },
      { status: 400 },
    );
  }

  const host = await currentHost();
  if (!canPlay(host.plan, "trivia-royale")) {
    return NextResponse.json(
      { error: GATE_COPY.game.line, gate: "game" },
      { status: 402 },
    );
  }

  try {
    // The library answers first; the model only writes what isn't on the
    // shelf already. See lib/library/serve.ts.
    const served = await serveContent({
      gameType: "trivia-royale",
      themes: categories,
      difficulty: parsed.data.difficulty ?? "medium",
      host,
      canWrite: hasApiKey,
      write: () =>
        generateTriviaBoard({
          categories,
          vibe: parsed.data.vibe,
          difficulty: parsed.data.difficulty,
        }),
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

    // Same shape the client has always received, plus the id it needs to
    // tell us later whether the board was any good.
    return NextResponse.json({ ...served.content, boardId: served.boardId });
  } catch (error) {
    const message = friendlyAiError(error);
    console.error("[board] generation failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
