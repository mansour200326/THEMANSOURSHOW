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
      {/*
       * The middle of the stage is the wordmark and two buttons, nothing else.
       * The explanation used to sit between them, where the floating tiles ran
       * straight through it — it's a footnote now, out of the way at the
       * bottom, which is where anyone who wants it will look.
       */}
      <HeroStage footnote="Sixteen games · the TV is the stage, your phone is the controller · no downloads, no accounts">
        <ShowMark />

        <div className="mt-10 flex w-full flex-col items-stretch gap-4 sm:mt-12 sm:w-auto sm:flex-row">
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
        </div>

      </HeroStage>
    </main>
  );
}
