import { NextResponse } from "next/server";
import { redactFor } from "@/lib/room/redact";
import { getRoom } from "@/lib/room/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cheap existence check + first snapshot, without opening a stream. Redacted
 * the same way the stream is — see lib/room/redact.ts.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const viewerId = new URL(request.url).searchParams.get("as");
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  return NextResponse.json(redactFor(room, viewerId));
}
