/**
 * How each game works, in the words you'd use to explain it to the room.
 *
 * These go on screen before anything starts, because the host shouldn't have
 * to remember the rules to fifteen games — and because half the room has
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
    summary: "Everyone gets the same question. One of you doesn't. Blend in.",
    how: [
      "A question lands on every phone — except one phone, which gets a slightly different question. Nobody is told which they have.",
      "Everyone types an answer. The TV shows nothing until the answers are in.",
      "All the answers go up with names on. Work out whose answer was answering something else, and vote for them.",
    ],
    scoring:
      "Catch them and everyone who voted right scores. If the vote misses or splits, the odd one out scores for getting away with it.",
    needs: "Three phones or more.",
    example:
      "Everyone's asked “What's the best pizza topping?” and one person is asked “What's the worst?”. Four answers say pepperoni, mushroom, olives, and one says pineapple. The room argues. Was that a joke, or the decoy?",
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
  punchline: {
    summary: "The setup goes up. You write the punchline.",
    how: [
      "A setup goes up on the TV — 'the worst thing to hear from your dentist:'.",
      "Everyone writes their punchline on their phone.",
      "The punchlines go up with no names on them. Vote for the best one — not your own.",
    ],
    scoring:
      "The most votes takes a thousand, ties included. Anyone who got a vote at all takes five hundred.",
    needs: "Three phones or more.",
    example:
      "The setup is “The airline's new policy:”. Five punchlines go up. The one about the emotional-support goose gets three votes and a thousand points; the two that got one vote each take five hundred.",
  },
  "caption-this": {
    summary: "A picture goes up. Write the caption.",
    how: [
      "A photo goes up on the TV — a goat on a roof, a dog in sunglasses.",
      "Everyone writes a caption on their phone.",
      "The captions go up with no names on them. Vote for the best one — not your own.",
    ],
    scoring:
      "The most votes takes a thousand, ties included. Anyone who got a vote at all takes five hundred.",
    needs: "Three phones or more.",
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
