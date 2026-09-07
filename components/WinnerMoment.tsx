"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { play } from "@/lib/sound";

/**
 * The name filling the screen, and confetti.
 *
 * This is the moment people photograph, and it was text and a chime. The
 * name comes in with a spring, a full win fanfare plays, and brand-coloured
 * confetti falls from the top for a few seconds. The particles are drawn on a
 * canvas from about forty lines of code rather than a library, so there is
 * nothing to load at the one moment that must not stall.
 *
 * The heading is real text underneath — the canvas sits behind it and takes
 * no pointer events — so a screen reader, a throttled tab, and a phone set
 * to reduce motion all still get the name.
 */
export function WinnerMoment({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    play("win");
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = (el.width = el.offsetWidth * dpr);
    const h = (el.height = el.offsetHeight * dpr);
    const COLOURS = ["#FF6B57", "#FF8D7C", "#F4F2EC", "#37D3C8", "#8E7CFF", "#A8E05F"];
    const bits = Array.from({ length: 160 }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h * 0.4,
      vx: (Math.random() - 0.5) * 2.4 * dpr,
      vy: (2 + Math.random() * 3.5) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      s: (6 + Math.random() * 8) * dpr,
      c: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    }));

    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      for (const b of bits) {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.03 * dpr;
        b.r += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.globalAlpha = t > 4200 ? Math.max(0, 1 - (t - 4200) / 800) : 1;
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      }
      if (t < 5000) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 h-full w-full"
      />
      <motion.h2
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="brand-text t-hero relative z-[31] text-balance font-display font-bold uppercase tracking-tight drop-shadow-[0_0_80px_rgba(255,107,87,0.45)]"
      >
        {children}
      </motion.h2>
    </div>
  );
}
