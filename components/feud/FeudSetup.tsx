"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShowMark } from "@/components/ShowMark";

export type FeudConfig = {
  teamNames: string[];
  theme: string;
  rounds: number;
  source: "ai" | "sample";
};

type Props = {
  onStart: (config: FeudConfig) => void;
  generating?: boolean;
  error?: string | null;
  canResume?: boolean;
  onResume?: () => void;
};

const ROUND_CHOICES = [3, 5, 8];

export function FeudSetup({
  onStart,
  generating,
  error,
  canResume,
  onResume,
}: Props) {
  const [names, setNames] = useState(["Team 1", "Team 2"]);
  const [theme, setTheme] = useState("");
  const [rounds, setRounds] = useState(5);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/games" className="opacity-80 transition hover:opacity-100">
          <ShowMark size="sm" />
        </Link>
        <Link
          href="/games"
          className="font-display text-xs uppercase tracking-[0.2em] text-moon-deep hover:text-moon/75"
        >
          ← Lineup
        </Link>
      </header>

      <div className="mt-10">
        <p className="t-label font-display uppercase text-moon-deep">
          Big Night presents
        </p>
        <h1 className="accent-text mt-1 font-display text-5xl font-bold uppercase tracking-tight sm:text-7xl">
          Face-Off
        </h1>
        <p className="mt-3 text-moon-dim">
          Two teams, one survey board, three strikes. No phones — you run it from
          here and everyone shouts.
        </p>
      </div>

      {canResume && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/[0.08] px-5 py-4"
        >
          <p className="text-moon/90">There&apos;s a game in progress.</p>
          <button onClick={onResume} className="btn-brand">
            Resume game
          </button>
        </motion.div>
      )}

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
            Teams
          </h2>
          <div className="mt-4 space-y-3">
            {names.map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-moon-deep/70">
                  {i + 1}
                </span>
                <input
                  value={name}
                  onChange={(e) =>
                    setNames((n) =>
                      n.map((v, idx) => (idx === i ? e.target.value : v)),
                    )
                  }
                  maxLength={22}
                  className="field"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
            Survey theme
          </h2>
          <p className="mt-1 text-sm text-moon-deep">
            What the questions should be about. We write the survey and rank the
            answers.
          </p>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="everyday life · your friends · football · weddings · road trips"
            maxLength={200}
            className="field mt-4"
          />
        </div>

        <div>
          <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
            Rounds
          </h2>
          <div className="mt-3 flex gap-2">
            {ROUND_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRounds(n)}
                className={[
                  "rounded-full border px-5 py-2 font-display tabular-nums transition-colors",
                  rounds === n
                    ? "border-accent/60 bg-accent/15 text-accent-bright"
                    : "border-white/10 bg-white/[0.03] text-moon/75 hover:border-accent/40",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-center text-rose-200"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-10 flex flex-col items-center gap-3 pb-6">
        <button
          onClick={() => onStart({ teamNames: names, theme, rounds, source: "ai" })}
          disabled={generating}
          className="btn-brand px-16 py-5 text-2xl"
        >
          {generating ? "Writing the survey…" : "Build the survey"}
        </button>
        <button
          onClick={() =>
            onStart({ teamNames: names, theme, rounds, source: "sample" })
          }
          disabled={generating}
          className="btn-ghost text-sm"
        >
          Skip it — play the sample pack
        </button>
      </div>
    </main>
  );
}
