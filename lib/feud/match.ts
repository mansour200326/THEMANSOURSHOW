/**
 * Matching what a team shouted against the hidden board.
 *
 * Comparing letters only gets you so far. Two answers can be the same thing
 * with nothing in common on the page ("chips" is "snacks"), and two answers can
 * share almost every letter and mean different things ("car" is not "car
 * trouble"). So this file deliberately does the small, certain half of the job
 * and hands everything else to a model — see lib/feud/judge.ts.
 *
 * `strict` is the fast path: it only says yes when the guess is, to all intents,
 * the answer already. `lenient` is what runs when there's no API key to ask,
 * and leans towards accepting a near miss because the host can always tap a
 * tile directly.
 */

import type { FeudAnswer } from "@/lib/feud/types";

const FILLER = new Set([
  "the", "a", "an", "your", "my", "their", "his", "her", "its",
  "some", "of", "to", "and", "or", "in", "on", "at", "is", "are",
]);

/** Lowercase, strip punctuation, drop filler words, singularise crudely. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ")
    .trim();
}

/** Classic edit distance, iterative so a long answer can't blow the stack. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest;
}

export type MatchResult = {
  index: number;
  /** How confident we are, for the host's feedback line. */
  score: number;
};

export type MatchMode = "strict" | "lenient";

/** Every spelling of an answer we'll take at face value. */
const formsOf = (answer: FeudAnswer): string[] =>
  [answer.text, ...(answer.accept ?? [])].map(normalise).filter(Boolean);

/**
 * Finds the best unrevealed answer for what was typed.
 *
 * In `strict` mode a null means "I don't know", not "wrong" — the caller is
 * expected to ask the judge. In `lenient` mode a null is a strike.
 */
export function matchAnswer(
  guess: string,
  answers: FeudAnswer[],
  revealed: number[],
  mode: MatchMode = "strict",
): MatchResult | null {
  const g = normalise(guess);
  if (!g) return null;

  // A word that sits on more than one answer can't tell them apart. "Make
  // coffee" and "make the bed" both start with "make".
  const seen = new Map<string, number>();
  answers.forEach((answer) => {
    formsOf(answer).forEach((form) => {
      new Set(form.split(" ")).forEach((w) => {
        if (w) seen.set(w, (seen.get(w) ?? 0) + 1);
      });
    });
  });
  const ambiguous = new Set(
    [...seen.entries()].filter(([, n]) => n > 1).map(([w]) => w),
  );

  const guessWords = g.split(" ");
  let bestIndex = -1;
  let bestScore = 0;

  for (let index = 0; index < answers.length; index++) {
    if (revealed.includes(index)) continue;

    for (const a of formsOf(answers[index])) {
      const answerWords = a.split(" ");
      let score = 0;

      if (a === g) {
        score = 1;
      } else if (similarity(a, g) >= 0.85) {
        // Typed at speed with the team still shouting — "trafic", "snaks".
        score = 0.95;
      } else if (mode === "lenient") {
        // No judge available, so fall back to counting shared words. Coverage
        // is what stops "car" opening "car trouble": one word out of two isn't
        // enough of the answer to have said it.
        const distinctive = guessWords.filter(
          (w) => w.length >= 3 && !ambiguous.has(w) && answerWords.includes(w),
        );
        const coverage = distinctive.length
          ? distinctive.length / Math.max(answerWords.length, guessWords.length)
          : 0;
        score = coverage >= 0.6 ? 0.7 + coverage * 0.3 : similarity(a, g);
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
  }

  const floor = mode === "strict" ? 0.9 : 0.7;
  return bestIndex >= 0 && bestScore >= floor
    ? { index: bestIndex, score: bestScore }
    : null;
}
