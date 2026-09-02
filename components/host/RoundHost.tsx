"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BLUFF_REAL_ID } from "@/lib/games/roundGames";
import { normalise } from "@/lib/feud/match";
import { Tally } from "@/components/Tally";
import { useCue, useCueWhen } from "@/components/useCue";
import type { RoundState } from "@/lib/games/roundEngine";
import { type Room, connectedPlayers, playerById } from "@/lib/room/types";
import { ScoreNudge } from "@/components/ScoreNudge";

type Props = {
  /** Host putting a score right by hand. */
  onAdjust: (playerId: string, delta: number) => void;
  room: Room;
  state: RoundState;
  onForce: () => void;
  onNext: () => void;
  onQuit: () => void;
};

/**
 * Bars are the game's own colour, stepped down in strength so a five-way race
 * still separates. The room only ever shows midnight plus one accent.
 */
const barColour = (i: number) =>
  ["bg-accent", "bg-accent/75", "bg-accent/55", "bg-accent/40", "bg-accent/30"][
    i % 5
  ];

export function RoundHost({ room, state, onForce, onNext, onQuit, onAdjust }: Props) {
  const prompt = state.prompts[state.round];
  const live = connectedPlayers(room);
  const isBluff = room.gameId === "bluff-trivia";
  const isHerd = room.gameId === "groupthink";

  /*
   * Most Likely To, Who Said It, Bluff Trivia and Groupthink all run through
   * this screen, and it was the one host view with no sound in it at all.
   */
  useCue(
    `${state.round}:${state.phase}`,
    state.phase === "vote"
      ? "whoosh"
      : state.phase === "reveal"
        ? Object.keys(state.lastScores).length
          ? "correct"
          : "wrong"
        : null,
  );
  useCueWhen(state.phase === "done", "fanfare");

  const waitingOn = live.filter((p) =>
    state.phase === "collect"
      ? state.submissions[p.id] === undefined
      : state.votes[p.id] === undefined,
  );

  const voteCounts: Record<string, number> = {};
  Object.values(state.votes).forEach((id) => {
    voteCounts[id] = (voteCounts[id] ?? 0) + 1;
  });
  const mostVotes = Math.max(1, ...Object.values(voteCounts));

  return (
    <main className="flex h-dvh flex-col gap-[1.5vmin] overflow-hidden p-[2vmin]">
      <header className="flex shrink-0 items-center justify-between">
        <span className="font-display text-xs uppercase tracking-[0.25em] text-moon-deep">
          Round {state.round + 1} of {state.prompts.length}
        </span>
        <button onClick={onQuit} className="btn-ghost px-3 py-1.5 text-xs">
          End segment
        </button>
      </header>

      {/* The prompt */}
      <div className="flex shrink-0 flex-col items-center px-[4vw] text-center">
        <motion.p
          key={prompt?.text}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="t-clue text-balance font-display uppercase tracking-wide text-moon"
        >
          {prompt?.text}
        </motion.p>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2vmin]">
        {state.phase === "done" ? (
          <Standings room={room} />
        ) : state.phase === "collect" ? (
          <>
            <p className="font-display text-[clamp(1rem,2vw,2.2rem)] uppercase tracking-[0.2em] text-accent">
              Answering on their phones
            </p>
            <div className="flex flex-wrap justify-center gap-[1vmin]">
              {live.map((p) => {
                const done = state.submissions[p.id] !== undefined;
                return (
                  <span
                    key={p.id}
                    className={[
                      "flex items-center gap-2 rounded-full border px-4 py-2 font-display text-[clamp(0.8rem,1.2vw,1.3rem)] uppercase tracking-wide transition-colors",
                      done
                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                        : "border-white/10 bg-white/[0.03] text-moon-deep",
                    ].join(" ")}
                  >
                    <span>{p.emoji}</span>
                    {p.name}
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          /* vote + reveal share the same board */
          <div className="w-full max-w-5xl space-y-[1vmin]">
            {isHerd && state.phase === "reveal" ? (
              <HerdResults room={room} state={state} />
            ) : (
              state.options.map((option, i) => {
                const count = voteCounts[option.id] ?? 0;
                const revealed = state.phase === "reveal";
                const isTruth = isBluff && option.id === BLUFF_REAL_ID;
                const author = playerById(room, option.authorId);

                return (
                  <div
                    key={option.id}
                    className={[
                      "relative overflow-hidden rounded-xl border px-5 py-[1.4vmin]",
                      revealed && isTruth
                        ? "border-emerald-400/70 bg-emerald-500/10"
                        : "border-white/10 bg-white/[0.03]",
                    ].join(" ")}
                  >
                    {revealed && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / mostVotes) * 100}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute inset-y-0 left-0 opacity-25 ${barColour(i)}`}
                      />
                    )}
                    <div className="relative flex items-center justify-between gap-4">
                      <span className="truncate font-display text-[clamp(1rem,2vw,2.2rem)] uppercase tracking-wide text-moon">
                        {option.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {revealed && isTruth && (
                          <span className="font-display text-sm uppercase tracking-widest text-emerald-300">
                            The truth
                          </span>
                        )}
                        {revealed && author && (
                          <span className="font-display text-sm uppercase tracking-widest text-moon-dim">
                            {author.emoji} {author.name}
                          </span>
                        )}
                        {/*
                          * Who fell for it. A bluffing game that only ever
                          * showed a number was hiding the best part of the
                          * round: not that a lie worked, but on whom.
                          */}
                        {revealed && count > 0 && (
                          <span className="flex shrink-0 gap-1">
                            {Object.entries(state.votes)
                              .filter(([, id]) => id === option.id)
                              .map(([voterId]) => (
                                <span
                                  key={voterId}
                                  title={playerById(room, voterId)?.name}
                                  className="text-[clamp(0.9rem,1.5vw,1.6rem)]"
                                >
                                  {playerById(room, voterId)?.emoji}
                                </span>
                              ))}
                          </span>
                        )}
                        {revealed && (
                          <span className="font-display text-[clamp(1rem,1.8vw,2rem)] font-bold tabular-nums text-accent">
                            {count}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {state.phase === "vote" && (
              <p className="pt-[1vmin] text-center font-display text-[clamp(0.8rem,1.2vw,1.3rem)] uppercase tracking-[0.2em] text-moon-deep">
                {waitingOn.length
                  ? `Waiting on ${waitingOn.map((p) => p.name).join(", ")}`
                  : "Counting…"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Controls + scores */}
      <div className="shrink-0 space-y-[1vmin]">
        <div className="flex justify-center gap-3">
          {(state.phase === "collect" || state.phase === "vote") && (
            <button onClick={onForce} className="btn-ghost text-sm">
              Skip the stragglers
            </button>
          )}
          {state.phase === "reveal" && (
            <button onClick={onNext} className="btn-accent px-10 py-3 text-lg">
              Next round
            </button>
          )}
          {state.phase === "done" && (
            <button onClick={onQuit} className="btn-accent px-10 py-3 text-lg">
              Back to the lobby
            </button>
          )}
        </div>

        <ScoreStrip room={room} state={state} onAdjust={onAdjust} />
      </div>
    </main>
  );
}

/*
 * The TV used to group by the raw text while the scoring grouped by the
 * normalised text, so "the beach" and "Beach" were paid as one answer and
 * displayed as two — the board contradicted the scoreboard. Both sides count
 * the same way now, and the label is the wording the most people used.
 */
function HerdResults({ room, state }: { room: Room; state: RoundState }) {
  const groups: Record<string, { label: string; ids: string[] }> = {};
  Object.entries(state.submissions).forEach(([playerId, text]) => {
    const key = normalise(text) || text.trim().toLowerCase();
    (groups[key] ??= { label: text.trim(), ids: [] }).ids.push(playerId);
  });
  const sorted = Object.entries(groups).sort(
    (a, b) => b[1].ids.length - a[1].ids.length,
  );
  const biggest = sorted[0]?.[1].ids.length ?? 0;

  return (
    <div className="space-y-[1vmin]">
      {sorted.map(([key, { label, ids }]) => (
        <div
          key={key}
          className={[
            "flex items-center justify-between gap-4 rounded-xl border px-5 py-[1.4vmin]",
            ids.length === biggest && biggest > 1
              ? "border-accent/60 bg-accent/10"
              : "border-white/10 bg-white/[0.03]",
          ].join(" ")}
        >
          <span className="truncate font-display text-[clamp(1rem,2vw,2.2rem)] uppercase tracking-wide text-moon">
            {label}
          </span>
          <span className="flex shrink-0 gap-2">
            {ids.map((id) => (
              <span key={id} className="text-[clamp(1rem,1.8vw,1.8rem)]">
                {playerById(room, id)?.emoji}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Standings({ room }: { room: Room }) {
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full max-w-3xl space-y-2">
      <p className="mb-[2vmin] text-center font-display text-[clamp(1.5rem,4vw,4rem)] uppercase text-accent">
        Segment over
      </p>
      {ranked.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className={[
            "flex items-center justify-between rounded-xl border px-5 py-3",
            i === 0 ? "border-accent/50 bg-accent/[0.08]" : "border-white/10",
          ].join(" ")}
        >
          <span className="flex items-center gap-3 font-display text-xl uppercase tracking-wide text-moon">
            <span className="w-6 tabular-nums text-moon-deep">{i + 1}</span>
            <span>{p.emoji}</span>
            {p.name}
          </span>
          <span className="font-display text-xl font-bold tabular-nums text-accent">
            <Tally value={p.score} />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ScoreStrip({
  room,
  state,
  onAdjust,
}: {
  room: Room;
  state: RoundState;
  onAdjust: (playerId: string, delta: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-[0.6vmin]">
      {connectedPlayers(room).map((p) => {
        const gained = state.lastScores[p.id];
        return (
          <div
            key={p.id}
            className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5"
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="font-display text-sm uppercase tracking-wide text-moon/75">
              {p.name}
            </span>
            <ScoreNudge
              step={100}
              size="small"
              onAdjust={(delta) => onAdjust(p.id, delta)}
            >
              <span className="font-display text-sm font-bold tabular-nums text-accent">
                <Tally value={p.score} />
              </span>
            </ScoreNudge>
            <AnimatePresence>
              {gained ? (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: -14 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-2 font-display text-xs font-bold text-emerald-300"
                >
                  +{gained}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
