"use client";

import { useEffect, useRef } from "react";
import type { Stroke } from "@/lib/games/sketch";

/**
 * Draws the strokes on a square canvas, in the 0-1000 grid space they're
 * stored in. Shared by the TV and the drawer's phone so the two can't drift.
 */
export function SketchCanvas({
  strokes,
  live,
  className,
  onStroke,
  onLift,
}: {
  strokes: Stroke[];
  live: Stroke;
  className?: string;
  /** Present when this canvas is the one being drawn on. */
  onStroke?: (points: number[]) => void;
  onLift?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pending = useRef<number[]>([]);
  const flusher = useRef<number | null>(null);

  /* ------------------------------------------------------------ painting */
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    // Match the backing store to the box so nothing looks soft on a 4K TV.
    const box = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.max(1, Math.floor(Math.min(box.width, box.height) * dpr));
    if (el.width !== size) {
      el.width = size;
      el.height = size;
    }

    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, size / 140);
    ctx.strokeStyle = getComputedStyle(el).getPropertyValue("color") || "#fff";

    const paint = (stroke: Stroke) => {
      if (stroke.length < 4) return;
      ctx.beginPath();
      for (let i = 0; i < stroke.length; i += 2) {
        const x = (stroke[i] / 1000) * size;
        const y = (stroke[i + 1] / 1000) * size;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    strokes.forEach(paint);
    paint(live);
  }, [strokes, live]);

  /* ------------------------------------------------------------- input */
  const point = (e: React.PointerEvent) => {
    const el = canvas.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 1000;
    const y = ((e.clientY - box.top) / box.height) * 1000;
    if (x < 0 || x > 1000 || y < 0 || y > 1000) return null;
    return [Math.round(x), Math.round(y)];
  };

  /**
   * Points are batched before they're sent. Every send is a room mutation and
   * a broadcast to everyone watching, so posting per-pointermove would put
   * a hundred snapshots a second on the wire for one wobbly line.
   */
  const flush = () => {
    if (!pending.current.length || !onStroke) return;
    onStroke(pending.current);
    pending.current = [];
  };

  const start = (e: React.PointerEvent) => {
    if (!onStroke) return;
    const p = point(e);
    if (!p) return;
    drawing.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pending.current.push(...p);
    flush();
    flusher.current = window.setInterval(flush, 90);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !onStroke) return;
    const p = point(e);
    if (p) pending.current.push(...p);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (flusher.current) window.clearInterval(flusher.current);
    flusher.current = null;
    flush();
    onLift?.();
  };

  useEffect(
    () => () => {
      if (flusher.current) window.clearInterval(flusher.current);
    },
    [],
  );

  return (
    <canvas
      ref={canvas}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      className={[
        "aspect-square touch-none rounded-2xl border border-white/10 bg-dusk/60 text-accent",
        className ?? "",
      ].join(" ")}
    />
  );
}
