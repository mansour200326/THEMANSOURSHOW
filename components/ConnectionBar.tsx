"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Connection, watchConnection } from "@/lib/room/useRoom";

/**
 * Says out loud when the screen has stopped listening.
 *
 * The connection state was already being tracked and nothing ever read it, so
 * a phone that lost its stream just sat there showing the last thing it heard
 * — indistinguishable from a game where nothing was happening. People tapped
 * dead buttons and decided the game was broken. EventSource is already trying
 * to reconnect underneath; this only makes the trying visible.
 */
export function ConnectionBar() {
  const [status, setStatus] = useState<Connection>("connecting");
  useEffect(() => watchConnection(setStatus), []);

  return (
    <AnimatePresence>
      {status === "lost" && (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          className="fixed inset-x-0 top-0 z-50 bg-rose-600/90 px-4 py-2 text-center font-display text-sm uppercase tracking-widest text-white shadow-lg"
        >
          Lost the room — reconnecting…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
