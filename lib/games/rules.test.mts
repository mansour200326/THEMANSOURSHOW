// Run with: npx tsx lib/games/rules.test.mts
import { RULES } from "./rules";
import { EVERY_GAME_ID } from "./everyGame";

const missing = EVERY_GAME_ID.filter((id) => !RULES[id]);
const extra = Object.keys(RULES).filter((id) => !EVERY_GAME_ID.includes(id));
console.log("games in the lineup:", EVERY_GAME_ID.length);
console.log("with rules:", EVERY_GAME_ID.length - missing.length);
if (missing.length) console.log("MISSING:", missing);
if (extra.length) console.log("ORPHAN RULES:", extra);
for (const id of EVERY_GAME_ID) {
  const r = RULES[id];
  if (r && (r.how.length < 2 || r.how.length > 4)) console.log("odd step count:", id, r.how.length);
}
process.exit(missing.length || extra.length ? 1 : 0);
