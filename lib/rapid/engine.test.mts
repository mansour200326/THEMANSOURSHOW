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

// The category is the prize, and it's worth one point however many they named.
let made = rapidReducer(s, { type: "SCORE", points: 11 });
check("making the bid wins the category", scores(made), [0, 1]);
check("naming extra doesn't pay extra", rapidReducer(s, { type: "SCORE", points: 40 }).teams[1].score, 1);
check("made flag", made.lastMade, true);
check("only one team plays a category", made.round, 1);
check("straight back to bidding", made.phase, "bidding");

// Missed it: the other team takes the bid.
let missed = rapidReducer(s, { type: "SCORE", points: 8 });
check("falling short hands the category over", scores(missed), [1, 0]);
check("missed flag", missed.lastMade, false);

// Exactly on the bid counts as making it.
check("exactly the bid is made", rapidReducer(s, { type: "SCORE", points: 9 }).lastMade, true);
check("exactly the bid wins it", scores(rapidReducer(s, { type: "SCORE", points: 9 })), [0, 1]);

// A category is a whole round, so three prompts is three categories.
let run = start("categories");
for (let i = 0; i < 3; i++) {
  run = rapidReducer(run, { type: "SET_BID", team: i % 2, count: 4 });
  run = rapidReducer(run, { type: "GO" });
  run = rapidReducer(run, { type: "TIME_UP" });
  run = rapidReducer(run, { type: "SCORE", points: 5 });
}
check("three categories ends the game", run.phase, "winner");
// Three categories, one point each: two to the team that bid first, one to the other.
check("a point per category", scores(run), [2, 1]);

// Undo walks a category back.
let undone = rapidReducer(made, { type: "UNDO" });
check("undo returns to judging", undone.phase, "judge");
check("undo returns the points", scores(undone), [0, 0]);

/* ------------------------------------- finishing the clock early */

// The host's "Finish now" button and the clock running out are the same
// action. The reducer has no idea how much time was left, which is precisely
// why stopping early can't behave differently from stopping late.
for (const mode of ["categories", "three-in-five"] as const) {
  let early = start(mode);
  if (mode === "categories") early = rapidReducer(early, { type: "SET_BID", team: 0, count: 3 });
  early = rapidReducer(early, { type: "GO" });
  check(`${mode}: running`, early.phase, "running");
  early = rapidReducer(early, { type: "TIME_UP" });
  check(`${mode}: finishing early goes straight to judging`, early.phase, "judge");
  const scored = rapidReducer(early, { type: "SCORE", points: 4 });
  check(`${mode}: and the turn scores normally`, scored.phase !== "judge", true);
}

// TIME_UP is ignored from anywhere else, so a stray press can't skip a turn.
check("time up does nothing while bidding", rapidReducer(start("categories"), { type: "TIME_UP" }).phase, "bidding");
check("time up does nothing while ready", rapidReducer(start("three-in-five"), { type: "TIME_UP" }).phase, "ready");

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
