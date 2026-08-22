// Run with: npx tsx lib/feud/engine.test.mts
import { emptyFeud, feudReducer } from "./engine";
import type { FeudState } from "./types";

const question = {
  question: "Name something.",
  answers: [
    { text: "One", points: 40 },
    { text: "Two", points: 30 },
    { text: "Three", points: 20 },
    { text: "Four", points: 10 },
  ],
};

const start = (teams: string[]): FeudState =>
  feudReducer(emptyFeud(), {
    type: "START",
    teamNames: teams,
    theme: "",
    questions: [question, question],
  });

let pass = 0, fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL  ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};

const strikeOut = (s: FeudState) =>
  [1, 2, 3].reduce((acc) => feudReducer(acc, { type: "STRIKE" }), s);

// --- three teams: the board goes round the table ---
let s = feudReducer(start(["A", "B", "C"]), { type: "SET_CONTROL", team: 0 });
check("starts with A", s.control, 0);

s = feudReducer(s, { type: "GUESS", text: "One", matched: 0 });
check("A banks 40 immediately", s.teams[0].score, 40);

s = strikeOut(s);
check("A struck out -> B has the board", s.control, 1);
check("A keeps its 40", s.teams[0].score, 40);
check("B starts clean", s.strikes, 0);
check("still playing", s.phase, "play");

s = feudReducer(s, { type: "GUESS", text: "Two", matched: 1 });
check("B banks 30", s.teams[1].score, 30);

s = strikeOut(s);
check("B struck out -> C has the board", s.control, 2);
check("round still open with 3 teams", s.phase, "play");

s = strikeOut(s);
check("all three out -> round ends", s.phase, "round-end");
check("outcome is all-out", s.outcome, "all-out");
check("every answer shown", s.revealed.length, 4);
check("A still has 40", s.teams[0].score, 40);
check("B still has 30", s.teams[1].score, 30);
check("C scored nothing", s.teams[2].score, 0);

// --- six teams ---
let six = feudReducer(start(["A","B","C","D","E","F"]), { type: "SET_CONTROL", team: 0 });
for (let i = 0; i < 5; i++) {
  six = strikeOut(six);
  check(`team ${i} out -> ${i + 1} takes over`, six.control, i + 1);
  check(`round open after ${i + 1} strikeouts`, six.phase, "play");
}
six = strikeOut(six);
check("last of six out -> round ends", six.phase, "round-end");

// --- two teams still behave exactly as before ---
let two = feudReducer(start(["A", "B"]), { type: "SET_CONTROL", team: 0 });
two = strikeOut(two);
check("two teams: handover to B", two.control, 1);
two = strikeOut(two);
check("two teams: round ends", two.phase, "round-end");

// --- clearing the board still ends it ---
let clear = feudReducer(start(["A", "B", "C"]), { type: "SET_CONTROL", team: 0 });
for (let i = 0; i < 4; i++) clear = feudReducer(clear, { type: "GUESS", text: "x", matched: i });
check("cleared board ends the round", clear.phase, "round-end");
check("cleared outcome", clear.outcome, "cleared");
check("A took all 100", clear.teams[0].score, 100);

// --- undo walks back a strikeout handover ---
let undo = feudReducer(start(["A", "B", "C"]), { type: "SET_CONTROL", team: 0 });
undo = strikeOut(undo);
check("handed to B", undo.control, 1);
undo = feudReducer(undo, { type: "UNDO" });
check("undo returns the board to A", undo.control, 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
