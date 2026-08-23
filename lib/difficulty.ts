/** Shared difficulty setting. Shown as a three-stop bar on every setup screen. */
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const difficultyBlurb: Record<Difficulty, string> = {
  easy: "Everyone gets a few. Good with a mixed group.",
  medium: "A fair fight — most people know most answers.",
  hard: "For people who take this too seriously.",
};

/**
 * Injected into the generator so difficulty actually changes the content.
 *
 * The trap this is written to avoid: a generator told only "make it harder"
 * keeps the same pool of facts and re-sorts them, so the 500 from a medium
 * board turns up as the 300 on a hard one. The bands below are absolute and
 * they don't overlap — the *easiest* clue on a hard board is meant to be past
 * the *hardest* clue on an easy one. Each level names who should get the
 * cheapest clue and who should get the dearest, because "hard" on its own
 * means nothing to a writer.
 */
export const difficultyBrief: Record<Difficulty, string> = {
  easy:
    "EASY BOARD.\n" +
    "- The 100 should be something almost everyone in the room says out loud " +
    "before you finish reading it. The single most famous fact about the topic.\n" +
    "- The 500 should still be gettable by anyone with a passing interest — " +
    "the sort of thing you'd know from having seen the film once, or from " +
    "having watched a couple of matches.\n" +
    "- Nobody should finish this board having scored nothing. If a clue needs " +
    "any specialist knowledge at all, it does not belong on an easy board.",
  medium:
    "MEDIUM BOARD.\n" +
    "- The 100 should be roughly as hard as the hardest clue on an easy board: " +
    "well known, but you'd have to actually know the topic rather than just " +
    "recognise it.\n" +
    "- The 500 should split the room — one or two people get it, everyone " +
    "else groans when they hear the answer.\n" +
    "- Aim at a well-read adult who follows the subject casually. No trade " +
    "knowledge, no dates nobody remembers.",
  hard:
    "HARD BOARD.\n" +
    "- The 100 should be past anything that would appear on a medium board at " +
    "any value. Start where a medium board finishes.\n" +
    "- The 500 should be something only someone genuinely into the subject " +
    "would land, and the room should be impressed rather than annoyed when " +
    "they do.\n" +
    "- Deeper cuts, precise details, the second and third most famous thing " +
    "rather than the first. Still fair: every answer must be findable by " +
    "someone who knows the topic well, never obscure for its own sake, and " +
    "never a fact you had to invent to make it hard.",
};

/**
 * A short instruction that pushes the writer to a different corner of the same
 * topic each time. Without something like this, the same category regenerates
 * to more or less the same five clues — the model has a favourite fact about
 * everything and will keep telling you it.
 */
const ANGLES = [
  "the people involved rather than the works",
  "beginnings, debuts and firsts",
  "places, settings and geography",
  "numbers, dates and quantities that are genuinely well known",
  "things that went wrong, flopped, or were controversial",
  "the language, names and terminology of the subject",
  "endings, finales and last appearances",
  "the money, business and behind-the-scenes side",
  "rivalries, pairings and who came after whom",
  "the physical objects, kit and equipment",
];

/**
 * Picks a couple of angles at random and a nonce, so two boards on the same
 * categories at the same difficulty don't come back the same.
 */
export function varietyBrief(): string {
  const shuffled = [...ANGLES].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);
  const seed = Math.random().toString(36).slice(2, 8);
  return (
    `VARIETY (seed ${seed}).\n` +
    "This host has almost certainly generated a board on these topics before, " +
    "and getting the same clues back is the fastest way to ruin the game. For " +
    "each category, deliberately draw from these angles rather than the most " +
    "obvious one:\n" +
    picked.map((a) => `- ${a}`).join("\n") +
    "\nIf the first clue that comes to mind is the single most famous fact " +
    "about a topic, that is the one to skip."
  );
}
