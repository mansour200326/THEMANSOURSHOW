import { tl } from "@/lib/i18n/server";
/** A mistyped room code or a stale link — not a dead end. */
export default async function NotFound() {
  const t = await tl();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-moon-deep">{t("Nothing here")}</p>
      <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">{t("Wrong turn")}</h1>
      <p className="max-w-md text-moon-dim">{t("That page doesn't exist. If you're joining a game, the code is the four letters on the TV.")}</p>
      <a href="/" className="btn-brand px-8 py-4 text-lg">{t("Back to the start")}</a>
    </main>
  );
}
