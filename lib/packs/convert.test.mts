// Run with: npx tsx lib/packs/convert.test.mts
import {
  packSize,
  packToBoard,
  packToPlaces,
  packToRiddles,
  packToStartPayload,
  packToSurvey,
  packToTimeline,
} from "./convert";
import { PACK_KIND, PACK_MINIMUM, emptyPackData } from "./types";
import { lineup } from "../lineup";

let pass = 0, fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL  ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
};

// Every game in the lineup must have a shape and a blank pack to start from.
const missing = lineup.filter((g) => !PACK_KIND[g.slug]);
check("every game has a pack shape", missing.map((g) => g.slug), []);
for (const g of lineup) {
  const kind = PACK_KIND[g.slug];
  check(`${g.slug} has a minimum`, typeof PACK_MINIMUM[kind], "number");
  check(`${g.slug} has a blank pack`, Array.isArray(emptyPackData(kind)), true);
}

// --- half-finished rows are dropped, not fatal ---
const board = packToBoard([
  { title: "Football", clues: [
    { clue: "Won 2022", answer: "Argentina" },
    { clue: "", answer: "" },
    { clue: "Red Devils", answer: "Man United" },
    { clue: "Only clue", answer: "" },
    { clue: "", answer: "Only answer" },
  ]},
  { title: "", clues: [{ clue: "orphan", answer: "x" }] },
  { title: "Empty", clues: [{ clue: "", answer: "" }] },
]);
check("only complete clues survive", board.categories[0].clues.length, 2);
check("untitled and empty categories are dropped", board.categories.length, 1);
check("values follow position, not order kept", board.categories[0].clues.map(c => c.value), [100, 300]);
check("titles are shouted", board.categories[0].title, "FOOTBALL");

// --- survey answers are re-ranked however they were typed ---
const survey = packToSurvey([
  { question: "Name something", answers: [
    { text: "Third", points: 10 },
    { text: "First", points: 50 },
    { text: "", points: 99 },
    { text: "Second", points: 30 },
  ]},
  { question: "", answers: [{ text: "orphan", points: 5 }] },
  { question: "Too thin", answers: [{ text: "only one", points: 100 }] },
]);
check("answers sorted highest first", survey[0].answers.map(a => a.text), ["First", "Second", "Third"]);
check("blank answers dropped", survey[0].answers.length, 3);
check("a question needs two answers", survey.length, 1);

// --- riddles keep their category, and lose it when blank ---
const riddles = packToRiddles([
  { emoji: "🧊🏝️🌋", answer: "Iceland", hint: "Country" },
  { emoji: "🎬", answer: "", hint: "Film" },
  { emoji: "🐝🐻", answer: "Honey badger", hint: "" },
]);
check("incomplete riddles dropped", riddles.length, 2);
check("hint kept", riddles[0].hint, "Country");
check("blank hint becomes undefined", riddles[1].hint, undefined);

// --- timeline needs at least three events ---
const tl = packToTimeline([
  { prompt: "Order these", events: ["a", "b", "c", "", ""] },
  { prompt: "Too short", events: ["a", "b", "", "", ""] },
]);
check("rounds with three events survive", tl.length, 1);
check("blank events dropped", tl[0].events, ["a", "b", "c"]);

// --- places need a name and two roles ---
const places = packToPlaces([
  { name: "A wedding", roles: ["The bride", "Best man", "", "", "", ""] },
  { name: "Thin", roles: ["Only one", "", "", "", "", ""] },
  { name: "", roles: ["a", "b"] },
]);
check("places need two roles", places.length, 1);
check("roles trimmed to what was filled", places[0].roles.length, 2);

// --- payloads land in the slot each engine reads ---
const slot = (gameId: string, kind: string, data: unknown) =>
  Object.keys(packToStartPayload(gameId, kind as never, data as never))[0];
check("trivia royale -> board", slot("trivia-royale", "board", []), "board");
check("emoji riddles -> items", slot("emoji-riddles", "riddles", []), "items");
check("impostor -> places", slot("impostor", "places", []), "places");
check("code grid -> words", slot("code-grid", "words", []), "words");
check("groupthink -> prompts", slot("groupthink", "prompts", []), "prompts");
check("bluff trivia -> prompts", slot("bluff-trivia", "qa", []), "prompts");

// Round games want {text}, not bare strings.
const gt = packToStartPayload("groupthink", "prompts" as never, ["Name a colour", ""] as never);
check("prompts wrapped for the round engine", gt.prompts, [{ text: "Name a colour" }]);

// --- packSize agrees with the converters ---
check("packSize counts board categories", packSize("board", [
  { title: "A", clues: [{ clue: "q", answer: "a" }] },
  { title: "", clues: [{ clue: "q", answer: "a" }] },
] as never), 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
