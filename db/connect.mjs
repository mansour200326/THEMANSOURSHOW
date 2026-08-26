import pg from "pg";

/**
 * How the command-line scripts reach the database.
 *
 * Shared so the three of them can't drift apart on the SSL rule, which they
 * already had: two of them treated "localhost" as local and none of them
 * recognised 127.0.0.1, so the same database reached by its address instead
 * of its name failed with a confusing error about SSL support.
 */
export function localish(url) {
  return /(?:^|@|\/\/)(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/.test(url);
}

export async function connect() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: url,
    // Managed Postgres presents a certificate signed by its own authority.
    // The connection is encrypted either way; it just isn't verified against
    // a public root.
    ssl: localish(url) ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}
