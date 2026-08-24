"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ROUND_CHOICES, roundsFor } from "@/lib/games/lengths";
import { rulesFor } from "@/lib/games/rules";
import { familyClass } from "@/lib/games/families";

type Props = {
  gameId: string;
  name: string;
  /** The chosen length rides along, so every game can be cut short or run on. */
  onStart: (rounds?: number) => void;
  onBack: () => void;
  /** Skip the bundled and AI content and write the whole thing yourself. */
  onWriteOwn?: () => void;
  /** Label for the forward button when a setup step comes next. */
  startLabel?: string;
};

/**
 * The rules, read off the TV before anything starts.
 *
 * Sixteen games is more than any host can hold in their head, and most of the
 * room has never played any of them. This is the thirty seconds where somebody
 * reads it out and everyone nods.
 */
export function HowToPlay({
  gameId,
  name,
  onStart,
  onBack,
  onWriteOwn,
  startLabel = "Start the game",
}: Props) {
  const rules = rulesFor(gameId);
  const choices = ROUND_CHOICES[gameId];
  const [rounds, setRounds] = useState(() => roundsFor(gameId));

  return (
    <main
      className={`flex min-h-dvh flex-col justify-center px-[6vw] py-[4vh] ${familyClass(
        gameId,
      )}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl"
      >
        <p className="t-label font-display uppercase text-moon-deep">
          How it works
        </p>
        <h1 className="accent-text mt-1 font-display text-[clamp(2.2rem,6vw,5rem)] font-bold uppercase leading-none tracking-tight">
          {name}
        </h1>
        {rules && (
          <p className="mt-3 text-[clamp(1rem,1.8vw,1.6rem)] text-moon-dim">
            {rules.summary}
          </p>
        )}

        {rules && (
          <ol className="mt-[4vh] flex flex-col gap-[2vh]">
            {rules.how.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.09 }}
                className="flex items-start gap-5"
              >
                <span className="flex h-[clamp(2rem,3.4vw,3rem)] w-[clamp(2rem,3.4vw,3rem)] shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 font-display text-[clamp(0.9rem,1.5vw,1.4rem)] tabular-nums text-accent-bright">
                  {i + 1}
                </span>
                <span className="pt-[0.3em] text-[clamp(1rem,2vw,1.9rem)] leading-snug text-moon">
                  {step}
                </span>
              </motion.li>
            ))}
          </ol>
        )}

        {rules?.example && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="mt-[3vh] rounded-2xl border border-accent/30 bg-accent/[0.07] p-5"
          >
            <p className="t-label font-display uppercase text-accent">
              For example
            </p>
            <p className="mt-1.5 text-[clamp(0.9rem,1.5vw,1.35rem)] leading-snug text-moon/90">
              {rules.example}
            </p>
          </motion.div>
        )}

        {rules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-[3vh] grid gap-3 sm:grid-cols-2"
          >
            <Note label="Scoring" text={rules.scoring} />
            <Note label="You need" text={rules.needs} />
          </motion.div>
        )}

        {/*
          * Length lives here rather than in a setup screen, because half the
          * games never see one — and this is the screen the room is already
          * looking at while somebody reads the rules out.
          */}
        {choices && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-[3vh] flex flex-wrap items-center gap-3"
          >
            <span className="t-label font-display uppercase text-moon-deep">
              Rounds
            </span>
            {choices.map((n) => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={[
                  "min-w-[3.5rem] rounded-xl border px-4 py-2.5 font-display tabular-nums transition-colors",
                  rounds === n
                    ? "border-accent bg-accent/15 text-accent-bright"
                    : "border-white/12 text-moon/75 hover:border-white/25",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </motion.div>
        )}

        <div className="mt-[5vh] flex flex-wrap items-center gap-4">
          <button
            onClick={() => onStart(choices ? rounds : undefined)}
            className="btn-brand px-12 py-5 text-xl"
          >
            {startLabel}
          </button>
          {onWriteOwn && (
            <button onClick={onWriteOwn} className="btn-accent px-8 py-5">
              ✎ Write my own
            </button>
          )}
          <button onClick={onBack} className="btn-ghost px-8 py-5">
            Pick another game
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="t-label font-display uppercase text-moon-deep">{label}</p>
      <p className="mt-1.5 text-[clamp(0.85rem,1.3vw,1.2rem)] leading-snug text-moon/75">
        {text}
      </p>
    </div>
  );
}
