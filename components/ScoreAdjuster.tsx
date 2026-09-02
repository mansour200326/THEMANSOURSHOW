"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The host's thumb on the scales.
 *
 * Every game keeps score its own way and every one of them is sometimes
 * wrong: a team cheats, an answer was judged too harshly, somebody arrives
 * late and should start level, a round got scored twice. Undo only walks back
 * the last thing that happened, which is no help ten minutes later, and
 * "start again" costs everyone the night so far.
 *
 * So the host can just set it right. Deliberately blunt — pick a side, pick
 * an amount, add or take away — because the situations it exists for are
 * social rather than mechanical and the person holding the remote already
 * knows what the number should be.
 */
export type Adjustable = { id: string; name: string; score: number };

export function ScoreAdjuster({
  entries,
  step = 100,
  onAdjust,
  onClose,
}: {
  entries: Adjustable[];
  /** The usual increment for this game — points here, whole points there. */
  step?: number;
  onAdjust: (id: string, delta: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");
  const amount = Math.abs(Math.round(Number(custom))) || step;

  /*
   * Rendered into the body rather than where it's written.
   *
   * Every one of these screens is built out of animated elements, and a
   * transform creates a stacking context that a fixed-position child cannot
   * escape however high its z-index. The first version came up *behind* the
   * game board, dimly visible through it. A portal is the only way out.
   *
   * No server-render guard: this only ever exists because somebody tapped a
   * button, so the document is always there. Gating it on a mount effect —
   * the reflex — made the panel render null first and then swap in, which
   * left the fade-in stranded at a tenth of its opacity and looked exactly
   * like the stacking bug it was meant to fix.
   */
  return createPortal(
    /*
     * The backdrop doesn't fade in, and that's deliberate. Animating it from
     * opacity 0 means the panel is invisible until something advances the
     * animation — and plenty of things don't: a throttled background tab,
     * a low-power device, anyone who has asked their system for reduced
     * motion. It came up at a tenth of its opacity, unreadable, looking for
     * all the world like it was rendering behind the board.
     *
     * A control the host reaches for mid-argument has to be there the frame
     * it opens. The card inside can have its little spring; nothing depends
     * on that finishing.
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/95 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-dusk p-5 shadow-tile"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl uppercase tracking-widest text-moon">
            Fix the scores
          </h2>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            Done
          </button>
        </div>

        <div className="mt-4">
          <label className="t-label font-display uppercase text-moon-deep">
            How much
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={String(step)}
              className="field w-32 py-3 text-center text-lg tabular-nums"
            />
            <span className="text-sm text-moon-deep">
              per tap — leave blank for {step}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="min-w-0 flex-1 truncate font-display uppercase tracking-wide text-moon">
                {entry.name}
              </span>
              <span className="w-24 shrink-0 text-right font-display text-lg tabular-nums text-moon-dim">
                {entry.score.toLocaleString()}
              </span>
              <button
                onClick={() => onAdjust(entry.id, -amount)}
                aria-label={`Take ${amount} from ${entry.name}`}
                className="h-11 w-11 shrink-0 rounded-full border border-rose-500/40 font-display text-xl text-rose-300 transition-colors hover:bg-rose-500/15"
              >
                −
              </button>
              <button
                onClick={() => onAdjust(entry.id, amount)}
                aria-label={`Give ${amount} to ${entry.name}`}
                className="h-11 w-11 shrink-0 rounded-full border border-emerald-400/40 font-display text-xl text-emerald-300 transition-colors hover:bg-emerald-500/15"
              >
                +
              </button>
            </div>
          ))}
          {!entries.length && (
            <p className="text-moon-deep">Nobody to adjust yet.</p>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

/** The button that opens it, and the panel itself. */
export function ScoreFixer({
  entries,
  step,
  onAdjust,
  className = "",
}: {
  entries: Adjustable[];
  step?: number;
  onAdjust: (id: string, delta: number) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Add or subtract points"
        className={`btn-ghost px-3 py-1.5 text-xs ${className}`}
      >
        Fix scores
      </button>
      <AnimatePresence>
        {open && (
          <ScoreAdjuster
            entries={entries}
            step={step}
            onAdjust={onAdjust}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
