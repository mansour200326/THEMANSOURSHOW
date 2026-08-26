import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { createRoom } from "@/lib/room/store";
import { currentHost } from "@/lib/plan/host";
import { playerLimit } from "@/lib/plan/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Host taps "Host a game" — mint a room and hand back the code. */
export async function POST(request: Request) {
  // Rooms live in memory for twelve hours. A loop on this endpoint is a
  // free way to fill the process up, and nobody hosts sixty parties an hour.
  const limit = rateLimit(`room:${callerKey(request)}`, 60, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many rooms from here just now." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  /*
   * The cap is decided once, here, and stored on the room. Rooms outlive the
   * request that made them and every later action arrives from a player's
   * phone, not the host's browser — there is no session to ask by then.
   */
  const host = await currentHost();
  const room = createRoom(playerLimit(host.plan));
  return NextResponse.json({ code: room.code, maxPlayers: room.maxPlayers });
}
