#!/usr/bin/env node
/**
 * A throwaway Postgres for local development, speaking the real wire protocol.
 *
 * There is no Postgres on this machine and no Docker to run one in, which
 * would otherwise mean the accounts-and-library half of the app could only be
 * tested by deploying it. PGlite is Postgres compiled to WebAssembly; putting
 * a socket in front of it means the actual `pg` driver, the actual Auth.js
 * adapter and the actual queries all run unmodified against something that
 * parses SQL exactly as the real thing does.
 *
 * Not for production, obviously — it's in-memory and single-connection.
 *
 *   node db/dev/local-postgres.mjs
 *   DATABASE_URL=postgres://postgres@localhost:5433/postgres npm run dev
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.PGLITE_PORT ?? 5433);
const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();

console.log(`postgres (pglite) listening on 127.0.0.1:${port}`);
console.log(`DATABASE_URL=postgres://postgres@127.0.0.1:${port}/postgres`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
