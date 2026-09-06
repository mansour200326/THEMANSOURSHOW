"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The thirty seconds a first-time host needs.
 *
 * You know how this works. A stranger landing on the site sees "Host a game"
 * and "Join a game" and has to guess that one of those goes on the
 * television. So the first visit gets a short animated scene — a screen, a
 * sofa, a code appearing, phones lighting up one by one — that explains the
 * whole product without a paragraph. It plays once, remembers that it did,
 * and can be brought back from a small link.
 *
 * Drawn, not filmed. A video would need a file, a host, and a re-shoot the
 * day the interface changed; this is a few hundred lines of SVG that uses
 * the real colours and stays true to the real screen.
 */
const SEEN_KEY = "bignight:onboarded";

const BEATS = [
  {
    title: "Put this on the TV",
    line: "Open bignight.games on the screen everyone can see and tap Host a game.",
  },
  {
    title: "Everyone joins on their phone",
    line: "They go to bignight.games/play and type the four-letter code. No app, no account.",
  },
  {
    title: "Pick a game and play",
    line: "The TV is the stage. The phones are the buzzers, the pens and the ballots.",
  },
];

export function useFirstVisit(): [boolean, () => void] {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* private mode — just don't show it */
    }
  }, []);
  const dismiss = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* fine */
    }
    setShow(false);
  };
  return [show, dismiss];
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  /*
   * Advances on a tap, not a timer. It used to roll through on its own,
   * which meant reading at the animation's pace rather than yours — and
   * anyone who looked away for a moment came back to a different step with
   * no way to go back. Now it waits, and the last step's button is the one
   * that closes it.
   */
  const [beat, setBeat] = useState(0);
  const last = beat === BEATS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/95 p-4 backdrop-blur">
      <motion.div
        initial={{ y: 14, scale: 0.985 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-3xl rounded-3xl border border-line/12 bg-dusk p-6 shadow-tile sm:p-8"
      >
        <p className="t-label font-display uppercase text-moon-deep">How it works</p>

        <Scene beat={beat} />

        <div className="mt-5 min-h-[4.5rem]">
          <AnimatePresence initial={false}>
            <motion.div
              key={beat}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-display text-2xl uppercase tracking-wide text-moon">
                <span className="mr-3 text-accent">{beat + 1}</span>
                {BEATS[beat].title}
              </h2>
              <p className="mt-1 text-moon-dim">{BEATS[beat].line}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {BEATS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBeat(i)}
                aria-label={`Step ${i + 1}`}
                className={[
                  "h-2 rounded-full transition-all",
                  i === beat ? "w-8 bg-accent" : "w-2 bg-line/20",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {beat > 0 && (
              <button onClick={() => setBeat(beat - 1)} className="btn-ghost px-5 py-3">
                Back
              </button>
            )}
            <button
              onClick={() => (last ? onDone() : setBeat(beat + 1))}
              className="btn-brand px-8 py-3"
            >
              {last ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ scene */

const CORAL = "#FF6B57";
const MOON = "#F4F2EC";
const DUSK = "#1C2A55";
const DIM = "rgba(244,242,236,0.35)";

const PHONES = [
  { x: 86, name: "SAM" },
  { x: 156, name: "ALI" },
  { x: 226, name: "MAYA" },
  { x: 296, name: "LEO" },
];

function Scene({ beat }: { beat: number }) {
  return (
    <svg
      viewBox="0 0 400 220"
      className="mt-4 w-full rounded-2xl border border-line/8 bg-midnight"
      role="img"
      aria-label="A television showing a room code, and four people on a sofa joining from their phones"
    >
      {/* Wall glow behind the TV */}
      <motion.ellipse
        cx="200" cy="70" rx="150" ry="55" fill={CORAL}
        animate={{ opacity: beat === 0 ? 0.12 : 0.06 }}
        transition={{ duration: 0.8 }}
      />

      {/* The television */}
      <rect x="110" y="24" width="180" height="96" rx="6" fill={DUSK} stroke={MOON} strokeOpacity="0.25" />
      <rect x="185" y="120" width="30" height="8" fill={DUSK} />
      <rect x="165" y="128" width="70" height="3" rx="1.5" fill={DUSK} />

      {/* What's on the screen */}
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <motion.g key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <text x="200" y="66" textAnchor="middle" fill={CORAL} fontSize="15" fontWeight="700" letterSpacing="3">BIG NIGHT</text>
            <rect x="163" y="80" width="74" height="16" rx="8" fill={CORAL} />
            <text x="200" y="91" textAnchor="middle" fill="#101A3C" fontSize="8" fontWeight="700" letterSpacing="1">HOST A GAME</text>
          </motion.g>
        )}
        {beat === 1 && (
          <motion.g key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <text x="200" y="52" textAnchor="middle" fill={DIM} fontSize="7" letterSpacing="2">ROOM CODE</text>
            <motion.text
              x="200" y="82" textAnchor="middle" fill={MOON} fontSize="30" fontWeight="800" letterSpacing="4"
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              style={{ transformOrigin: "200px 72px" }}
            >
              QZTK
            </motion.text>
            {PHONES.map((p, i) => (
              <motion.g key={p.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.5 }}>
                <rect x={128 + i * 38} y="98" width="34" height="12" rx="6" fill={CORAL} fillOpacity="0.2" stroke={CORAL} strokeOpacity="0.6" />
                <text x={145 + i * 38} y="106.5" textAnchor="middle" fill={MOON} fontSize="6" fontWeight="600" letterSpacing="0.5">{p.name}</text>
              </motion.g>
            ))}
          </motion.g>
        )}
        {beat === 2 && (
          <motion.g key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <text x="200" y="50" textAnchor="middle" fill={DIM} fontSize="6" letterSpacing="2">BIG BOARD · GEOGRAPHY</text>
            <text x="200" y="72" textAnchor="middle" fill={MOON} fontSize="9" fontWeight="600">THIS CITY SITS ON TWO CONTINENTS</text>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={140 + i * 42} y="84" width="36" height="22" rx="3" fill={MOON} fillOpacity="0.06" stroke={MOON} strokeOpacity="0.15" />
            ))}
            <motion.rect
              x="140" y="84" width="36" height="22" rx="3" fill={CORAL} fillOpacity="0.35" stroke={CORAL}
              animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, delay: 0.8, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* The sofa */}
      <rect x="60" y="176" width="280" height="26" rx="10" fill={DUSK} />
      <rect x="52" y="168" width="18" height="34" rx="6" fill={DUSK} />
      <rect x="330" y="168" width="18" height="34" rx="6" fill={DUSK} />

      {/* The people, and the phones in their hands */}
      {PHONES.map((p, i) => {
        const cx = p.x + 12;
        const lit = beat === 1 || beat === 2;
        return (
          <g key={p.name}>
            <circle cx={cx} cy="150" r="11" fill={MOON} fillOpacity="0.85" />
            <rect x={cx - 14} y="162" width="28" height="20" rx="8" fill={MOON} fillOpacity="0.55" />
            <motion.g
              animate={lit ? { y: [0, -3, 0] } : { y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.5, repeat: beat === 1 ? 0 : Infinity, repeatDelay: 2 }}
            >
              <rect x={cx + 6} y="156" width="10" height="17" rx="2" fill="#0B1230" stroke={MOON} strokeOpacity="0.4" />
              <motion.rect
                x={cx + 7.5} y="157.5" width="7" height="14" rx="1"
                fill={CORAL}
                initial={{ opacity: 0 }}
                animate={{ opacity: lit ? 0.9 : 0.08 }}
                transition={{ delay: beat === 1 ? 0.9 + i * 0.5 : 0, duration: 0.3 }}
              />
            </motion.g>
          </g>
        );
      })}

      {/* The host, standing, remote in hand */}
      <circle cx="40" cy="112" r="11" fill={CORAL} />
      <rect x="27" y="124" width="26" height="42" rx="9" fill={CORAL} fillOpacity="0.7" />
      <motion.rect
        x="50" y="136" width="14" height="5" rx="2" fill={MOON}
        animate={{ rotate: beat === 0 ? [0, -12, 0] : 0 }}
        transition={{ duration: 0.9, repeat: beat === 0 ? Infinity : 0, repeatDelay: 1.2 }}
        style={{ transformOrigin: "50px 138px" }}
      />
    </svg>
  );
}
