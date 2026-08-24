import { NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rateLimit";
import { createRoom } from "@/lib/room/store";

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

  const room = createRoom();
  return NextResponse.json({ code: room.code });
}
