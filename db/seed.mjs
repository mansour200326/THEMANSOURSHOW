#!/usr/bin/env node
/**
 * Puts a handful of real boards on the shelf.
 *
 * An empty library means the first host of every theme pays for it, which is
 * exactly the experience the library exists to remove — and it makes the
 * whole feature impossible to check, because a miss and a broken lookup look
 * identical from the outside. These are the bundled sample packs, stored
 * under the themes they're actually about.
 *
 *   npm run db:seed
 */
import { connect } from "./connect.mjs";

const client = await connect();

/** Must match normalizeTheme() in lib/library/theme.ts. */
const FILLER = new Set(["the","a","an","and","or","of","in","on","at","for","to","from","with","about","some","any","all","my","our","your"]);
const DECADES = { nineties:"90s", eighties:"80s", seventies:"70s", sixties:"60s", noughties:"00s", "1990s":"90s", "1980s":"80s", "1970s":"70s", "1960s":"60s", "2000s":"00s", "2010s":"10s", "2020s":"20s" };
const tidy = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean)
  .map((w) => DECADES[w] ?? w).filter((w) => !FILLER.has(w))
  .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0,-1) : w))
  .sort().join(" ").trim();
const normalize = (themes) => themes.map(tidy).filter(Boolean).sort().join(" | ");

const SEEDS = [
  {
    gameType: "last-one-standing",
    themes: ["General knowledge"],
    difficulty: "medium:default",
    content: [
      { prompt: "Name a country that borders France.", answer: "Spain" },
      { prompt: "How many strings does a violin have?", answer: "4" },
      { prompt: "What is the capital of Japan?", answer: "Tokyo" },
      { prompt: "Which planet is closest to the sun?", answer: "Mercury" },
      { prompt: "How many sides does a hexagon have?", answer: "6" },
      { prompt: "What is the largest ocean?", answer: "Pacific" },
    ],
  },
  {
    gameType: "dial-it-in",
    themes: ["Everyday life"],
    difficulty: "medium:default",
    content: [
      { prompt: "Where does it sit?", left: "Underrated", right: "Overrated" },
      { prompt: "Where does it sit?", left: "Breakfast food", right: "Dinner food" },
      { prompt: "Where does it sit?", left: "A chore", right: "A treat" },
      { prompt: "Where does it sit?", left: "Too early", right: "Too late" },
    ],
  },
  {
    gameType: "sketch-and-guess",
    themes: ["Everyday objects"],
    difficulty: "medium:default",
    content: ["Lighthouse", "Toothbrush", "Hot air balloon", "Ninja", "Umbrella", "Guitar"],
  },
];

let added = 0;
for (const s of SEEDS) {
  const theme = normalize(s.themes);
  const { rows } = await client.query(
    `SELECT id FROM boards WHERE game_type=$1 AND theme_normalized=$2 AND difficulty=$3`,
    [s.gameType, theme, s.difficulty],
  );
  if (rows.length) {
    console.log(`  · ${s.gameType} "${theme}" already seeded`);
    continue;
  }
  await client.query(
    `INSERT INTO boards (game_type, theme_normalized, theme_original, difficulty, content_json, is_personal)
     VALUES ($1,$2,$3,$4,$5,false)`,
    [s.gameType, theme, s.themes.join(", "), s.difficulty, JSON.stringify(s.content)],
  );
  console.log(`  → ${s.gameType} "${theme}"`);
  added++;
}

console.log(added ? `\n${added} board(s) seeded.` : "\nNothing to add.");
await client.end();
