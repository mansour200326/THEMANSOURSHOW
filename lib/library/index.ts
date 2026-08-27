import "server-only";

import { hasDatabase, query } from "@/lib/db";
import { type Host, hostKey } from "@/lib/plan/host";
import { normalizeTheme, originalTheme } from "@/lib/library/theme";

/**
 * The content library: written once, played many times.
 *
 * Every board and prompt pack the model writes is kept. The next host who
 * asks for the same thing gets it instantly and for nothing, which is the
 * difference between "pick a theme and wait ninety seconds" and "pick a theme
 * and play". The model becomes the refill for a shelf rather than the shelf.
 *
 * Three rules make it safe to serve somebody else's board:
 *
 *  1. Personal content never leaves its author. A board about your friends by
 *     name is worthless to strangers and mortifying if it reaches them. The
 *     model flags this in the same call that writes the content.
 *  2. Nobody is served the same board twice — that's what seen_boards is for.
 *  3. Boards people keep skipping stop being served. Quietly, and without
 *     being deleted, because why a board was bad is worth reading later.
 */

export type StoredBoard<T = unknown> = {
  id: string;
  content: T;
  isPersonal: boolean;
};

/**
 * How bad a board has to be before it stops being offered.
 *
 * Needs a real sample first — one skip out of one serve means nothing, and
 * retiring on it would kill good boards that happened to meet a host who'd
 * changed their mind. After five serves, a board skipped more than half the
 * time is a board nobody is enjoying.
 */
const RETIRE_AFTER_SERVES = 5;
const RETIRE_SKIP_RATIO = 0.5;

type Row = {
  id: string;
  content_json: unknown;
  is_personal: boolean;
};

/**
 * Find something already written for this request that this host hasn't seen.
 *
 * Personal boards are included only when this host wrote them, so your own
 * roast night comes back to you and to nobody else. Least-served first, so a
 * new board gets tried rather than sitting behind an old favourite forever.
 */
export async function findUnseen<T>(
  host: Host,
  gameType: string,
  themes: string[],
  difficulty = "medium",
): Promise<StoredBoard<T> | null> {
  if (!hasDatabase()) return null;
  const theme = normalizeTheme(themes);
  if (!theme) return null;

  const { userId, anonId } = hostKey(host);
  const rows = await query<Row>(
    `SELECT b.id, b.content_json, b.is_personal
       FROM boards b
      WHERE b.game_type = $1
        AND b.theme_normalized = $2
        AND b.difficulty = $3
        AND b.retired_at IS NULL
        -- Public shelf, plus this host's own personal boards and no one
        -- else's. A NULL author never matches either branch by accident.
        AND (
          b.is_personal = false
          OR ($4::uuid IS NOT NULL AND b.author_user_id = $4::uuid)
          OR ($5::text IS NOT NULL AND b.author_anon_id = $5::text)
        )
        AND NOT EXISTS (
          SELECT 1 FROM seen_boards s
           WHERE s.board_id = b.id
             AND (
               ($4::uuid IS NOT NULL AND s.user_id = $4::uuid)
               OR ($5::text IS NOT NULL AND s.anon_id = $5::text)
             )
        )
      ORDER BY b.times_served ASC, b.created_at ASC
      LIMIT 1`,
    [gameType, theme, difficulty, userId, anonId],
  );

  const found = rows[0];
  if (!found) return null;

  await markServed(host, found.id);
  return {
    id: found.id,
    content: found.content_json as T,
    isPersonal: found.is_personal,
  };
}

/** Keep what the model just wrote, so the next host doesn't pay for it. */
export async function store(
  host: Host,
  gameType: string,
  themes: string[],
  difficulty: string,
  content: unknown,
  isPersonal: boolean,
): Promise<string | null> {
  if (!hasDatabase()) return null;
  const theme = normalizeTheme(themes);
  if (!theme) return null;

  const { userId, anonId } = hostKey(host);
  const rows = await query<{ id: string }>(
    `INSERT INTO boards
       (game_type, theme_normalized, theme_original, difficulty,
        content_json, is_personal, author_user_id, author_anon_id,
        times_served)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
     RETURNING id`,
    [
      gameType,
      theme,
      originalTheme(themes),
      difficulty,
      JSON.stringify(content),
      isPersonal,
      userId,
      anonId,
    ],
  );

  const id = rows[0]?.id ?? null;
  // Written for you counts as seen by you — otherwise the library's first act
  // is to hand you back the board you just waited for.
  if (id) await remember(host, id);
  return id;
}

async function markServed(host: Host, boardId: string) {
  await query(`UPDATE boards SET times_served = times_served + 1 WHERE id = $1`, [
    boardId,
  ]);
  await remember(host, boardId);
}

async function remember(host: Host, boardId: string) {
  const { userId, anonId } = hostKey(host);
  if (!userId && !anonId) return;
  await query(
    `INSERT INTO seen_boards (board_id, user_id, anon_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [boardId, userId, anonId],
  );
}

/** Played to the end. The only signal here that means "this one was good". */
export async function markCompleted(boardId: string) {
  if (!hasDatabase()) return;
  await query(
    `UPDATE boards SET times_completed = times_completed + 1 WHERE id = $1`,
    [boardId],
  );
}

/**
 * Regenerated, abandoned, or thrown away. Retirement is decided in the same
 * statement that records the skip, so a board can never be served again
 * between being skipped once too often and somebody noticing.
 */
export async function markSkipped(boardId: string) {
  if (!hasDatabase()) return;
  await query(
    `UPDATE boards
        SET skip_count = skip_count + 1,
            retired_at = CASE
              WHEN times_served >= $2
               AND (skip_count + 1)::float / GREATEST(times_served, 1) > $3
              THEN now() ELSE retired_at END
      WHERE id = $1`,
    [boardId, RETIRE_AFTER_SERVES, RETIRE_SKIP_RATIO],
  );
}
