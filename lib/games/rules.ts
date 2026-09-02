/**
 * How each game works, in the words you'd use to explain it to the room.
 *
 * These go on screen before anything starts, because the host shouldn't have
 * to remember the rules to sixteen games — and because half the room has
 * never played any of them. Written to be read aloud off a TV: short lines,
 * no jargon, and the scoring said plainly rather than left to be discovered.
 */

export type GameRules = {
  /** One line under the title. */
  summary: string;
  /** The steps, in order. Three or four; nobody reads more than that. */
  how: string[];
  /** How you win. Kept separate because it's the bit people ask about. */
  scoring: string;
  /** What the room needs before it starts. */
  needs: string;
  /**
   * A worked example. Only for the games where the rules alone don't land —
   * Code Grid is three sentences that mean nothing until you see one clue
   * play out.
   */
  example?: string;
};

export const RULES: Record<string, GameRules> = {
  "big-board": {
    summary: "The classic quiz board, run from this screen.",
    how: [
      "Teams take turns picking a category and a value.",
      "The clue comes up and that team answers out loud.",
      "You tap ✓ or ✗ — nobody needs a phone.",
    ],
    scoring: "Right answers add the tile's value, wrong ones take it off.",
    needs: "This screen only.",
  },
  "trivia-royale": {
    summary: "The same board, but it's a race.",
    how: [
      "A tile is picked and the clue goes up on the TV.",
      "Everyone's phone shows a buzzer. First press wins the answer.",
      "Whoever buzzed says it out loud and the host judges it.",
    ],
    scoring:
      "The tile's value if you're right, the same off if you're wrong — so don't buzz on a hunch.",
    needs: "A phone each.",
  },
  "emoji-riddles": {
    summary: "Emoji spelling out a film, a country, a dish, a saying.",
    how: [
      "A few emoji appear on the TV with the sort of thing they mean.",
      "Work out what they spell and hit the buzzer on your phone.",
      "First to buzz says the answer out loud.",
    ],
    scoring: "Points for getting it. A wrong guess costs you nothing, so shout.",
    needs: "A phone each.",
  },
  "bluff-trivia": {
    summary: "Lie convincingly, and spot everyone else lying.",
    how: [
      "An obscure question goes up. Nobody knows the answer.",
      "Everyone types a fake answer that sounds plausible.",
      "All the fakes go up with the real one. Vote for the truth.",
    ],
    scoring:
      "Points for finding the real answer, and more for every person your lie fooled.",
    needs: "Three phones or more.",
  },
  "most-likely-to": {
    summary: "Vote for the friend who'd absolutely do it.",
    how: [
      "A prompt goes up — 'most likely to move countries without telling anyone'.",
      "Everyone votes on their phone for whoever fits.",
      "The votes come in as a bar race on the TV.",
    ],
    scoring: "Whoever gets the most votes wears it, and takes the points.",
    needs: "Three phones or more.",
  },
  "who-said-it": {
    summary: "Anonymous answers. Now work out who wrote what.",
    how: [
      "Everyone answers the same question on their phone. No names attached.",
      "One answer goes up on the TV.",
      "Everyone guesses who wrote it.",
    ],
    scoring:
      "Points for guessing right — and points for writing one nobody pinned on you.",
    needs: "Three phones or more.",
  },
  groupthink: {
    summary: "Be as unoriginal as possible.",
    how: [
      "A prompt goes up — 'name a colour'.",
      "Everyone answers on their phone at the same time.",
      "The answers are grouped and the biggest group wins.",
    ],
    scoring:
      "Points only if you match the majority. Being clever gets you nothing.",
    needs: "Three phones or more.",
  },
  "face-off": {
    summary: "We asked 100 people. Guess what they said.",
    how: [
      "A survey question goes up with its top answers face-down.",
      "The team in control shouts answers and you type them in.",
      "Three strikes and the board passes to the next team.",
    ],
    scoring:
      "Every answer you open is worth what the survey gave it, and it stays yours.",
    needs: "This screen only.",
  },
  categories: {
    summary: "Bid for the category, then prove you can do it.",
    how: [
      "A category goes up — 'things you'd find in a kitchen'.",
      "The teams bid against each other out loud: “I can name six.” “I can name nine.”",
      "Whoever bids highest takes the category and plays it alone, on the clock.",
      "You count what they managed and tap it in.",
    ],
    scoring:
      "One point for the category. Reach your bid and it's yours; fall short and the other team takes it — which is what stops anyone bidding twenty.",
    needs: "This screen only.",
    example:
      "The category is “Countries in Africa”. One team says seven, the other says nine, the first says eleven and the second gives up. The first team now has thirty seconds to name eleven. Ten of them, and the point goes to the other side.",
  },
  "three-in-five": {
    summary: "Name three things. Five seconds. Go.",
    how: [
      "A prompt goes up — 'name 3 things you'd take to a desert island'.",
      "You get five seconds. It is much harder than it sounds.",
      "Tap whether they managed it.",
    ],
    scoring: "One point if they got all three out in time. Nothing if they didn't.",
    needs: "This screen only.",
  },
  "last-one-standing": {
    summary: "Get one wrong and you're out.",
    how: [
      "A question goes up and everyone answers on their phone at once.",
      "Everyone who got it right stays in. Everyone else is benched.",
      "The questions get harder as the field thins out.",
    ],
    scoring:
      "Points for surviving each round. Last player standing wins it. If everybody gets one wrong, nobody goes out.",
    needs: "Two phones or more.",
  },
  timeline: {
    summary: "Five things, one right order.",
    how: [
      "Five events appear on the TV, shuffled.",
      "On your phone, tap them in order — earliest first.",
      "The true order is revealed one at a time.",
    ],
    scoring:
      "A hundred points per event in the right slot, and double the lot for a perfect run.",
    needs: "A phone each.",
  },
  "dial-it-in": {
    summary: "One word to land the dial.",
    how: [
      "A spectrum goes up — 'overrated' to 'underrated'.",
      "One player secretly sees the target and gives a one-word clue.",
      "Everyone else slides their dial to where they think it is.",
    ],
    scoring:
      "The closer you land the more you get, and the clue-giver scores the room's average — so a bad clue costs them too.",
    needs: "Two phones or more.",
    example:
      "The scale is “Overrated → Underrated” and the hidden point is near the underrated end. You say “Pineapple on pizza”. Everyone slides their dial to where they think you meant.",
  },
  impostor: {
    summary: "Everyone knows where they are except one of you.",
    how: [
      "Your phone shows a place and your role there. One phone says IMPOSTOR.",
      "Ask each other questions out loud. Be specific enough to prove you belong, vague enough not to give the place away.",
      "Anyone can call a vote. A majority names the impostor.",
    ],
    scoring:
      "Everyone who pointed at the right person scores. The impostor scores double for surviving, or for naming the place before you catch them.",
    needs: "Three phones or more.",
    example:
      "The place is a wedding. Ask “how did you get here?” — everyone can answer that, so it tells you nothing. Ask “what are you wearing?” and the impostor has to guess.",
  },
  "code-grid": {
    summary:
      "Twenty-five words on the TV. Nine belong to your team — only one of you knows which.",
    how: [
      "Split into two teams. One person per team is the clue-giver, and their phone shows which words are whose.",
      "The clue-giver says ONE word and a number. Nothing else — no gestures, no hints.",
      "The number is how many of your words that one clue covers. Their team taps the words they think it means.",
      "Tap one of yours and you carry on. Tap anything else and your turn ends.",
    ],
    scoring:
      "First team to find all nine of theirs wins. One word on the board is the assassin — tap it and you lose instantly.",
    needs: "Four phones or more, so each team has a clue-giver and at least one guesser.",
    example:
      "Your words include APPLE and TREE, so you say “Orchard, 2”. Your team taps APPLE — right, keep going — then taps TREE. Both yours, turn continues. Say “Orchard, 2” badly and they might tap PALM instead, which is the other team's, and you've just helped them.",
  },
  "sketch-and-guess": {
    summary: "Draw on your phone, live on the TV.",
    how: [
      "One player gets a word and draws it with their finger.",
      "It appears on the TV as they draw. No letters, no numbers.",
      "Everyone else types guesses as fast as they can.",
    ],
    scoring:
      "Faster guesses score more, and the artist scores for everyone who got it.",
    needs: "Two phones or more.",
  },
};

export const rulesFor = (gameId: string): GameRules | undefined => RULES[gameId];
