"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeroStage } from "@/components/HeroStage";
import { IMPACT, ShowMark } from "@/components/ShowMark";
import { AccountLink } from "@/components/account/AccountLink";
import { Onboarding, useFirstVisit } from "@/components/Onboarding";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const [firstVisit, dismissOnboarding] = useFirstVisit();
  const [showHow, setShowHow] = useState(false);

  /*
   * The first-visit explainer waits for the intro. The logo blast is the
   * first thing anybody sees of Big Night and it was being covered by a
   * dialog at frame one — the one moment the product gets to make an
   * entrance, spent behind a modal. Now the blast lands, the buttons settle,
   * and then the scene comes in.
   */
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setIntroDone(true), (IMPACT + 1.6) * 1000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <main className="relative">
      {/* Top right: the lights, and the only entrance to an account. */}
      <div className="absolute right-5 top-5 z-20 flex items-center gap-3">
        <AccountLink />
        <ThemeToggle prominent />
      </div>
      {/*
        * A button, not a footnote. Set in the same grey as the legal line it
        * looked like exactly that, and a first-time host is the one person
        * who most needs to notice it.
        */}
      <button
        onClick={() => setShowHow(true)}
        className="btn-accent absolute left-5 top-5 z-20 px-5 py-2.5 text-sm"
      >
        ▶ How it works
      </button>
      {((firstVisit && introDone) || showHow) && (
        <Onboarding
          onDone={() => {
            dismissOnboarding();
            setShowHow(false);
          }}
        />
      )}
      {/*
       * The middle of the stage is the wordmark and two buttons, nothing else.
       * The explanation used to sit between them, where the floating tiles ran
       * straight through it — it's a footnote now, out of the way at the
       * bottom, which is where anyone who wants it will look.
       */}
      <HeroStage footnote="Thirteen games · the TV is the stage, your phone is the controller · no downloads, no accounts">
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
