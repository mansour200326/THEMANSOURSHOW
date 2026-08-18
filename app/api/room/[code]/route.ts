import { NextResponse } from "next/server";
import { getRoom } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cheap existence check + first snapshot, without opening a stream. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  return NextResponse.json(room);
}
