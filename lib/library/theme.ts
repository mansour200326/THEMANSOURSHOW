/**
 * Turning what a host typed into something two hosts can share.
 *
 * "90s Cartoons", "cartoons (90s)" and "Nineties cartoons!" are one theme
 * with three spellings. Without collapsing them the library never hits and
 * every night pays full price for a board somebody already has.
 *
 * Deliberately blunt. A smarter matcher — embeddings, fuzzy distance — would
 * find more matches and would also serve somebody a board about the wrong
 * thing, which is much worse than a cache miss: a miss costs ninety seconds,
 * a bad hit costs the round. Exact-after-tidying is the rule.
 */

const FILLER = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "for", "to",
  "from", "with", "about", "some", "any", "all", "my", "our", "your",
]);

/** Words that mean the same decade. */
const DECADES: Record<string, string> = {
  nineties: "90s", eighties: "80s", seventies: "70s", sixties: "60s",
  noughties: "00s", tens: "10s", twenties: "20s",
  "1990s": "90s", "1980s": "80s", "1970s": "70s", "1960s": "60s",
  "2000s": "00s", "2010s": "10s", "2020s": "20s",
};

/** One theme, tidied. */
function tidy(theme: string): string {
  return theme
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => DECADES[w] ?? w)
    .filter((w) => !FILLER.has(w))
    // Crude singularisation, same rule the answer matcher uses.
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    // Sorted, because "90s cartoons" and "cartoons, 90s" are one request. A
    // theme is a noun phrase, not a sentence — word order carries almost
    // nothing, and the alternative is paying twice for the same board.
    .sort()
    .join(" ")
    .trim();
}

/**
 * The key a set of themes is stored and looked up under.
 *
 * Sorted, so "football, history" and "history, football" are the same board —
 * the order categories were typed in isn't part of what was asked for.
 */
export function normalizeTheme(themes: string[]): string {
  return themes
    .map(tidy)
    .filter(Boolean)
    .sort()
    .join(" | ");
}

/** What the host typed, kept intact for display. */
export const originalTheme = (themes: string[]): string =>
  themes.map((t) => t.trim()).filter(Boolean).join(", ");
