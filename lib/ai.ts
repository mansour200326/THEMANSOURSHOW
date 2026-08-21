import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// The SDK's Zod helper is built against the v4 API, which ships inside zod 3.25.
import { z } from "zod/v4";
import type { Board, FinalClue } from "@/lib/board/types";
import type { FeudQuestion } from "@/lib/feud/types";
import { type Difficulty, difficultyBrief } from "@/lib/difficulty";

/**
 * Server-side AI content generation. Every generator here returns the same
 * shapes the games already render, so nothing downstream knows the difference
 * between a generated board and the bundled sample pack.
 */

/**
 * Which model does which job. Set these in the host's environment to swap
 * models without a deploy of new code — the defaults below are what runs if
 * the variables are absent.
 *
 *   BIGNIGHT_MODEL_BOARD  boards and surveys — structured, has to be accurate
 *   BIGNIGHT_MODEL_PACKS  short prompt lists — cheap and fast is the point
 *
 * The HUDDLE_* names are the pre-rebrand spelling. They still work so a live
 * deploy doesn't lose its model settings the moment this ships.
 */
const pick = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
};

const MODELS = {
  board:
    pick("BIGNIGHT_MODEL_BOARD", "HUDDLE_MODEL_BOARD") || "claude-sonnet-5",
  packs:
    pick("BIGNIGHT_MODEL_PACKS", "HUDDLE_MODEL_PACKS") || "claude-haiku-4-5",
};

/**
 * `output_config.effort` is rejected outright by some models — Haiku 4.5 and
 * Sonnet 4.5 among them — so it can only be sent where it's supported. This
 * matters because the model names are configurable: someone can point the pack
 * generators at a model that would 400 on a parameter they never chose.
 */
const EFFORT_UNSUPPORTED = [/haiku/i, /sonnet-4-5/i];

const supportsEffort = (model: string) =>
  !EFFORT_UNSUPPORTED.some((pattern) => pattern.test(model));

type Effort = "low" | "medium" | "high";

// Generic over the format so the schema's type survives and `parse()` can
// still infer parsed_output.
function outputConfig<F>(model: string, format: F, effort: Effort) {
  return supportsEffort(model)
    ? { format, effort }
    : { format, effort: undefined };
}

/** Ascending values down each category — assigned here, never trusted to the model. */
const VALUES = [100, 200, 300, 400, 500];

export const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

/* ------------------------------------------------------------------ schema */

const GeneratedClue = z.object({
  clue: z.string().describe("The clue, written as a statement — never a question."),
  answer: z.string().describe("The answer, as short as possible."),
});

const GeneratedCategory = z.object({
  title: z.string().describe("The category title, in CAPS, as it appears on the board."),
  clues: z
    .array(GeneratedClue)
    .describe("Exactly five clues, easiest first, hardest last."),
});

const GeneratedBoard = z.object({
  categories: z.array(GeneratedCategory),
  final: GeneratedClue.extend({
    category: z.string().describe("Final Round category title."),
  }),
});

/* ------------------------------------------------------------------ prompts */

const SYSTEM = `You write clues for a party game played by a group of friends around one TV. You are given the category titles the host chose. Write the board.

Rules:
- Produce exactly one category per requested title, in the order given. Keep the
  host's topic; you may tidy the wording into a punchy CAPS board title.
- Exactly five clues per category, ordered easiest to hardest. The fifth should
  be genuinely hard — something only a real fan of the topic would get.
- A clue is a statement, never a question. The answer is short: a name, a title,
  a year, a place. No full sentences in the answer.
- Every clue must be factually correct and have exactly one defensible answer.
  If you are not certain of a fact, write a different clue instead.
- Running tallies are where you are most likely to be confidently wrong: award
  counts, trophy counts, career totals, chart positions, "the only person to".
  Avoid them unless the number is genuinely famous. A clue about *what* someone
  did is safer than one about *how many times* they did it.
- No two clues in a category may share an answer or restate the same fact.
- Vary the shape of the clues: definitions, quotes, numbers, "this person did X",
  visual descriptions. Never open every clue the same way.
- Keep it clean enough for a living room with everyone's friends in it.

Also write one Final Round clue: harder than anything on the board, drawn from
one of the requested topics, still answerable by a group thinking out loud.`;

function buildPrompt(categories: string[], vibe: string): string {
  const list = categories.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const extra = vibe.trim()
    ? `\n\nThe host also asked for: ${vibe.trim()}`
    : "";
  return `Write the board for these ${categories.length} categories:\n\n${list}${extra}`;
}

/* --------------------------------------------------------------- generation */

export type GenerateBoardInput = {
  categories: string[];
  vibe?: string;
  difficulty?: Difficulty;
};

export type GenerateBoardResult = {
  board: Board;
  finalClue: FinalClue;
};

export async function generateTriviaBoard({
  categories,
  vibe = "",
  difficulty = "medium",
}: GenerateBoardInput): Promise<GenerateBoardResult> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODELS.board,
    max_tokens: 16000,
    system: `${SYSTEM}\n\nDifficulty: ${difficultyBrief[difficulty]}`,
    output_config: outputConfig(
      MODELS.board,
      zodOutputFormat(GeneratedBoard),
      "medium",
    ),
    messages: [{ role: "user", content: buildPrompt(categories, vibe) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      "The generator declined this set of categories. Try rewording them.",
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The board came back truncated. Try fewer categories.");
  }

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("The generator returned an unreadable board.");

  const usable = parsed.categories.filter((cat) => cat.clues.length >= VALUES.length);
  if (usable.length < 3) {
    throw new Error("The generator came back short. Give it another go.");
  }

  const board: Board = {
    title: categories.join(" · "),
    categories: usable.map((cat) => ({
      title: cat.title.trim().toUpperCase(),
      clues: cat.clues.slice(0, VALUES.length).map((clue, i) => ({
        value: VALUES[i],
        clue: clue.clue.trim(),
        answer: clue.answer.trim(),
      })),
    })),
  };

  return {
    board,
    finalClue: {
      category: parsed.final.category.trim().toUpperCase(),
      clue: parsed.final.clue.trim(),
      answer: parsed.final.answer.trim(),
    },
  };
}

/* ------------------------------------------------------- Face-Off packs */

const GeneratedFeud = z.object({
  questions: z.array(
    z.object({
      question: z
        .string()
        .describe("The survey question, phrased the way a game show host asks it."),
      answers: z
        .array(
          z.object({
            text: z.string().describe("A short answer — two or three words."),
            points: z
              .number()
              .int()
              .describe("Survey points. Highest first. All answers sum to 100."),
          }),
        )
        .describe("Six answers, most popular first."),
    }),
  ),
});

const FEUD_SYSTEM = `You write survey rounds for a survey face-off game played by a group
of friends around one TV.

Rules:
- Each round is one question a hundred people could plausibly have been surveyed on.
  Phrase it the way a host says it out loud.
- Exactly six answers per question, ordered most popular to least.
- Points must be whole numbers, descending, summing to exactly 100. The top answer
  should be worth roughly 30-40.
- Answers must be short and guessable — two or three words, the obvious thing
  someone would shout. Never a full sentence.
- No two answers in a round may mean the same thing.
- Keep it clean enough for a living room with everyone's friends in it.`;

export async function generateFeudPack({
  theme,
  rounds,
  difficulty = "medium",
}: {
  theme: string;
  rounds: number;
  difficulty?: Difficulty;
}): Promise<FeudQuestion[]> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODELS.board,
    max_tokens: 16000,
    system: `${FEUD_SYSTEM}\n\nDifficulty: ${difficultyBrief[difficulty]}`,
    output_config: outputConfig(
      MODELS.board,
      zodOutputFormat(GeneratedFeud),
      "medium",
    ),
    messages: [
      {
        role: "user",
        content: `Write ${rounds} survey rounds${
          theme.trim() ? ` about: ${theme.trim()}` : ""
        }.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The generator declined that theme. Try rewording it.");
  }
  const parsed = response.parsed_output;
  if (!parsed?.questions?.length) {
    throw new Error("The generator returned an unusable board.");
  }

  const usable = parsed.questions.filter((q) => q.answers.length >= 4);
  if (!usable.length) throw new Error("The generator came back short.");

  return usable.map((q) => ({
    question: q.question.trim(),
    // Trust the model for wording, not for ordering.
    answers: [...q.answers]
      .sort((a, b) => b.points - a.points)
      .slice(0, 6)
      .map((a) => ({ text: a.text.trim(), points: Math.max(1, Math.round(a.points)) })),
  }));
}

/* --------------------------------------------------- Category suggestions */

const GeneratedCategories = z.object({
  categories: z
    .array(z.string())
    .describe("Short, punchy category titles — two or three words each."),
});

/** "Surprise me" — invents topics for the host instead of making them think. */
export async function generateCategoryIdeas({
  count,
  hint = "",
  difficulty = "medium",
}: {
  count: number;
  hint?: string;
  difficulty?: Difficulty;
}): Promise<string[]> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: MODELS.packs,
    max_tokens: 2000,
    system:
      "You suggest categories for a living-room trivia night. Give a spread " +
      "across different corners of general knowledge — film, music, sport, " +
      "food, history, science, language, the internet — so no single person " +
      "dominates the board. Titles are short and playable, never abstract " +
      `academic headings.\n\nDifficulty: ${difficultyBrief[difficulty]}`,
    output_config: outputConfig(
      MODELS.packs,
      zodOutputFormat(GeneratedCategories),
      "low",
    ),
    messages: [
      {
        role: "user",
        content: `Suggest exactly ${count} categories${
          hint.trim() ? ` with this leaning: ${hint.trim()}` : ""
        }.`,
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed?.categories?.length) {
    throw new Error("Couldn't think of any categories. Try again.");
  }
  return parsed.categories
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, count);
}

/* -------------------------------------------------------- error presentation */

/**
 * Turns SDK failures into something a host can read from the couch. Without
 * this a busy upstream shows up as a raw JSON blob on the TV.
 */
export function friendlyAiError(error: unknown): string {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

  switch (status) {
    case 429:
      return "Too many requests just now. Wait a few seconds and try again.";
    case 529:
    case 503:
      return "The writing service is busy right now. Try again in a moment — or start with the sample pack.";
    case 401:
    case 403:
      return "That API key was rejected. Check ANTHROPIC_API_KEY in your host's settings.";
    case 400:
      return "That request was rejected. Try rewording the categories.";
    case 404:
      return "That model doesn't exist. Check BIGNIGHT_MODEL_BOARD and BIGNIGHT_MODEL_PACKS in your host's settings.";
    default:
      break;
  }
  if (status && status >= 500) {
    return "The writing service had a problem. Try again in a moment.";
  }
  return error instanceof Error && error.message.length < 120
    ? error.message
    : "Couldn't write that one. Try again.";
}

/* ------------------------------------------------- Rapid-fire prompt packs */

const GeneratedPrompts = z.object({
  prompts: z.array(z.string()).describe("The prompts, one line each."),
});

export async function generateRapidPrompts({
  mode,
  count,
  theme = "",
  difficulty = "medium",
}: {
  mode: "categories" | "three-in-five";
  count: number;
  theme?: string;
  difficulty?: Difficulty;
}): Promise<string[]> {
  const client = new Anthropic();

  const brief =
    mode === "categories"
      ? "Each prompt is a category broad enough that someone could rattle off " +
        "ten or more answers in 30 seconds. Phrase them as 'Things that…', " +
        "'Types of…', or a plain plural noun. Never a question."
      : "Each prompt asks for exactly three things and starts with 'Name 3'. " +
        "Pick things where three examples exist but come out slowly under " +
        "pressure — that panic is the whole game.";

  const response = await client.messages.parse({
    model: MODELS.packs,
    max_tokens: 4000,
    system:
      `You write prompts for a fast-talking party game.\n\n${brief}\n\n` +
      "Everything must be answerable by an ordinary adult with no special " +
      "knowledge, and clean enough for a room full of friends.\n\n" +
      `Difficulty: ${difficultyBrief[difficulty]}`,
    output_config: outputConfig(
      MODELS.packs,
      zodOutputFormat(GeneratedPrompts),
      "low",
    ),
    messages: [
      {
        role: "user",
        content: `Write exactly ${count} prompts${
          theme.trim() ? ` themed around: ${theme.trim()}` : ""
        }.`,
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed?.prompts?.length) {
    throw new Error("Couldn't write those prompts. Try again.");
  }
  return parsed.prompts.map((p) => p.trim()).filter(Boolean).slice(0, count);
}
