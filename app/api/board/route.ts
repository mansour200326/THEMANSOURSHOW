import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { generateTriviaBoard, friendlyAiError, hasApiKey } from "@/lib/ai";

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

  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "No ANTHROPIC_API_KEY on the server. Add it to .env.local and restart the dev server — or play the sample board.",
      },
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

  try {
    const result = await generateTriviaBoard({
      categories,
      vibe: parsed.data.vibe,
      difficulty: parsed.data.difficulty,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = friendlyAiError(error);
    console.error("[board] generation failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
