/** A mistyped room code or a stale link — not a dead end. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-moon-deep">
        Nothing here
      </p>
      <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
        Wrong turn
      </h1>
      <p className="max-w-md text-moon-dim">
        That page doesn&apos;t exist. If you&apos;re joining a game, the code is
        the four letters on the TV.
      </p>
      <a href="/" className="btn-brand px-8 py-4 text-lg">
        Back to the start
      </a>
    </main>
  );
}
