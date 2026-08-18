import Link from "next/link";
import { ShowMark } from "@/components/ShowMark";
import { lineup } from "@/lib/lineup";

export default function GamesMenu() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1800px] px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="opacity-80 transition hover:opacity-100">
          <ShowMark size="sm" />
        </Link>
        <span className="t-label font-display uppercase text-slate-500">
          Tonight&apos;s lineup
        </span>
      </header>

      <h2 className="mt-10 font-display text-4xl uppercase tracking-wide text-slate-200 sm:text-6xl">
        Pick a <span className="cream-text">segment</span>
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {lineup.map((game) => {
          const live = Boolean(game.href) || Boolean(game.liveInLobby);
          const card = (
            <div
              className={[
                "group relative flex h-full flex-col justify-between rounded-2xl border p-6 transition-all duration-200",
                live
                  ? "border-cream/30 bg-gradient-to-b from-cream/[0.09] to-transparent hover:-translate-y-1 hover:border-cream/70 hover:shadow-glow"
                  : "border-white/10 bg-white/[0.02]",
              ].join(" ")}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className={[
                      "font-display text-2xl uppercase tracking-wide sm:text-3xl",
                      live ? "text-slate-50" : "text-slate-400",
                    ].join(" ")}
                  >
                    {game.name}
                  </h3>
                  {live ? (
                    <span className="shrink-0 rounded-full bg-cream px-3 py-1 font-display text-xs uppercase tracking-widest text-ink-950">
                      {game.liveInLobby ? "In lobby" : "Live"}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 font-display text-xs uppercase tracking-widest text-slate-500">
                      Phase {game.phase}
                    </span>
                  )}
                </div>
                <p
                  className={[
                    "mt-3 text-sm leading-relaxed sm:text-base",
                    live ? "text-slate-300" : "text-slate-500",
                  ].join(" ")}
                >
                  {game.tagline}
                </p>
              </div>

              <p className="mt-6 font-display text-xs uppercase tracking-[0.2em] text-slate-500">
                {game.needsPhones ? "TV + phones" : "TV only"}
              </p>
            </div>
          );

          return live ? (
            <Link key={game.slug} href={game.href!} className="block">
              {card}
            </Link>
          ) : (
            <div key={game.slug} className="cursor-not-allowed select-none">
              {card}
            </div>
          );
        })}
      </div>
    </main>
  );
}
