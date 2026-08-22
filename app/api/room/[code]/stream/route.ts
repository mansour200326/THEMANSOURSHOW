import { redactFor } from "@/lib/room/redact";
import { getRoom, subscribe } from "@/lib/room/store";
import type { Room } from "@/lib/room/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events: every client — the TV and every phone — holds one of these
 * open and receives the room on every change. Snapshots rather than diffs;
 * a party room is small and it makes reconnects trivially correct.
 *
 * `?as=<playerId>` says who's listening, so the hidden-role games can strip
 * what this particular screen isn't entitled to. No id means the TV, which
 * everyone can see and so gets the least.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const viewerId = new URL(request.url).searchParams.get("as");
  const room = getRoom(code);
  if (!room) {
    return new Response("room not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (next: Room) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(redactFor(next, viewerId))}\n\n`),
          );
        } catch {
          // Client vanished mid-write; the cancel handler cleans up.
        }
      };

      send(room);
      unsubscribe = subscribe(code, send);

      // Proxies and phone browsers drop idle connections; this keeps them warm.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* same as above */
        }
      }, 15000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Stops nginx-style buffering from holding events back.
      "X-Accel-Buffering": "no",
    },
  });
}
