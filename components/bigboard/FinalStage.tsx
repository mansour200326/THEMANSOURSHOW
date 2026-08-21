"use client";

import { motion } from "framer-motion";
import { CountdownRing } from "@/components/bigboard/CountdownRing";
import { maxFinalWager } from "@/lib/bigboard/engine";
import type { FinalState, Rules, Team } from "@/lib/bigboard/types";

type Props = {
  phase: "final-wager" | "final-clue" | "final-judge";
  final: FinalState;
  teams: Team[];
  rules: Rules;
  onWager: (teamId: string, amount: number) => void;
  onLockWagers: () => void;
  onShowJudging: () => void;
  onJudge: (teamId: string, correct: boolean) => void;
  onFinish: () => void;
};

export function FinalStage({
  phase,
  final,
  teams,
  rules,
  onWager,
  onLockWagers,
  onShowJudging,
  onJudge,
  onFinish,
}: Props) {
  const allJudged = teams.every((t) => final.results[t.id] != null);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <p className="t-label font-display uppercase text-moon-deep">
          Final Round
        </p>
        <h2 className="accent-text font-display text-[clamp(2rem,5vw,6rem)] font-bold uppercase tracking-tight">
          {final.clue.category}
        </h2>
      </motion.div>

      {phase === "final-wager" && (
        <>
          <p className="max-w-3xl text-balance text-[clamp(0.95rem,1.4vw,1.5rem)] text-moon-dim">
            Everyone writes a wager down, then you type them in. Nobody has seen
            the clue yet.
          </p>

          <div
            className="grid w-full max-w-6xl gap-[1vmin]"
            style={{
              gridTemplateColumns: `repeat(${Math.min(teams.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {teams.map((team) => {
              const cap = maxFinalWager(team);
              return (
                <div key={team.id} className="panel p-5">
                  <p className="truncate font-display text-[clamp(0.9rem,1.3vw,1.6rem)] uppercase tracking-wider text-accent-bright">
                    {team.name}
                  </p>
                  <p className="mt-1 text-sm text-moon-deep">
                    Score {team.score.toLocaleString()} · max{" "}
                    {cap.toLocaleString()}
                  </p>
                  <input
                    type="number"
                    min={0}
                    max={cap}
                    value={final.wagers[team.id] ?? ""}
                    placeholder="0"
                    onChange={(e) => onWager(team.id, Number(e.target.value))}
                    onFocus={(e) => e.currentTarget.select()}
                    className="field mt-4 text-center font-display text-[clamp(1.4rem,2.4vw,2.75rem)] font-bold tabular-nums"
                  />
                </div>
              );
            })}
          </div>

          <button onClick={onLockWagers} className="btn-accent px-12 py-4 text-xl">
            Lock wagers · show the clue
          </button>
        </>
      )}

      {phase === "final-clue" && (
        <>
          <motion.p
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="t-clue max-w-[85vw] text-balance font-display uppercase tracking-wide text-moon"
          >
            {final.clue.clue}
          </motion.p>

          {rules.timer && (
            <CountdownRing seconds={60} resetKey="final" />
          )}

          <p className="text-[clamp(0.85rem,1.2vw,1.25rem)] uppercase tracking-[0.2em] text-moon-deep">
            Write your answers
          </p>

          <button onClick={onShowJudging} className="btn-accent px-12 py-4 text-xl">
            Reveal the answer
          </button>
        </>
      )}

      {phase === "final-judge" && (
        <>
          <p className="t-answer max-w-[80vw] text-balance font-display font-semibold uppercase text-moon">
            {final.clue.clue}
          </p>
          <div className="flex flex-col items-center gap-1">
            <span className="t-label font-display uppercase text-moon-deep">
              Answer
            </span>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="accent-text t-answer text-balance font-display font-bold uppercase"
            >
              {final.clue.answer}
            </motion.p>
          </div>

          <div
            className="grid w-full max-w-6xl gap-[1vmin]"
            style={{
              gridTemplateColumns: `repeat(${Math.min(teams.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {teams.map((team) => {
              const result = final.results[team.id];
              return (
                <div
                  key={team.id}
                  className={[
                    "rounded-xl border p-4 transition-colors",
                    result === true
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : result === false
                        ? "border-rose-500/60 bg-rose-500/10"
                        : "border-white/10 bg-white/[0.02]",
                  ].join(" ")}
                >
                  <p className="truncate font-display text-[clamp(0.85rem,1.2vw,1.5rem)] uppercase tracking-wider text-moon/90">
                    {team.name}
                  </p>
                  <p className="mt-1 font-display text-[clamp(1.3rem,2vw,2.5rem)] font-bold tabular-nums text-moon">
                    {team.score.toLocaleString()}
                  </p>
                  <p className="mb-3 text-sm text-moon-deep">
                    Wagered {(final.wagers[team.id] ?? 0).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onJudge(team.id, true)}
                      className="btn-good flex-1 px-0 py-2 text-lg"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => onJudge(team.id, false)}
                      className="btn-bad flex-1 px-0 py-2 text-lg"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onFinish}
            disabled={!allJudged}
            className="btn-accent px-12 py-4 text-xl"
          >
            Final standings
          </button>
        </>
      )}
    </div>
  );
}
