"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroStage } from "@/components/HeroStage";
import { ShowMark } from "@/components/ShowMark";

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
    <main>
      <HeroStage>
        <ShowMark />

        <p className="mt-8 max-w-2xl text-balance text-center text-lg text-slate-400 sm:text-xl">
          Six party games on one screen. The TV is the stage, your phone is the
          controller — no downloads, no accounts.
        </p>

        <div className="mt-12 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={hostGame}
            disabled={opening}
            className="btn-cream px-12 py-5 text-xl sm:text-2xl"
          >
            {opening ? "Opening the room…" : "Host a game"}
          </button>
          <Link href="/play" className="btn-ghost px-12 py-5 text-xl sm:text-2xl">
            Join a game
          </Link>
        </div>

        <p className="mt-8 text-center font-display text-xs uppercase tracking-[0.2em] text-slate-600">
          Every game lives inside Host — phones optional
        </p>
      </HeroStage>
    </main>
  );
}
