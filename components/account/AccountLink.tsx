"use client";

import Link from "next/link";
import { useEntitlements } from "@/lib/plan/useEntitlements";

/**
 * The way in to an account, for the one person in the room who might want one.
 *
 * Players never sign in — scan, name, play — so this is for the host, and it
 * says so. It used to hide whenever plans weren't enforced, which is always
 * now, so nobody could find it; but an account isn't only for paying. It's
 * how the questions a host has played follow them from the TV to the laptop,
 * so nothing repeats. It hides only when there's no database, because an
 * account you can't create is worse than no link at all.
 */
export function AccountLink({ className = "" }: { className?: string }) {
  const me = useEntitlements();
  if (!me.canSignIn) return null;

  return (
    <Link
      href={me.signedIn ? "/account" : "/account/sign-in"}
      className={`btn-ghost ${className || "px-4 py-2.5 text-sm"}`}
    >
      {me.signedIn ? (me.plan === "pro" && !me.open ? "👤 Pro Host" : "👤 Signed in") : "👤 Host sign-in"}
    </Link>
  );
}
