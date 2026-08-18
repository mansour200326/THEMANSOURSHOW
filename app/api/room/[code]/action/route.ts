import { NextResponse } from "next/server";
import { dispatch, getRoom } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Every input from every device funnels through here. Clients never mutate
 * anything themselves — they send an intent, the server decides, and the result
 * comes back to everyone over the stream. That's what stops buzzer disputes.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!getRoom(code)) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  let body: { type?: string; playerId?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (!body?.type) {
    return NextResponse.json({ error: "Missing action type." }, { status: 400 });
  }

  const room = dispatch(code, {
    type: body.type,
    playerId: body.playerId,
    payload: body.payload,
    // Server stamps the clock — never trust a phone's idea of "first".
  });

  return NextResponse.json({ ok: true, version: room?.version ?? 0 });
}
