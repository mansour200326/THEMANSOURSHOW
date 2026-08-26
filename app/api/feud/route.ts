import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { serveContent } from "@/lib/library/serve";
import { currentHost } from "@/lib/plan/host";
import { GATE_COPY, canPlay } from "@/lib/plan/limits";
import { z } from "zod";
import { generateFeudPack, friendlyAiError, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const RequestSchema = z.object({
  themes: z.array(z.string().max(80)).max(6).optional(),
  rounds: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  // Public URL, no accounts, our API key. See lib/rateLimit.ts.
  const limit = rateLimit(`feud:${callerKey(request)}`, 20, 60 * 60 * 1000);
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

  const parsed = RequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const host = await currentHost();
  if (!canPlay(host.plan, "face-off")) {
    return NextResponse.json(
      { error: GATE_COPY.game.line, gate: "game" },
      { status: 402 },
    );
  }

  const themes = parsed.data.themes ?? [];
  const rounds = parsed.data.rounds ?? 5;

  try {
    const served = await serveContent({
      gameType: "face-off",
      themes,
      // Round count is part of what was asked for — a five-round pack is not
      // a ten-round one, even about the same subject.
      difficulty: `survey:${rounds}`,
      host,
      canWrite: hasApiKey,
      write: () => generateFeudPack({ themes, rounds }),
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
      questions: served.content,
      boardId: served.boardId,
    });
  } catch (error) {
    const message = friendlyAiError(error);
    console.error("[feud] generation failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
