import "server-only";

import { Pool } from "pg";

/**
 * The database connection, and the decision that it's allowed to be absent.
 *
 * Big Night ran for months with no database at all: rooms in memory, packs in
 * localStorage, no accounts. Accounts and the content library need Postgres,
 * but a missing DATABASE_URL must not take the party down — so everything
 * here returns null rather than throwing, and every caller is written to work
 * without it.
 *
 * What you lose without a database is precisely: signing in, plans, and the
 * library. What still works is every game, every room, and every phone. That
 * is deliberate; the games are the product and they predate all of this.
 *
 * The one sharp edge: with no database nobody can hold a Pro plan, so plan
 * gating is switched off entirely rather than locking everyone out of a
 * product that used to be open. It says so at boot, loudly, once.
 */

const url = process.env.DATABASE_URL?.trim();

const g = globalThis as unknown as { __bnPool?: Pool | null };

function connect(): Pool | null {
  if (!url) return null;
  const pool = new Pool({
    connectionString: url,
    // Railway's managed Postgres presents a certificate signed by its own
    // authority, which Node won't trust out of the box. The connection is
    // still encrypted; it just isn't verified against a public root.
    ssl: url.includes("localhost") || url.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });
  // A pool that emits an unhandled 'error' takes the process with it.
  pool.on("error", (error) => console.error("[db] idle client error:", error));
  return pool;
}

export function db(): Pool | null {
  if (g.__bnPool === undefined) {
    g.__bnPool = connect();
    console.log(
      g.__bnPool
        ? "[db] connected — accounts, plans and the library are on"
        : "[db] no DATABASE_URL — running open: no sign-in, no plans, no library",
    );
  }
  return g.__bnPool;
}

/** True when accounts and the library are available at all. */
export const hasDatabase = () => Boolean(url);

/**
 * Run a query, or give back nothing if there's no database. Callers treat an
 * empty result and an absent database the same way, which is what keeps the
 * "works without Postgres" promise from turning into null checks everywhere.
 */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = db();
  if (!pool) return [];
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    // A library miss costs a model call. A library *crash* should cost the
    // same and nothing more.
    console.error("[db] query failed:", error);
    return [];
  }
}
