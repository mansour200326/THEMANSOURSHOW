// Run with: npx tsx lib/games/rules.test.mts
import { RULES } from "./rules";
import { lineup } from "../lineup";

const missing = lineup.filter((g) => !RULES[g.slug]);
const extra = Object.keys(RULES).filter((id) => !lineup.some((g) => g.slug === id));
console.log("games in lineup:", lineup.length);
console.log("with rules:", lineup.length - missing.length);
if (missing.length) console.log("MISSING:", missing.map(g => g.slug));
if (extra.length) console.log("ORPHAN RULES:", extra);
for (const g of lineup) {
  const r = RULES[g.slug];
  if (r && (r.how.length < 2 || r.how.length > 4)) console.log("odd step count:", g.slug, r.how.length);
}
process.exit(missing.length || extra.length ? 1 : 0);
