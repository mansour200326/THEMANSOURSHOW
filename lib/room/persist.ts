import "server-only";

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Room } from "@/lib/room/types";

/**
 * Rooms, written to disk so a restart doesn't end the night.
 *
 * They live in this process's memory, which was the right call — one machine
 * serving one living room needs no Redis and no accounts. The cost was that
 * every restart destroyed every room: deploying a fix mid-party disconnected
 * everyone permanently, with no way to rejoin, and the codes on the TV became
 * meaningless.
 *
 * So memory stays the source of truth and this is only a crash mat. Writes are
 * debounced and atomic; reads happen once at boot. If the file is missing,
 * unreadable or from an incompatible version, the server starts empty — which
 * is exactly what it did before, so a broken snapshot can never be worse than
 * no snapshot.
 *
 * BIGNIGHT_STATE_DIR points this at a mounted volume. Without one it writes
 * beside the build, which survives a restart but not a redeploy — still better
 * than nothing, and the log says which you're getting.
 */

const VERSION = 1;
const WRITE_DEBOUNCE_MS = 400;
/** A room nobody has touched in this long isn't worth restoring. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const file = join(
  process.env.BIGNIGHT_STATE_DIR?.trim() || join(process.cwd(), ".bignight"),
  "rooms.json",
);

let timer: ReturnType<typeof setTimeout> | null = null;
let announced = false;

type Snapshot = {
  version: number;
  savedAt: number;
  rooms: Room[];
};

/** Everything the room needs to come back, and nothing that can't be JSON. */
export function loadRooms(): Room[] {
  try {
    if (!existsSync(file)) return [];
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Snapshot;
    if (parsed?.version !== VERSION || !Array.isArray(parsed.rooms)) return [];
    const cutoff = Date.now() - MAX_AGE_MS;
    const usable = parsed.rooms.filter(
      (r) => r && typeof r.code === "string" && (r.createdAt ?? 0) > cutoff,
    );
    if (usable.length) {
      console.log(`[rooms] restored ${usable.length} room(s) from ${file}`);
    }
    return usable;
  } catch (error) {
    // A snapshot that won't parse is worth exactly as much as no snapshot.
    console.warn("[rooms] could not restore, starting empty:", error);
    return [];
  }
}

/**
 * Queue a write. Debounced because a drawing in progress mutates the room
 * about eleven times a second and none of those need their own fsync.
 */
export function saveRooms(all: Iterable<Room>) {
  if (!announced) {
    announced = true;
    console.log(
      process.env.BIGNIGHT_STATE_DIR
        ? `[rooms] persisting to ${file}`
        : `[rooms] persisting to ${file} — set BIGNIGHT_STATE_DIR to a mounted volume to survive redeploys`,
    );
  }

  const rooms = [...all];
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    try {
      mkdirSync(dirname(file), { recursive: true });
      const snapshot: Snapshot = { version: VERSION, savedAt: Date.now(), rooms };
      // Write beside it and rename, so a crash mid-write can't leave a
      // half-written file where a good one used to be.
      const temp = `${file}.tmp`;
      writeFileSync(temp, JSON.stringify(snapshot));
      renameSync(temp, file);
    } catch (error) {
      // Losing the crash mat is not a reason to lose the game.
      console.warn("[rooms] could not save:", error);
    }
  }, WRITE_DEBOUNCE_MS);
}
