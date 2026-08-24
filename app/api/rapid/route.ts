import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { friendlyAiError, generateRapidPrompts, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 180;

const RequestSchema = z.object({
  mode: z.enum(["categories", "three-in-five"]),
  count: z.number().int().min(1).max(20),
  themes: z.array(z.string().max(80)).max(6).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export async function POST(request: Request) {
  // Public URL, no accounts, our API key. See lib/rateLimit.ts.
  const limit = rateLimit(`rapid:${callerKey(request)}`, 30, 60 * 60 * 1000);
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
    const prompts = await generateRapidPrompts(parsed.data);
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("[rapid] generation failed:", error);
    return NextResponse.json({ error: friendlyAiError(error) }, { status: 502 });
  }
}
