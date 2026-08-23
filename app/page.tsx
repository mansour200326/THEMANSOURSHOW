"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroStage } from "@/components/HeroStage";
import { IMPACT, ShowMark } from "@/components/ShowMark";

export default function Home() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const hostGame = async () => {
    setOpening(true);
    try {
      const res = await fetch("/api/room", { method: "POST" });
      const { code } = await res.json();
      router.push(`/host/${code}`);
    } catch {
      setOpening(false);
    }
  };

  return (
    <main className="relative">
      {/*
       * The middle of the stage is the wordmark and two buttons, nothing else.
       * The explanation used to sit between them, where the floating tiles ran
       * straight through it — it's a footnote now, out of the way at the
       * bottom, which is where anyone who wants it will look.
       */}
      <HeroStage footnote="Sixteen games · the TV is the stage, your phone is the controller · no downloads, no accounts">
        <ShowMark />

        {/* Straight in behind the blast, not a polite fade afterwards. */}
        <motion.div
          className="mt-10 flex w-full flex-col items-stretch gap-4 sm:mt-12 sm:w-auto sm:flex-row"
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: IMPACT + 0.18,
          }}
        >
          <button
            type="button"
            onClick={hostGame}
            disabled={opening}
            className="btn-brand px-12 py-5 text-xl sm:text-2xl"
          >
            {opening ? "Opening the room…" : "Host a game"}
          </button>
          <Link href="/play" className="btn-ghost px-12 py-5 text-xl sm:text-2xl">
            Join a game
          </Link>
        </motion.div>
      </HeroStage>
    </main>
  );
}
