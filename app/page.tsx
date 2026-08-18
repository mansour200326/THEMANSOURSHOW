"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        <ShowMark />

        <p className="mt-8 max-w-2xl text-balance text-lg text-slate-400 sm:text-xl">
          The TV is the stage. Your phone is the controller. No downloads, no
          accounts, no app store.
        </p>

        <div className="mt-14 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={hostGame}
            disabled={opening}
            className="btn-cream px-10 py-5 text-xl sm:text-2xl"
          >
            {opening ? "Opening the room…" : "Host a game"}
          </button>
          <Link href="/play" className="btn-ghost px-10 py-5 text-xl sm:text-2xl">
            Join a game
          </Link>
        </div>

        <Link
          href="/jeopardy"
          className="mt-8 font-display text-sm uppercase tracking-[0.2em] text-slate-500 transition hover:text-cream-bright"
        >
          Team Jeopardy — no phones needed →
        </Link>
      </div>
    </main>
  );
}
