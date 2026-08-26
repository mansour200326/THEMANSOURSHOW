"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShowMark } from "@/components/ShowMark";
import { ENTITLEMENTS, type Gate, GATE_COPY } from "@/lib/plan/limits";

/**
 * What a host sees when they reach the edge of the free tier.
 *
 * Says what stopped them in the words of the thing they were trying to do,
 * and shows both columns so the trade is legible rather than implied. No
 * countdown, no "limited time", no dark pattern — the product either earns
 * twenty-five dirhams a month or it doesn't.
 */
export function UpgradeScreen({
  gate,
  signedIn,
}: {
  gate: Gate;
  signedIn: boolean;
}) {
  const copy = GATE_COPY[gate];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <Link href="/" className="self-start opacity-80 hover:opacity-100">
        <ShowMark size="sm" />
      </Link>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="t-label font-display uppercase text-moon-deep">Still here</p>
        <h1 className="brand-text mt-1 font-display text-[clamp(2rem,6vw,3.6rem)] font-bold uppercase leading-none tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-lg text-lg text-moon-dim">{copy.line}</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Column
          name="Free"
          lines={[
            `${ENTITLEMENTS.free.games} games`,
            `${ENTITLEMENTS.free.aiPerNight} written boards a night`,
            `${ENTITLEMENTS.free.players} phones`,
            "The bundled packs",
          ]}
        />
        <Column
          name="Pro Host"
          price="AED 25/month · 149/year"
          highlight
          lines={[
            "All sixteen games",
            "Write as many boards as you like",
            `${ENTITLEMENTS.pro.players} phones`,
            "Your own themes and questions",
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {signedIn ? (
          <p className="text-moon-dim">
            Payments aren&apos;t open yet — email hello@bignight.games and your
            account gets switched over by hand.
          </p>
        ) : (
          <Link href="/account/sign-in" className="btn-brand px-8 py-4 text-lg">
            Sign in to upgrade
          </Link>
        )}
        <Link href="/" className="btn-ghost px-6 py-4">
          Keep playing free
        </Link>
      </div>
    </main>
  );
}

function Column({
  name,
  price,
  lines,
  highlight,
}: {
  name: string;
  price?: string;
  lines: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border p-6",
        highlight
          ? "border-accent/60 bg-accent/[0.07]"
          : "border-white/12 bg-white/[0.03]",
      ].join(" ")}
    >
      <p
        className={[
          "font-display text-xl uppercase tracking-wide",
          highlight ? "text-accent-bright" : "text-moon",
        ].join(" ")}
      >
        {name}
      </p>
      {price && <p className="mt-1 text-sm text-moon-deep">{price}</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2 text-moon/80">
            <span className={highlight ? "text-accent" : "text-moon-deep"}>·</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
