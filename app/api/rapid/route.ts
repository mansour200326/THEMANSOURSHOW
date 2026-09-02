import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { answersAlreadySeen } from "@/lib/library/history";
import { serveContent } from "@/lib/library/serve";
import { currentHost } from "@/lib/plan/host";
import { GATE_COPY, canPlay } from "@/lib/plan/limits";
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
  const host = await currentHost();
  if (!canPlay(host.plan, parsed.data.mode)) {
    return NextResponse.json(
      { error: GATE_COPY.game.line, gate: "game" },
      { status: 402 },
    );
  }

  try {
    const served = await serveContent({
      gameType: parsed.data.mode,
      themes: parsed.data.themes ?? [],
      difficulty: `${parsed.data.difficulty ?? "medium"}:${parsed.data.count}`,
      host,
      canWrite: hasApiKey,
      write: async () =>
        generateRapidPrompts({
          ...parsed.data,
          avoid: await answersAlreadySeen(host, parsed.data.mode),
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

    return NextResponse.json({
      prompts: served.content,
      boardId: served.boardId,
    });
  } catch (error) {
    console.error("[rapid] generation failed:", error);
    return NextResponse.json({ error: friendlyAiError(error) }, { status: 502 });
  }
}
