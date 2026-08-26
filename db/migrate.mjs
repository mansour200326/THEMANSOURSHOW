#!/usr/bin/env node
/**
 * Applies every migration in db/migrations, in order, once.
 *
 * Deliberately not a framework. There is one schema, it changes rarely, and
 * a migration tool would be more moving parts than the thing it migrates.
 * Applied files are recorded so re-running is free, and each file runs inside
 * a transaction so a half-applied migration isn't a state you can reach.
 *
 *   npm run db:migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { connect } from "./connect.mjs";

/*
 * No database is a supported state — the games all work without one — so this
 * is a no-op rather than an error. It runs in front of `next start`, and
 * refusing to start a deployment that never wanted Postgres would be a worse
 * failure than not migrating.
 */
if (!process.env.DATABASE_URL?.trim()) {
  console.log("[migrate] no DATABASE_URL — nothing to migrate against.");
  process.exit(0);
}

const client = await connect();
await client.query(`
  CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

const dir = join(process.cwd(), "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const { rows } = await client.query("SELECT name FROM migrations");
const applied = new Set(rows.map((r) => r.name));

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  · ${file} (already applied)`);
    continue;
  }
  process.stdout.write(`  → ${file} `);
  try {
    await client.query("BEGIN");
    await client.query(readFileSync(join(dir, file), "utf8"));
    await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("ok");
    ran++;
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("FAILED");
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

console.log(ran ? `\n${ran} migration(s) applied.` : "\nNothing to do.");
await client.end();
