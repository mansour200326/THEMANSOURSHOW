"use client";

/**
 * A minus and a plus, either side of a score.
 *
 * This started life behind a "Fix scores" button that opened a panel. It
 * worked and nobody could find it — which is the wrong shape for what it's
 * for. Docking a team for cheating happens in the middle of an argument, with
 * everyone looking at the screen, and it should take one tap on the number
 * being argued about rather than a detour through a dialog.
 *
 * One tap is one step of whatever that game counts in: a hundred where the
 * clues are worth hundreds, ten on a survey board, one where a round is worth
 * one. Tap it three times for three of them.
 */
export function ScoreNudge({
  step,
  onAdjust,
  size = "normal",
  children,
}: {
  step: number;
  onAdjust: (delta: number) => void;
  size?: "normal" | "small";
  children: React.ReactNode;
}) {
  const button =
    size === "small"
      ? "h-7 w-7 text-sm"
      : "h-[clamp(1.9rem,3.2vmin,2.8rem)] w-[clamp(1.9rem,3.2vmin,2.8rem)] text-[clamp(0.9rem,1.6vmin,1.4rem)]";

  return (
    <div className="flex items-center justify-center gap-[0.6em]">
      <button
        type="button"
        onClick={(e) => {
          // The score often sits inside something else clickable.
          e.stopPropagation();
          onAdjust(-step);
        }}
        aria-label={`Take ${step} away`}
        title={`−${step}`}
        className={`${button} shrink-0 rounded-full border border-rose-400/50 font-display leading-none text-rose-300 transition-colors hover:border-rose-400 hover:bg-rose-500/25 active:bg-rose-500/40`}
      >
        −
      </button>

      {children}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdjust(step);
        }}
        aria-label={`Add ${step}`}
        title={`+${step}`}
        className={`${button} shrink-0 rounded-full border border-emerald-400/50 font-display leading-none text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/40`}
      >
        +
      </button>
    </div>
  );
}
