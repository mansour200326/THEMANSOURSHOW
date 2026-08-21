import { NextResponse } from "next/server";
import { z } from "zod";
import { hasApiKey, judgeGuess } from "@/lib/ai";

export const runtime = "nodejs";
/** A host is stood there waiting — give up rather than hang the room. */
export const maxDuration = 20;

const RequestSchema = z.object({
  question: z.string().max(300),
  guess: z.string().max(120),
  options: z
    .array(z.object({ index: z.number().int().min(0).max(15), text: z.string().max(120) }))
    .min(1)
    .max(8),
});

/**
 * "Does what they said mean one of these?" Answers with the index of the
 * matching answer, or null. `judged: false` means we couldn't ask — the board
 * falls back to its own string matching rather than eating a strike over it.
 */
export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json({ index: null, judged: false });
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
    const index = await judgeGuess(parsed.data);
    return NextResponse.json({ index, judged: true });
  } catch (error) {
    console.error("[feud] judging failed:", error);
    return NextResponse.json({ index: null, judged: false });
  }
}
