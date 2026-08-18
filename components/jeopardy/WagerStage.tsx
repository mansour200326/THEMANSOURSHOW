"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  teamName: string;
  category: string;
  score: number;
  maxWager: number;
  onSubmit: (amount: number) => void;
  onCancel: () => void;
};

export function WagerStage({
  teamName,
  category,
  score,
  maxWager,
  onSubmit,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState(Math.min(500, maxWager));

  const clamp = (n: number) => Math.max(0, Math.min(Math.round(n), maxWager));
  const quick = [100, 500, 1000].filter((v) => v <= maxWager);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3vmin] text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotateX: -25 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      >
        <p className="cream-text t-hero font-display font-bold uppercase tracking-tight drop-shadow-[0_0_60px_rgba(240,228,198,0.35)]">
          Daily Double
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-[2vmin]"
      >
        <p className="font-display text-[clamp(1.1rem,2.2vw,2.75rem)] uppercase tracking-wide text-slate-200">
          <span className="text-cream-bright">{teamName}</span> · {category}
        </p>

        <div className="panel flex flex-col items-center gap-5 px-8 py-7">
          <p className="t-label font-display uppercase text-slate-500">
            Wager — up to {maxWager.toLocaleString()}
          </p>

          <input
            type="number"
            min={0}
            max={maxWager}
            value={amount}
            onChange={(e) => setAmount(clamp(Number(e.target.value)))}
            onFocus={(e) => e.currentTarget.select()}
            className="field w-[min(72vw,26rem)] text-center font-display text-[clamp(2rem,4vw,4.5rem)] font-bold tabular-nums"
          />

          <input
            type="range"
            min={0}
            max={maxWager}
            step={50}
            value={amount}
            onChange={(e) => setAmount(clamp(Number(e.target.value)))}
            className="w-[min(72vw,26rem)] accent-[#f0e4c6]"
          />

          <div className="flex flex-wrap justify-center gap-2">
            {quick.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(clamp(v))}
                className="btn-ghost px-4 py-2 text-sm"
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(clamp(maxWager))}
              className="btn-ghost px-4 py-2 text-sm"
            >
              All in
            </button>
          </div>

          <p className="text-sm text-slate-500">
            Current score {score.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(amount)}
            className="btn-cream px-10 text-lg"
          >
            Lock it in
          </button>
        </div>
      </motion.div>
    </div>
  );
}
