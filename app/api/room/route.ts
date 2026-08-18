import { NextResponse } from "next/server";
import { createRoom } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Host taps "Host a game" — mint a room and hand back the code. */
export async function POST() {
  const room = createRoom();
  return NextResponse.json({ code: room.code });
}
