"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that rolls up to its new value instead of jumping to it.
 *
 * Points landing instantly is the difference between "the scoreboard changed"
 * and "we just scored" — the couple of hundred milliseconds of counting is
 * where the reaction happens. Deliberately quick: a long count on a TV means
 * the room is watching a number instead of playing.
 */
export function Tally({
  value,
  className,
  duration = 550,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;

    // A first paint, a reconnect, or a reset to zero shouldn't count.
    if (value === 0 || Math.abs(value - start) > 100000) {
      from.current = value;
      setShown(value);
      return;
    }

    // A backgrounded tab gets no animation frames at all, so counting there
    // would leave the scoreboard showing a stale number until someone came
    // back to it. Being right matters more than the flourish.
    if (typeof document !== "undefined" && document.hidden) {
      from.current = value;
      setShown(value);
      return;
    }

    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      // Fast out of the gate, easing into the final number.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        from.current = value;
      }
    };
    frame.current = requestAnimationFrame(step);

    // Belt and braces: if the frames stop coming — the tab is hidden, the
    // renderer is throttled — land on the real number anyway.
    const settle = window.setTimeout(() => {
      from.current = value;
      setShown(value);
    }, duration + 150);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(settle);
      from.current = value;
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {shown.toLocaleString()}
    </span>
  );
}
