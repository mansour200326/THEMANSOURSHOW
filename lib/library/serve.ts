import "server-only";

import type { Written } from "@/lib/ai";
import { findUnseen, store } from "@/lib/library";
import {
  type Host,
  currentHost,
  mayGenerate,
  recordGeneration,
} from "@/lib/plan/host";
import type { Gate } from "@/lib/plan/limits";

/**
 * One request for content, answered from the shelf if possible.
 *
 * The order matters and it's the whole feature:
 *
 *   1. Has this host already used up tonight's writing? Stop before spending.
 *   2. Is there something written for this exact theme they haven't seen?
 *      Serve it. No wait, no cost.
 *   3. Otherwise write it, keep it, and serve it.
 *
 * Step 2 is what turns the model from the thing you wait for into the thing
 * that stocks the shelf. The first host to ask for "90s cartoons" waits
 * ninety seconds; everybody after them waits for a database round trip.
 *
 * Note the allowance is only spent in step 3. Being served from the library
 * costs nothing and so counts as nothing — a free host who happens to pick
 * popular themes can play all night, which is the correct incentive for
 * everyone involved.
 */
export type Served<T> =
  | { ok: true; content: T; boardId: string | null; fromLibrary: boolean }
  | { ok: false; blocked: "plan"; gate: Gate }
  /** Nothing on the shelf and no way to write more. */
  | { ok: false; blocked: "unavailable" };

export async function serveContent<T>({
  gameType,
  themes,
  difficulty = "medium",
  write,
  host,
  canWrite,
}: {
  gameType: string;
  themes: string[];
  difficulty?: string;
  write: () => Promise<Written<T>>;
  host?: Host;
  /**
   * Whether writing is possible at all — in practice, whether there's an API
   * key. Checked here rather than at the top of each route so that a board
   * already on the shelf is served even when nothing could be written: the
   * library is not a cache in front of the model, it's a library that the
   * model restocks.
   */
  canWrite?: () => boolean;
}): Promise<Served<T>> {
  const who = host ?? (await currentHost());

  const shelved = await findUnseen<T>(who, gameType, themes, difficulty);
  if (shelved) {
    return {
      ok: true,
      content: shelved.content,
      boardId: shelved.id,
      fromLibrary: true,
    };
  }

  if (canWrite && !canWrite()) return { ok: false, blocked: "unavailable" };
  if (!(await mayGenerate(who))) {
    return { ok: false, blocked: "plan", gate: "ai" };
  }

  const written = await write();
  const boardId = await store(
    who,
    gameType,
    themes,
    difficulty,
    written.content,
    written.isPersonal,
  );
  await recordGeneration(who, gameType);

  return { ok: true, content: written.content, boardId, fromLibrary: false };
}
