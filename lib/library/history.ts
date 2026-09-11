import "server-only";

import { hasDatabase, query } from "@/lib/db";
import { type Host, hostKey } from "@/lib/plan/host";
import { normalizeTheme } from "@/lib/library/theme";

/**
 * What this host has already been asked.
 *
 * The variety instruction in the prompt asks the model not to reach for the
 * obvious fact, and it does not work: ask for a Geography board often enough
 * and Lesotho comes back every time, because it genuinely is one of the most
 * clue-shaped facts in geography. Persuasion loses to a strong prior.
 *
 * What beats it is data. Every board ever served to a host is already stored
 * and already linked to them, so the answers they've seen can be handed to
 * the model as a list of things it may not use. Not a suggestion — a
 * constraint on the output.
 *
 * "Never the same question again" can't be literal forever: after a few
 * hundred boards the list would be longer than the board. It's capped at the
 * most recent few hundred answers, which covers the repetition anybody
 * actually notices, and the oldest ones age out — by which point a clue from
 * six months ago is not the complaint.
 */

/** Boards to look back through, and answers to carry into the prompt. */
const BOARDS_BACK = 80;
const MAX_ANSWERS = 600;

/**
 * Pull every answer-shaped string out of stored content.
 *
 * Each game stores a different shape and this has to work for all of them
 * without knowing which is which — a board has categories of clues, a survey
 * has ranked answers, a word pack is a bare list of strings.
 *
 * So it walks everything and is choosy about what it *keeps*: strings under a
 * key that holds the thing being guessed, and bare strings sitting in an
 * array. The first version did the opposite — descended only into a list of
 * known container keys — and silently harvested nothing at all, because a
 * board is stored under "board" and that wasn't on the list. Recursing into
 * everything can't fail that way when a shape changes.
 */
const ANSWER_KEYS = new Set(["answer", "name", "text", "prompt", "question", "decoy", "subject"]);

export function harvest(
  value: unknown,
  into: Set<string>,
  key = "",
  depth = 0,
): void {
  if (depth > 8 || into.size > MAX_ANSWERS * 4) return;

  if (typeof value === "string") {
    const trimmed = value.trim();
    // A clue is prose and shouldn't be excluded; an answer is short.
    if (!trimmed || trimmed.length > 60) return;
    // Kept when it's under an answer-ish key, or when it's a bare string in
    // a list — which is what a word pack is.
    if (ANSWER_KEYS.has(key) || key === "") into.add(trimmed);
    return;
  }

  if (Array.isArray(value)) {
    // An array's items inherit nothing: a list of strings is a word pack,
    // a list of objects gets walked on its own terms.
    value.forEach((v) => harvest(v, into, typeof v === "string" ? "" : key, depth + 1));
    return;
  }

  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      harvest(v, into, k, depth + 1);
    }
  }
}

/**
 * Everything already on the shelf for this theme, whoever it was written for.
 *
 * The per-host list stops a host meeting their own questions again. It does
 * nothing about the shelf: two "general knowledge" boards written a week
 * apart for two different people never knew about each other, so they share
 * half their questions, and the next host to ask gets one and then the
 * other. The shelf has to be diverse *as a whole*, which means each new board
 * is written against everything already stored under that theme.
 */
export async function answersOnShelf(
  gameType: string,
  themes: string[],
): Promise<string[]> {
  if (!hasDatabase()) return [];
  const theme = normalizeTheme(themes);
  if (!theme) return [];

  const rows = await query<{ content_json: unknown }>(
    `SELECT content_json
       FROM boards
      WHERE game_type = $1 AND theme_normalized = $2 AND is_personal = false
      ORDER BY created_at DESC
      LIMIT ${BOARDS_BACK}`,
    [gameType, theme],
  );
  const found = new Set<string>();
  for (const row of rows) harvest(row.content_json, found);
  return [...found].slice(0, MAX_ANSWERS);
}

/**
 * The full exclusion list for writing something new: what this host has
 * seen anywhere in this game, plus what anyone has already been written
 * under this theme. Capped, with the host's own history taking priority —
 * it's the repetition they'd actually notice.
 */
export async function everythingToAvoid(
  host: Host,
  gameType: string,
  themes: string[],
): Promise<string[]> {
  const [mine, shelf] = await Promise.all([
    answersAlreadySeen(host, gameType),
    answersOnShelf(gameType, themes),
  ]);
  const merged = new Set(mine);
  for (const a of shelf) {
    if (merged.size >= MAX_ANSWERS) break;
    merged.add(a);
  }
  return [...merged];
}

/**
 * Answers this host has already been served for a game, newest first.
 *
 * Not filtered by theme on purpose. A host who saw Lesotho on a Geography
 * board should not meet it again on "Africa" or "Small countries" either —
 * the annoyance is the fact repeating, not the category it arrived in.
 */
export async function answersAlreadySeen(
  host: Host,
  gameType: string,
): Promise<string[]> {
  if (!hasDatabase()) return [];
  const { userId, anonId } = hostKey(host);
  if (!userId && !anonId) return [];

  const rows = await query<{ content_json: unknown }>(
    `SELECT b.content_json
       FROM seen_boards s
       JOIN boards b ON b.id = s.board_id
      WHERE b.game_type = $3
        AND (
          ($1::uuid IS NOT NULL AND s.user_id = $1::uuid)
          OR ($2::text IS NOT NULL AND s.anon_id = $2::text)
        )
      ORDER BY s.seen_at DESC
      LIMIT ${BOARDS_BACK}`,
    [userId, anonId, gameType],
  );

  const found = new Set<string>();
  for (const row of rows) harvest(row.content_json, found);
  return [...found].slice(0, MAX_ANSWERS);
}
