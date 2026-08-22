"use client";

import { useEffect, useState } from "react";
import { isMuted, play, setMuted, unlockAudio } from "@/lib/sound";

/**
 * Mute, for the flat above and for whoever is trying to sleep. Reads its state
 * after mount rather than during render — the answer lives in localStorage, and
 * guessing it on the server would flash the wrong icon on load.
 */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    setOff(isMuted());
    unlockAudio();
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !off;
        setOff(next);
        setMuted(next);
        // Play the thing you just switched back on, so you know it worked.
        if (!next) play("pop");
      }}
      aria-label={off ? "Turn sound on" : "Turn sound off"}
      title={off ? "Sound off" : "Sound on"}
      className={`btn-ghost px-3 py-1.5 text-xs ${className}`}
    >
      {off ? "🔇" : "🔊"}
    </button>
  );
}
