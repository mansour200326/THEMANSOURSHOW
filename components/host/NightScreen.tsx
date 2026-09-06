"use client";

import type { NightEntry } from "@/lib/room/types";

/**
 * The whole night on one screen.
 *
 * Every game keeps its own score and its own winner; that's untouched. This
 * is the thing that was missing: at the end, who won the *night*. One column
 * per game played, one row per name, a total on the right — and it's only
 * ever shown when the host asks for it, never bolted onto a game's own
 * result. The room doesn't need a leaderboard between rounds; it needs one
 * at one in the morning when somebody claims they won.
 */
/**
 * Placement points: 3 for first, 2 for second, 1 for third, per game.
 *
 * Adding raw scores made Big Board decide every night it was played — it
 * scores in thousands where Categories scores in ones. Points for where you
 * finished make each game worth the same, which is what "who won the night"
 * ought to mean. Ties share the place: two teams level at the top both take
 * three, and the next takes one, since two people are ahead of them.
 */
const PLACEMENT = [3, 2, 1];

function placementsFor(scores: Array<{ name: string; points: number }>) {
  const ranked = [...scores].sort((a, b) => b.points - a.points);
  const out = new Map<string, number>();
  ranked.forEach((entry, i) => {
    // Standard competition ranking: your place is 1 + the number of people
    // strictly ahead of you.
    const ahead = ranked.filter((other) => other.points > entry.points).length;
    out.set(entry.name, PLACEMENT[ahead] ?? 0);
  });
  return out;
}

export function NightScreen({
  night,
  onBack,
  onClear,
}: {
  night: NightEntry[];
  onBack: () => void;
  onClear: () => void;
}) {
  type Cell = { place: number; raw: number } | null;
  const names = new Map<string, Cell[]>();
  night.forEach((game, g) => {
    const places = placementsFor(game.scores);
    game.scores.forEach(({ name, points }) => {
      const row = names.get(name) ?? Array<Cell>(night.length).fill(null);
      row[g] = { place: places.get(name) ?? 0, raw: points };
      names.set(name, row);
    });
  });

  const rows = [...names.entries()]
    .map(([name, per]) => ({
      name,
      per,
      total: per.reduce((sum, c) => sum + (c?.place ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total);

  const top = rows[0]?.total ?? 0;

  return (
    <main className="flex h-dvh flex-col gap-[2vmin] p-[3vmin]">
      <header className="flex shrink-0 items-baseline justify-between">
        <div>
          <p className="t-label font-display uppercase text-moon-deep">Tonight</p>
          <h1 className="brand-text font-display text-[clamp(2rem,5vw,4.5rem)] font-bold uppercase leading-none tracking-tight">
            {rows.length ? `${rows[0].name} wins the night` : "Nothing played yet"}
          </h1>
        </div>
        <div className="flex gap-2">
          {night.length > 0 && (
            <button onClick={onClear} className="btn-ghost px-4 py-2 text-sm">
              Start a new night
            </button>
          )}
          <button onClick={onBack} className="btn-accent px-6 py-2">
            Back to the lobby
          </button>
        </div>
      </header>

      {!night.length ? (
        <p className="text-moon-dim">
          Play a game through to the end and it lands here. The four
          screen-only games count too, as long as they were opened from this
          lobby.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-3xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-dusk">
              <tr className="text-moon-deep">
                <th className="px-5 py-3 font-display text-sm uppercase tracking-widest">
                  Who
                </th>
                {night.map((g, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-right font-display text-sm uppercase tracking-widest"
                  >
                    {g.label}
                  </th>
                ))}
                <th className="px-5 py-3 text-right font-display text-sm uppercase tracking-widest text-accent">
                  Night
                </th>
              </tr>
              <tr className="text-moon-deep/70">
                <th className="px-5 pb-2 text-[0.65rem] font-normal normal-case tracking-normal">
                  3 · 2 · 1 for first, second, third in each game. Small number is the score in that game.
                </th>
                {night.map((_, i) => <th key={i} />)}
                <th />
              </tr>
            </thead>
            <tbody>
              {/*
                * No entrance fade. This is the screen somebody reads at one
                * in the morning to settle an argument; it has to be all
                * there the frame it opens, on a throttled tab or a phone
                * with reduced motion just the same.
                */}
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className={[
                    "border-t border-white/8",
                    row.total === top && top > 0 ? "bg-accent/[0.07]" : "",
                  ].join(" ")}
                >
                  <td className="px-5 py-3 font-display text-[clamp(1rem,2vw,1.8rem)] uppercase tracking-wide text-moon">
                    {row.name}
                  </td>
                  {row.per.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-right">
                      {cell ? (
                        <>
                          <span className="font-display text-[clamp(1rem,1.8vw,1.6rem)] tabular-nums text-moon">
                            {cell.place}
                          </span>
                          <span className="ml-2 font-display text-xs tabular-nums text-moon-deep">
                            {cell.raw.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-moon-deep">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right font-display text-[clamp(1.1rem,2.2vw,2rem)] font-bold tabular-nums text-accent-bright">
                    {row.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
