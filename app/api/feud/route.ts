import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFeudPack, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const RequestSchema = z.object({
  theme: z.string().max(200).optional(),
  rounds: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "No ANTHROPIC_API_KEY on the server. Add it to .env.local and restart — or play the sample pack.",
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

  const parsed = RequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const questions = await generateFeudPack({
      theme: parsed.data.theme ?? "",
      rounds: parsed.data.rounds ?? 5,
    });
    return NextResponse.json({ questions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The generator fell over.";
    console.error("[feud] generation failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
