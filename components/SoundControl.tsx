"use client";

import { useEffect, useState } from "react";
import { isMuted, play, setMuted, unlockAudio } from "@/lib/sound";

/**
 * The sound control, on every screen.
 *
 * It used to live in the lobby only, which meant that the moment a game
 * started there was no sign the product had audio at all — nothing to check,
 * nothing to turn up, nothing to blame. It sits in the corner now, dim until
 * you go near it, on the landing page and in every game.
 *
 * It also carries the unlock. Browsers won't let a page make a sound until
 * somebody has interacted with it, and that first interaction can easily be on
 * a screen the old toggle wasn't rendered on — in which case the first cue
 * created a suspended context and the room heard nothing all night.
 */
export function SoundControl() {
  const [off, setOff] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOff(isMuted());
    setReady(true);
    unlockAudio();
  }, []);

  // Nothing during the server render, so the icon can't flash the wrong way.
  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const next = !off;
        setOff(next);
        setMuted(next);
        // Play the thing you just switched back on, so you know it worked.
        if (!next) play("correct");
      }}
      aria-label={off ? "Turn sound on" : "Turn sound off"}
      title={off ? "Sound is off" : "Sound is on"}
      className={[
        "fixed bottom-3 left-3 z-50 flex h-11 w-11 items-center justify-center rounded-full",
        "border text-lg transition-all duration-200",
        off
          ? "border-rose-500/40 bg-rose-950/60 opacity-70 hover:opacity-100"
          : "border-white/10 bg-midnight/70 opacity-35 hover:border-accent/50 hover:opacity-100",
      ].join(" ")}
    >
      {off ? "🔇" : "🔊"}
    </button>
  );
}
