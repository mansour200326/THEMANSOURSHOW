import { matchAnswer } from "@/lib/feud/match";
import type { FeudAnswer } from "@/lib/feud/types";

export type GuessVerdict = {
  /** The answer they meant, or null for a strike. */
  index: number | null;
  /** They meant one that's already face-up. Not wrong, so not a strike. */
  repeat: boolean;
};

const MISS: GuessVerdict = { index: null, repeat: false };

/**
 * Turning what the host typed into a tile, or nothing.
 *
 * Three tries, cheapest first:
 *   1. The string check, set strict. Catches the exact answer, a typo, and
 *      anything the pack already listed as an accepted alternate. No network,
 *      so the common case still feels instant.
 *   2. The model, which is the only thing that knows chips are snacks.
 *   3. The string check again, set lenient — for when there's no API key or
 *      the request fell over. Better than handing out a strike on a timeout.
 *
 * Every stage looks at the whole board, face-up answers included, so a team
 * shouting one that's already been opened gets told rather than struck.
 */
export async function resolveGuess({
  question,
  guess,
  answers,
  revealed,
  signal,
}: {
  question: string;
  guess: string;
  answers: FeudAnswer[];
  revealed: number[];
  signal?: AbortSignal;
}): Promise<GuessVerdict> {
  const verdict = (index: number | null): GuessVerdict =>
    index === null
      ? MISS
      : { index: revealed.includes(index) ? null : index, repeat: revealed.includes(index) };

  const quick = matchAnswer(guess, answers, [], "strict");
  if (quick) return verdict(quick.index);

  try {
    const res = await fetch("/api/feud/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        guess,
        options: answers.map((a, index) => ({ index, text: a.text })),
      }),
      signal,
    });
    if (res.ok) {
      const data = (await res.json()) as { index: number | null; judged: boolean };
      if (data.judged) return verdict(data.index);
    }
  } catch {
    // Offline, no key, or too slow. Fall through to the string check.
  }

  return verdict(matchAnswer(guess, answers, [], "lenient")?.index ?? null);
}
