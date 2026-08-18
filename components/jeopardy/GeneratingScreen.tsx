"use client";

import { motion } from "framer-motion";

type Props = {
  categories: string[];
  onCancel: () => void;
};

export function GeneratingScreen({ categories, onCancel }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[4vmin] px-6 text-center">
      <div>
        <p className="t-label font-display uppercase text-slate-500">
          Huddle presents
        </p>
        <h1 className="cream-text mt-1 font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
          Writing the board
        </h1>
      </div>

      <div className="flex w-full max-w-4xl flex-wrap justify-center gap-[0.6vmin]">
        {categories.map((title, i) => (
          <motion.div
            key={title + i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative flex min-w-[14rem] flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-stage-tile/60 to-stage-tileDeep px-4 py-6"
          >
            <span className="font-display text-sm uppercase tracking-wider text-slate-100 sm:text-lg">
              {title}
            </span>
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "linear",
              }}
            />
          </motion.div>
        ))}
      </div>

      <p className="max-w-xl text-balance text-slate-400">
        Writing five clues for every category, plus one Final Jeopardy. This
        takes a minute — the good ones are worth waiting for.
      </p>

      <button onClick={onCancel} className="btn-ghost text-sm">
        Cancel
      </button>
    </main>
  );
}
