"use client";

import { useEffect, useRef } from "react";
import { type Stroke, strokeColour, strokeWidth } from "@/lib/games/sketch";

/**
 * Draws the strokes on a square canvas, in the 0-1000 grid space they're
 * stored in. Shared by the TV and the drawer's phone so the two can't drift.
 */
export function SketchCanvas({
  strokes,
  live,
  className,
  colour = 0,
  width = 1,
  onStroke,
  onLift,
}: {
  strokes: Stroke[];
  live: Stroke;
  className?: string;
  /** Index into SKETCH_COLOURS — only used by the canvas being drawn on. */
  colour?: number;
  /** Index into SKETCH_WIDTHS — likewise. */
  width?: number;
  /** Present when this canvas is the one being drawn on. */
  onStroke?: (points: number[], colour: number, width: number) => void;
  onLift?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pending = useRef<number[]>([]);
  /** The pointer that owns the stroke in progress. */
  const active = useRef<number | null>(null);
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

    const paint = (stroke: Stroke) => {
      if (stroke.p.length < 4) return;
      ctx.strokeStyle = strokeColour(stroke);
      // Width is a fraction of the canvas, so the same line is the same
      // weight on the drawer's phone and on the TV.
      ctx.lineWidth = Math.max(1.5, strokeWidth(stroke) * size);
      ctx.beginPath();
      for (let i = 0; i < stroke.p.length; i += 2) {
        const x = (stroke.p[i] / 1000) * size;
        const y = (stroke.p[i + 1] / 1000) * size;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    strokes.forEach(paint);
    paint(live);
  }, [strokes, live]);

  /* ------------------------------------------------------------- input */

  /**
   * Coordinates are clamped to the canvas rather than thrown away when they
   * fall outside it. Dropping them meant a finger that strayed over the edge
   * and came back drew a straight line between the two places it was last
   * seen — one of the two ways a line appeared that nobody had drawn.
   */
  const point = (e: React.PointerEvent) => {
    const el = canvas.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const clamp = (n: number) => Math.round(Math.min(1000, Math.max(0, n)));
    return [
      clamp(((e.clientX - box.left) / box.width) * 1000),
      clamp(((e.clientY - box.top) / box.height) * 1000),
    ];
  };

  /**
   * Points are batched before they're sent. Every send is a room mutation and
   * a broadcast to everyone watching, so posting per-pointermove would put
   * a hundred snapshots a second on the wire for one wobbly line.
   */
  const flush = () => {
    if (!pending.current.length || !onStroke) return;
    onStroke(pending.current, colour, width);
    pending.current = [];
  };

  /*
   * One finger draws. The other way a line appeared on its own was a second
   * touch — a palm on the screen, a thumb steadying the phone — because every
   * pointer event was accepted regardless of which pointer it came from, so
   * two contact points were merged into a single stroke and the line shot
   * across the canvas between them. Only the pointer that began the stroke is
   * listened to now, and nothing else can start one while it's down.
   */
  const start = (e: React.PointerEvent) => {
    if (!onStroke) return;
    if (active.current !== null) return; // already drawing with another finger
    if (e.isPrimary === false) return;
    const p = point(e);
    if (!p) return;
    active.current = e.pointerId;
    drawing.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pending.current = [...p];
    flush();
    flusher.current = window.setInterval(flush, 90);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !onStroke) return;
    if (e.pointerId !== active.current) return;
    const p = point(e);
    if (p) pending.current.push(...p);
  };

  const end = (e?: React.PointerEvent) => {
    if (!drawing.current) return;
    if (e && e.pointerId !== active.current) return;
    drawing.current = false;
    active.current = null;
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
      className={[
        // Paper, not a screen. Ink needs something to be ink on.
        "aspect-square touch-none rounded-2xl border border-white/15 bg-[#F4F2EC] shadow-tile",
        className ?? "",
      ].join(" ")}
    />
  );
}
