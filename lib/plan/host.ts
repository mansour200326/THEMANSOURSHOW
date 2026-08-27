import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { hasDatabase, query } from "@/lib/db";
import { plansEnforced } from "@/lib/plan/enforcement";
import { ANON_COOKIE } from "@/middleware";
import {
  type Entitlements,
  type Plan,
  NIGHT_MS,
  entitlementsFor,
} from "@/lib/plan/limits";

/**
 * Who is hosting, and what they're allowed to do.
 *
 * A host is one of two things and the rest of the app shouldn't care which: a
 * signed-in user, or a browser with a cookie. Both can be served from the
 * library, both have a history of what they've seen, both have a plan — it's
 * just that the cookie's plan is always free, because there's nobody to bill.
 */
export type Host = {
  userId: string | null;
  anonId: string | null;
  plan: Plan;
  entitlements: Entitlements;
  /**
   * Nothing is being enforced — either because there's no database to hold an
   * account, or because plans are switched off. The screens read this to know
   * not to mention tiers at all.
   */
  open: boolean;
};

export async function currentHost(): Promise<Host> {
  /*
   * Two reasons nothing gets enforced. No database means there is nobody who
   * *could* be Pro, and locking every host out of a product that has been
   * open since it was written would be a strange way to introduce accounts.
   * Plans being off is the deliberate one — see lib/plan/enforcement.ts.
   *
   * Identity is still resolved either way, because the library needs to know
   * who it has already served even when nobody is paying for anything.
   */
  const enforcing = hasDatabase() && plansEnforced();

  const session = hasDatabase() ? await auth() : null;
  const anonId = (await cookies()).get(ANON_COOKIE)?.value ?? null;
  const stored = session?.user?.plan ?? "free";
  const plan: Plan = enforcing ? stored : "pro";

  return {
    userId: session?.user?.id ?? null,
    anonId: session?.user?.id ? null : anonId,
    plan,
    entitlements: entitlementsFor(plan),
    open: !enforcing,
  };
}

/** The two columns that identify a host in every table that references one. */
export const hostKey = (host: Host) => ({
  userId: host.userId,
  anonId: host.userId ? null : host.anonId,
});

/**
 * How many boards this host has had written tonight.
 *
 * Counted from the log rather than held in memory, because the limit it feeds
 * is the one people have the strongest incentive to reset by refreshing.
 */
export async function generationsTonight(host: Host): Promise<number> {
  const since = new Date(Date.now() - NIGHT_MS);
  const { userId, anonId } = hostKey(host);
  if (!userId && !anonId) return 0;

  const rows = await query<{ n: string }>(
    userId
      ? `SELECT count(*)::text AS n FROM generation_log WHERE user_id = $1 AND at > $2`
      : `SELECT count(*)::text AS n FROM generation_log WHERE anon_id = $1 AND at > $2`,
    [userId ?? anonId, since],
  );
  return Number(rows[0]?.n ?? 0);
}

/** True when this host may have something written for them right now. */
export async function mayGenerate(host: Host): Promise<boolean> {
  const allowed = host.entitlements.aiPerNight;
  if (allowed === "unlimited") return true;
  return (await generationsTonight(host)) < allowed;
}

export async function recordGeneration(host: Host, gameType: string) {
  const { userId, anonId } = hostKey(host);
  if (!userId && !anonId) return;
  await query(
    `INSERT INTO generation_log (user_id, anon_id, game_type) VALUES ($1, $2, $3)`,
    [userId, anonId, gameType],
  );
}
