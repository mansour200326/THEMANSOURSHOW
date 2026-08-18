"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * The cold open. A field of game-board tiles floating in real 3D space behind
 * the logo — CSS perspective rather than WebGL, so it costs nothing to load and
 * still runs at 60fps on a TV browser. The whole rig leans toward the pointer.
 */

type Tile = {
  x: number;
  y: number;
  z: number;
  label: string;
  delay: number;
  spin: number;
};

const LABELS = ["100", "200", "300", "400", "500", "?", "✗", "✓", "200", "400"];

/** Deterministic layout — random here would desync server and client render. */
const TILES: Tile[] = LABELS.map((label, i) => {
  const angle = (i / LABELS.length) * Math.PI * 2;
  const radius = 30 + (i % 3) * 9;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * (radius * 0.42) - 4,
    z: -180 + (i % 4) * 110,
    label,
    delay: i * 0.09,
    spin: i % 2 === 0 ? 1 : -1,
  };
});

export function HeroStage({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Pointer drives the parallax; springs keep it from feeling twitchy.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotY = useSpring(useTransform(px, [-1, 1], [14, -14]), {
    stiffness: 60,
    damping: 18,
  });
  const rotX = useSpring(useTransform(py, [-1, 1], [-10, 10]), {
    stiffness: 60,
    damping: 18,
  });

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r) return;
      px.set(((e.clientX - r.left) / r.width) * 2 - 1);
      py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  return (
    <div
      ref={wrap}
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden"
      style={{ perspective: "1100px" }}
    >
      {/* Floating tiles */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ transformStyle: "preserve-3d", rotateX: rotX, rotateY: rotY }}
      >
        {TILES.map((tile, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0 }}
            animate={
              ready
                ? {
                    opacity: 1,
                    x: [`${tile.x}vmin`, `${tile.x + 1.5 * tile.spin}vmin`, `${tile.x}vmin`],
                    y: [`${tile.y}vmin`, `${tile.y - 2.5}vmin`, `${tile.y}vmin`],
                  }
                : {}
            }
            transition={{
              opacity: { duration: 1.1, delay: tile.delay },
              x: { duration: 11 + i, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 8 + i * 0.7, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <motion.div
              className="tile-face flex items-center justify-center rounded-xl border border-white/10 shadow-tile"
              style={{
                width: "13vmin",
                height: "9vmin",
                translateZ: tile.z,
                // Depth cue: distant tiles sit back and fade out.
                opacity: 0.3 + (tile.z + 180) / 780,
              }}
              animate={ready ? { rotateY: [0, 18 * tile.spin, 0] } : {}}
              transition={{
                duration: 13 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="cream-text font-display text-[3.4vmin] font-bold tabular-nums">
                {tile.label}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Spotlight sweep across the stage */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60vmin 60vmin at 50% 40%, rgba(240,228,198,0.10), transparent 65%)",
        }}
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content rides slightly in front of the tiles */}
      <motion.div
        className="relative z-10 flex w-full flex-col items-center px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
