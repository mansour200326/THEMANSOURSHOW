// Run with: npx tsx lib/feud/match.test.mts
import { matchAnswer } from "./match";
import type { FeudAnswer } from "./types";

const A = (text: string, accept: string[] = []): FeudAnswer => ({ text, points: 1, accept });

// The board from the user's screenshots.
const snacksRound = [A("Snacks", ["chips", "crisps", "popcorn", "junk food", "sweets"]),
  A("Drinks"), A("Music"), A("A speaker"), A("Ice"), A("Paper plates")];
const carRound = [A("Car trouble", ["breakdown", "the car broke down", "a flat tyre"]),
  A("Traffic"), A("Overslept"), A("Bad weather"), A("Got lost"), A("Work ran over")];
const chores = [A("Make the bed"), A("Make coffee"), A("Brush teeth"),
  A("Check your phone"), A("Shower"), A("Walk the dog")];

type Case = [string, FeudAnswer[], "strict" | "lenient", number | null];
const CASES: Case[] = [
  // What the user reported.
  ["chips", snacksRound, "strict", 0],          // alias, no model needed
  ["crisps", snacksRound, "strict", 0],
  ["car", carRound, "strict", null],            // must NOT open "Car trouble"
  ["car", carRound, "lenient", null],           // not even without a judge
  ["car crash", carRound, "strict", null],      // defer — a crash isn't car trouble
  ["car trouble", carRound, "strict", 0],
  ["the car broke down", carRound, "strict", 0],

  // The earlier "make bed" / "make coffee" bug stays fixed.
  ["make bed", chores, "lenient", 0],
  ["make bed", chores, "strict", 0],            // "the" is filler, so this is exact
  ["make coffee", chores, "lenient", 1],
  ["coffee", chores, "lenient", null],

  // Ordinary near-misses the fast path should still catch alone.
  ["snacks", snacksRound, "strict", 0],
  ["snaks", snacksRound, "strict", null],       // typo: too far to call, defer to the judge
  ["snaks", snacksRound, "lenient", 0],         // ...and caught without one
  ["the snacks", snacksRound, "strict", 0],     // filler word
  ["drinks", snacksRound, "strict", 1],
  ["a speaker", snacksRound, "strict", 3],
  ["speaker", snacksRound, "strict", 3],        // filler word the other way
  ["bananas", snacksRound, "strict", null],
  ["bananas", snacksRound, "lenient", null],

  // Already face-up answers are never re-opened (revealed handled below).
];

// Numbers, which is where a real game came unstuck: asked how many strings a
// violin has, half the room typed "four" and half typed "4".
const numbers: Array<[string, string, boolean]> = [
  ["4", "Four", true],
  ["four", "4", true],
  ["6", "six", true],
  ["twenty one", "21", true],
  ["twenty-one", "21", true],
  ["1440", "One thousand four hundred and forty", true],
  ["two hundred", "200", true],
  ["a thousand", "1000", true],
  // Still has to say no to the wrong number.
  ["five", "4", false],
  ["40", "four", false],
  // And words that merely contain a number word are left alone.
  ["Tennessee", "10", false],
];

let pass = 0, fail = 0;
for (const [guess, answers, mode, want] of CASES) {
  const got = matchAnswer(guess, answers, [], mode)?.index ?? null;
  const ok = got === want;
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL  ${mode.padEnd(7)} "${guess}" -> ${got} (want ${want})`);
}

for (const [guess, answer, want] of numbers) {
  const got = matchAnswer(guess, [A(answer)], [], "lenient") !== null;
  const ok = got === want;
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL  numbers: "${guess}" vs "${answer}" -> ${got} (want ${want})`);
}

// Revealed answers stay shut.
const reopened = matchAnswer("snacks", snacksRound, [0], "strict");
if (reopened !== null) { console.log("FAIL  revealed answer was re-opened"); fail++; } else pass++;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
