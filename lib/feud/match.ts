/**
 * Matching what a team shouted against the hidden board.
 *
 * People never say the answer exactly the way it's written — "traffic" for
 * "The traffic", "sofas" for "A sofa", plus the host's typos while typing at
 * speed. Being strict here would mean the host overriding the game constantly,
 * so this leans towards accepting a near miss. The host can always tap a tile
 * directly when it gets one wrong.
 */

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

/**
 * Finds the best unrevealed answer for what was typed, or null for a strike.
 * Only ever considers answers still face-down.
 */
export function matchAnswer(
  guess: string,
  answers: string[],
  revealed: number[],
): MatchResult | null {
  const g = normalise(guess);
  if (!g) return null;

  // Words that show up on more than one answer carry no signal.
  const seen = new Map<string, number>();
  answers.forEach((raw) => {
    new Set(normalise(raw).split(" ")).forEach((w) => {
      if (w) seen.set(w, (seen.get(w) ?? 0) + 1);
    });
  });
  const ambiguous = new Set(
    [...seen.entries()].filter(([, n]) => n > 1).map(([w]) => w),
  );

  let bestIndex = -1;
  let bestScore = 0;

  for (let index = 0; index < answers.length; index++) {
    if (revealed.includes(index)) continue;
    const a = normalise(answers[index]);
    if (!a) continue;

    let score = 0;

    if (a === g) {
      score = 1;
    } else if (
      // "traffic" vs "traffic jams" — one clearly contains the other.
      (a.includes(g) || g.includes(a)) &&
      Math.min(a.length, g.length) >= 3
    ) {
      score = 0.9;
    } else {
      const answerWords = a.split(" ");
      const guessWords = g.split(" ");

      // A word only tells the answers apart if it isn't on several of them.
      // "Make coffee" and "Make the bed" both start with "make", so matching
      // on it alone would flip the wrong tile.
      const distinctive = guessWords.filter(
        (w) => w.length >= 3 && !ambiguous.has(w) && answerWords.includes(w),
      );

      if (distinctive.length) {
        // Weight by how much of each side the shared words actually cover, so
        // one word in common out of three doesn't count as a match.
        const coverage =
          distinctive.length / Math.max(answerWords.length, guessWords.length);
        score = 0.7 + coverage * 0.3;
      } else {
        score = similarity(a, g);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  // Below this we'd be flipping tiles the team never actually said.
  return bestIndex >= 0 && bestScore >= 0.7
    ? { index: bestIndex, score: bestScore }
    : null;
}
