// Run with: npx tsx lib/rapid/engine.test.mts
import { emptyRapid, rapidReducer } from "./engine";
import type { RapidState } from "./types";

let pass = 0, fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL  ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};

const start = (mode: "categories" | "three-in-five", rounds = 3): RapidState =>
  rapidReducer(emptyRapid(mode), {
    type: "START",
    teamNames: ["Reds", "Blues"],
    theme: "",
    prompts: Array.from({ length: rounds }, (_, i) => `Prompt ${i + 1}`),
  });

const scores = (s: RapidState) => s.teams.map((t) => t.score);

/* ---------------------------------------------------- Categories: bidding */

let s = start("categories");
check("categories opens on bidding, not a clock", s.phase, "bidding");

// Nothing else works until the bid is settled.
check("can't start the clock before a bid", rapidReducer(s, { type: "GO" }).phase, "bidding");

s = rapidReducer(s, { type: "SET_BID", team: 1, count: 9 });
check("the bidding team takes the category", s.turn, 1);
check("the bid is recorded", s.bid, 9);
check("ready for the clock", s.phase, "ready");

s = rapidReducer(s, { type: "GO" });
check("clock running", s.phase, "running");
s = rapidReducer(s, { type: "TIME_UP" });
check("judging", s.phase, "judge");

// Made the bid: they score everything they named, not just the bid.
let made = rapidReducer(s, { type: "SCORE", points: 11 });
check("making the bid pays what they named", scores(made), [0, 11]);
check("made flag", made.lastMade, true);
check("only one team plays a category", made.round, 1);
check("straight back to bidding", made.phase, "bidding");

// Missed it: the other team takes the bid.
let missed = rapidReducer(s, { type: "SCORE", points: 8 });
check("falling short hands the bid over", scores(missed), [9, 0]);
check("missed flag", missed.lastMade, false);

// Exactly on the bid counts as making it.
check("exactly the bid is made", rapidReducer(s, { type: "SCORE", points: 9 }).lastMade, true);
check("exactly the bid pays the bidder", scores(rapidReducer(s, { type: "SCORE", points: 9 })), [0, 9]);

// A category is a whole round, so three prompts is three categories.
let run = start("categories");
for (let i = 0; i < 3; i++) {
  run = rapidReducer(run, { type: "SET_BID", team: i % 2, count: 4 });
  run = rapidReducer(run, { type: "GO" });
  run = rapidReducer(run, { type: "TIME_UP" });
  run = rapidReducer(run, { type: "SCORE", points: 5 });
}
check("three categories ends the game", run.phase, "winner");
check("each team played the ones it won", scores(run), [10, 5]);

// Undo walks a category back.
let undone = rapidReducer(made, { type: "UNDO" });
check("undo returns to judging", undone.phase, "judge");
check("undo returns the points", scores(undone), [0, 0]);

/* ------------------------------------------- Three in Five is unchanged */

let t = start("three-in-five");
check("three-in-five still starts ready", t.phase, "ready");
t = rapidReducer(t, { type: "GO" });
t = rapidReducer(t, { type: "TIME_UP" });
t = rapidReducer(t, { type: "SCORE", points: 1 });
check("first team scored", scores(t), [1, 0]);
check("turn passes", t.turn, 1);
check("still the same round until it's been round the teams", t.round, 0);
t = rapidReducer(t, { type: "GO" });
t = rapidReducer(t, { type: "TIME_UP" });
t = rapidReducer(t, { type: "SCORE", points: 0 });
check("round advances after both teams", t.round, 1);
check("back to ready", t.phase, "ready");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
