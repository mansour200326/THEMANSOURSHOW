"use client";

/**
 * Telling the server how a board went.
 *
 * Fire-and-forget on purpose: this is bookkeeping, and a host whose round has
 * just ended should never wait on it or see it fail. keepalive so the report
 * survives the navigation that usually follows "back to the lobby".
 */
export function reportBoard(
  boardId: string | null | undefined,
  outcome: "completed" | "skipped",
) {
  if (!boardId) return;
  try {
    void fetch("/api/library/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, outcome }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Never let bookkeeping break a game. */
  }
}
