"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { standings, winners } from "@/lib/jeopardy/engine";
import type { Team } from "@/lib/jeopardy/types";

const COLORS = ["#f0e4c6", "#fdf6e6", "#c7b48c", "#e8e8ef", "#5b8cff"];

type Bit = ReturnType<typeof makeBits>[number];

const makeBits = () =>
  Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 3.5 + Math.random() * 2.5,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 120,
  }));

function Confetti() {
  // Randomised after mount — generating this during SSR breaks hydration,
  // which silently freezes every animation on the screen at opacity 0.
  const [bits, setBits] = useState<Bit[]>([]);
  useEffect(() => setBits(makeBits()), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ y: "-10vh", x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: b.drift,
            opacity: [0, 1, 1, 0],
            rotate: 540,
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 0.45,
            background: b.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

type Props = {
  teams: Team[];
  onRematch: () => void;
  onNewGame: () => void;
};

export function WinnerScreen({ teams, onRematch, onNewGame }: Props) {
  const table = standings(teams);
  const champs = winners(teams);
  const tie = champs.length > 1;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-[3vmin] px-6 text-center">
      <Confetti />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="relative z-10 flex flex-col items-center"
      >
        <p className="t-label font-display uppercase text-slate-500">
          {tie ? "It's a tie" : "Champions"}
        </p>
        <h2 className="cream-text t-hero text-balance font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(240,228,198,0.4)]">
          {champs.map((t) => t.name).join(" & ")}
        </h2>
        <p className="mt-2 font-display text-[clamp(1.5rem,3vw,3.5rem)] font-bold tabular-nums text-slate-100">
          {champs[0]?.score.toLocaleString()}
        </p>
      </motion.div>

      <div className="relative z-10 w-full max-w-3xl space-y-2">
        {table.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className={[
              "flex items-center justify-between rounded-xl border px-5 py-3",
              i === 0
                ? "border-cream/50 bg-cream/[0.08]"
                : "border-white/10 bg-white/[0.02]",
            ].join(" ")}
          >
            <div className="flex items-center gap-4">
              <span className="w-8 font-display text-xl tabular-nums text-slate-500">
                {i + 1}
              </span>
              <span className="font-display text-xl uppercase tracking-wider text-slate-100 sm:text-2xl">
                {team.name}
              </span>
            </div>
            <span
              className={[
                "font-display text-xl font-bold tabular-nums sm:text-2xl",
                team.score < 0 ? "text-rose-400" : "text-slate-50",
              ].join(" ")}
            >
              {team.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mt-2 flex flex-wrap justify-center gap-3">
        <button onClick={onRematch} className="btn-cream px-8 py-4 text-lg">
          Rematch · same teams
        </button>
        <button onClick={onNewGame} className="btn-ghost px-8 py-4 text-lg">
          New game
        </button>
      </div>
    </div>
  );
}
