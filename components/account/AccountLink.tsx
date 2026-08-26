"use client";

import Link from "next/link";
import { useEntitlements } from "@/lib/plan/useEntitlements";

/**
 * The way in to an account, for the one person in the room who might want one.
 *
 * Deliberately small and deliberately in a corner. Every other party-games
 * product opens with a sign-up wall, and not having one is the single best
 * thing about this one — so this has to be findable by a host looking for it
 * and invisible to the nine people who are only here to play.
 *
 * It hides itself entirely when there's no database, because an account you
 * can't create is worse than no link at all.
 */
export function AccountLink({ className = "" }: { className?: string }) {
  const me = useEntitlements();
  if (me.open) return null;

  return (
    <Link
      href={me.signedIn ? "/account" : "/account/sign-in"}
      className={[
        "font-display text-xs uppercase tracking-[0.25em] text-moon-deep transition-colors hover:text-moon",
        className,
      ].join(" ")}
    >
      {me.signedIn ? (me.plan === "pro" ? "Pro Host" : "Account") : "Host sign-in"}
    </Link>
  );
}
