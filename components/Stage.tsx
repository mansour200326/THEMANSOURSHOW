"use client";

import { motion } from "framer-motion";

/**
 * How every screen arrives.
 *
 * Screens used to swap hard, which made a night feel like fourteen separate
 * apps. Every screen the host or a player sees now comes in the same way:
 * a short rise, nothing else. Transform only — never opacity — because an
 * entrance that fades from nothing hides the content until the animation
 * runs, and on a throttled tab or a phone set to reduce motion it doesn't.
 * The rise is a courtesy. The content is there the frame it mounts.
 */
export function Stage({
  id,
  children,
  className = "",
}: {
  /** Changes when the screen does, so the entrance plays once per screen. */
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      key={id}
      initial={{ y: 14, scale: 0.992 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.7 }}
      className={`min-h-dvh ${className}`}
    >
      {children}
    </motion.div>
  );
}
