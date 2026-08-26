import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { db, hasDatabase } from "@/lib/db";
import { type Plan, effectivePlan } from "@/lib/plan/limits";

/**
 * Signing in — for hosts, and only for hosts.
 *
 * Players never authenticate. The entire point of the product is that you
 * scan a code, type a name, and you're playing in eight seconds; putting a
 * login in front of that would be the single worst change anyone could make
 * to it. Accounts exist for one reason: to remember which host paid.
 *
 * Magic links, no passwords. A party host signs in roughly never, so a
 * password is a thing to forget rather than a thing to use, and passwords
 * mean storing hashes, reset flows, and breach liability for a product that
 * holds nothing worth stealing.
 *
 * Database sessions rather than JWTs, so revoking a plan takes effect on the
 * next request instead of whenever a token happens to expire.
 */

const pool = db();

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Without Postgres there is nowhere to put a user, so sign-in is simply
  // off — see lib/db for why that's a supported state rather than a failure.
  adapter: pool ? PostgresAdapter(pool) : undefined,
  session: { strategy: "database" },
  providers: hasDatabase()
    ? [
        Resend({
          apiKey: process.env.AUTH_RESEND_KEY,
          from: process.env.AUTH_EMAIL_FROM ?? "Big Night <hello@bignight.games>",
        }),
      ]
    : [],
  pages: {
    signIn: "/account/sign-in",
    verifyRequest: "/account/check-your-email",
    error: "/account/sign-in",
  },
  callbacks: {
    /**
     * The plan rides on the session so the UI doesn't have to ask separately
     * on every render. It's still re-read from the row on each request —
     * database sessions mean this callback runs against live data, so an
     * admin granting Pro takes effect immediately.
     */
    session({ session, user }) {
      const row = user as unknown as {
        plan?: Plan;
        plan_expires_at?: Date | null;
      };
      session.user.id = user.id;
      session.user.plan = effectivePlan(row.plan, row.plan_expires_at);
      session.user.planExpiresAt = row.plan_expires_at ?? null;
      return session;
    },
  },
});
