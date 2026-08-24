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

/**
 * Number words and numerals are the same answer.
 *
 * Asked how many strings a violin has, half a room types "four" and half types
 * "4", and marking one of those wrong is indefensible. Everything collapses to
 * digits, so whichever way anybody typed it they meet in the middle.
 */
const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000,
};

/**
 * Turns any run of number words into the number it spells. Anything that isn't
 * a number passes through untouched, so "the nile" is left alone.
 */
function numeralise(words: string[]): string[] {
  const out: string[] = [];
  let total = 0;
  let current = 0;
  let counting = false;

  const flush = () => {
    if (counting) out.push(String(total + current));
    total = 0;
    current = 0;
    counting = false;
  };

  for (const word of words) {
    if (word in UNITS) {
      current += UNITS[word];
      counting = true;
    } else if (word in SCALES) {
      const scale = SCALES[word];
      // "two hundred" multiplies what's pending; "a thousand" starts at one.
      if (scale >= 1000) {
        total += (current || 1) * scale;
        current = 0;
      } else {
        current = (current || 1) * scale;
      }
      counting = true;
    } else if (counting && word === "and") {
      // "four hundred and forty" is one number, not two.
      continue;
    } else {
      flush();
      out.push(word);
    }
  }
  flush();
  return out;
}

/** Lowercase, strip punctuation, drop filler words, singularise crudely. */
export function normalise(text: string): string {
  const words = text
    .toLowerCase()
    // Hyphens join number words — "twenty-one" has to split before counting.
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  return numeralise(words)
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
