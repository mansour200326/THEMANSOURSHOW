"use client";

import { useEffect } from "react";

/**
 * What the room sees when something throws.
 *
 * There was no boundary at all, so any exception put Next's own crash page on
 * the television — white background, stack trace, no way back — in front of
 * everybody, mid-game. The room state lives on the server and survives this,
 * so the useful thing to offer is the way back into it.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[bignight]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-moon-deep">
        Well, that&apos;s embarrassing
      </p>
      <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
        Something broke
      </h1>
      <p className="max-w-md text-moon-dim">
        The room is still on the server — nobody has been thrown out. Try that
        again, and if it keeps happening the code on the TV still works.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-brand px-8 py-4 text-lg">
          Try again
        </button>
        <a href="/" className="btn-ghost px-6 py-4">
          Back to the start
        </a>
      </div>
    </main>
  );
}
