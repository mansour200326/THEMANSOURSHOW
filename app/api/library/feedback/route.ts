import { NextResponse } from "next/server";
import { z } from "zod";
import { markCompleted, markSkipped } from "@/lib/library";
import { callerKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * How a board did.
 *
 * Two signals, both cheap and both honest: it was played to the end, or it
 * was thrown away. Neither asks the host a question — a rating prompt in the
 * middle of a party is a thing people close, and the answer you'd get from
 * the ones who didn't would be worthless anyway.
 *
 * Nothing here is authenticated. The worst somebody can do is skew the
 * ranking of a trivia board, which is not worth a session lookup on a path
 * that fires at the end of every round.
 */
const RequestSchema = z.object({
  boardId: z.string().uuid(),
  outcome: z.enum(["completed", "skipped"]),
});

export async function POST(request: Request) {
  const limit = rateLimit(`feedback:${callerKey(request)}`, 600, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  if (parsed.data.outcome === "completed") {
    await markCompleted(parsed.data.boardId);
  } else {
    await markSkipped(parsed.data.boardId);
  }
  return NextResponse.json({ ok: true });
}
