import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { generateCategoryIdeas, friendlyAiError, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const RequestSchema = z.object({
  count: z.number().int().min(1).max(6),
  hint: z.string().max(200).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(request: Request) {
  // Public URL, no accounts, our API key. See lib/rateLimit.ts.
  const limit = rateLimit(`categories:${callerKey(request)}`, 40, 60 * 60 * 1000);
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
  try {
    const categories = await generateCategoryIdeas(parsed.data);
    return NextResponse.json({ categories });
  } catch (error) {
    const message = friendlyAiError(error);
    console.error("[categories] failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
