import "server-only";

import { query } from "@/lib/db";
import type { Plan } from "@/lib/plan/limits";

/**
 * The one place a plan changes.
 *
 * Right now the only caller is the admin script and the admin page. When
 * Stripe arrives its webhook calls exactly this, with source "stripe", and
 * nothing else in the app has to know that payments exist — the reason the
 * plan is two columns on the user rather than a subscription object is so
 * that swap is a webhook handler and not a refactor.
 *
 * Deliberately not idempotent-by-event-id: that belongs in the webhook
 * handler, which is the thing that will receive the same event twice.
 */
export type PlanSource = "signup" | "admin" | "stripe";

export async function setPlan(
  userId: string,
  plan: Plan,
  expiresAt: Date | null,
  source: PlanSource,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE users
        SET plan = $2, plan_expires_at = $3, plan_source = $4
      WHERE id = $1
      RETURNING id`,
    [userId, plan, expiresAt, source],
  );
  return rows.length > 0;
}

export async function setPlanByEmail(
  email: string,
  plan: Plan,
  expiresAt: Date | null,
  source: PlanSource,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE users
        SET plan = $2, plan_expires_at = $3, plan_source = $4
      WHERE lower(email) = lower($1)
      RETURNING id`,
    [email, plan, expiresAt, source],
  );
  return rows.length > 0;
}
