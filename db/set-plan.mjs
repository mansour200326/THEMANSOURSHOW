#!/usr/bin/env node
/**
 * Grant or revoke Pro, by hand.
 *
 * Stripe isn't wired up yet and this is how a plan changes until it is. It
 * writes the same two columns a webhook will write and nothing else, so when
 * payments land, the webhook replaces this script rather than working
 * alongside it — see lib/plan/billing.ts, which both go through.
 *
 *   npm run plan -- someone@example.com pro 12     (pro, 12 months)
 *   npm run plan -- someone@example.com pro        (pro, no expiry)
 *   npm run plan -- someone@example.com free       (back to free)
 *   npm run plan -- --list                         (who's on what)
 */
import { connect } from "./connect.mjs";

const client = await connect();

const [email, plan = "pro", months] = process.argv.slice(2);

if (!email || email === "--list") {
  const { rows } = await client.query(
    `SELECT email, plan, plan_expires_at, plan_source, created_at
       FROM users ORDER BY created_at DESC LIMIT 50`,
  );
  if (!rows.length) console.log("No accounts yet.");
  for (const r of rows) {
    const until = r.plan_expires_at
      ? ` until ${new Date(r.plan_expires_at).toISOString().slice(0, 10)}`
      : "";
    console.log(`  ${r.plan.padEnd(4)} ${r.email}${until}  (${r.plan_source})`);
  }
  await client.end();
  process.exit(0);
}

if (plan !== "free" && plan !== "pro") {
  console.error(`Plan must be "free" or "pro", not "${plan}".`);
  await client.end();
  process.exit(1);
}

const expires =
  plan === "pro" && months
    ? new Date(Date.now() + Number(months) * 30 * 24 * 60 * 60 * 1000)
    : null;

const { rows } = await client.query(
  `UPDATE users
      SET plan = $2, plan_expires_at = $3, plan_source = 'admin'
    WHERE lower(email) = lower($1)
    RETURNING email, plan, plan_expires_at`,
  [email, plan, expires],
);

if (!rows.length) {
  console.error(`No account for ${email}. They have to sign in once first.`);
  await client.end();
  process.exit(1);
}

const r = rows[0];
console.log(
  `${r.email} is now ${r.plan}${
    r.plan_expires_at
      ? ` until ${new Date(r.plan_expires_at).toISOString().slice(0, 10)}`
      : " with no expiry"
  }.`,
);
await client.end();
