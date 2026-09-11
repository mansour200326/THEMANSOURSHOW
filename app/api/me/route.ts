import { NextResponse } from "next/server";
import { currentHost, generationsTonight } from "@/lib/plan/host";
import { FREE_GAME_IDS } from "@/lib/plan/limits";
import { hasDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What this browser is allowed to do, for the screens that have to show it.
 *
 * The lobby needs to know which cards to mark as Pro before anybody taps one;
 * a card that looks available and then refuses is a worse experience than a
 * card that says what it is. The server still enforces all of this — this
 * endpoint exists so the UI can be honest, not so it can be trusted.
 */
export async function GET() {
  const host = await currentHost();
  return NextResponse.json({
    plan: host.plan,
    open: host.open,
    // Plans can be off while accounts are on: an account remembers what a
    // host has played, on every device they sign in on, plan or no plan.
    canSignIn: hasDatabase(),
    signedIn: Boolean(host.userId),
    freeGameIds: FREE_GAME_IDS,
    entitlements: host.entitlements,
    generationsTonight: await generationsTonight(host),
  });
}
