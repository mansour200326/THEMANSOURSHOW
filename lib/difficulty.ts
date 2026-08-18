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

/** Injected into the generator so difficulty actually changes the content. */
export const difficultyBrief: Record<Difficulty, string> = {
  easy:
    "Aim easy. Almost everything should be common knowledge a casual player " +
    "gets instantly — famous films, household names, obvious landmarks. Nobody " +
    "should sit through a round scoring nothing.",
  medium:
    "Aim medium. A well-read adult should get most of them, with two or three " +
    "that make the room think. Avoid specialist trivia.",
  hard:
    "Aim hard. These should reward people who genuinely know the subject — " +
    "deeper cuts, precise details, the things a casual fan would miss. Still " +
    "fair: every answer must be findable by someone who knows the topic well, " +
    "never obscure for its own sake.",
};
