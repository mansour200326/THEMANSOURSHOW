export type Segment = {
  slug: string;
  name: string;
  tagline: string;
  /** Build phase from the brief — shown while the game is still on the bench. */
  phase: number;
  /** Playable now, but only from a room lobby (needs phones). */
  liveInLobby?: boolean;
  href?: string;
  needsPhones: boolean;
};

export const lineup: Segment[] = [
  {
    slug: "team-jeopardy",
    name: "Team Jeopardy",
    tagline: "Classic board, two to four teams, host runs the show.",
    phase: 1,
    href: "/jeopardy",
    needsPhones: false,
  },
  {
    slug: "trivia-royale",
    name: "Trivia Royale",
    tagline: "Same board, but everyone buzzes from their phone.",
    phase: 4,
    needsPhones: true,
  },
  {
    slug: "impostor",
    name: "Impostor",
    tagline: "Everyone knows the location. One of you is faking it.",
    phase: 5,
    needsPhones: true,
  },
  {
    slug: "most-likely-to",
    liveInLobby: true,
    name: "Most Likely To",
    tagline: "Vote for the friend who'd absolutely do it.",
    phase: 3,
    needsPhones: true,
  },
  {
    slug: "the-feud",
    name: "The Feud",
    tagline: "We surveyed 100 people. Two teams, three strikes.",
    phase: 7,
    href: "/feud",
    needsPhones: false,
  },
  {
    slug: "guess-who-said-it",
    liveInLobby: true,
    name: "Guess Who Said It",
    tagline: "Anonymous answers. Now guess who wrote what.",
    phase: 6,
    needsPhones: true,
  },
  {
    slug: "bluff-trivia",
    liveInLobby: true,
    name: "Bluff Trivia",
    tagline: "Invent a fake answer. Fool the boys. Find the truth.",
    phase: 6,
    needsPhones: true,
  },
  {
    slug: "last-one-standing",
    name: "Last One Standing",
    tagline: "Get it wrong, hit the bench. One survivor.",
    phase: 8,
    needsPhones: true,
  },
  {
    slug: "emoji-riddles",
    name: "Emoji Riddles",
    tagline: "🎬🍿👻 — decode it before anyone else.",
    phase: 7,
    needsPhones: true,
  },
  {
    slug: "timeline",
    name: "Timeline",
    tagline: "Five events. Put them in order. Sweat.",
    phase: 8,
    needsPhones: true,
  },
  {
    slug: "wavelength",
    name: "Wavelength",
    tagline: "Overrated ↔ underrated. One word to land the dial.",
    phase: 8,
    needsPhones: true,
  },
  {
    slug: "herd-mentality",
    liveInLobby: true,
    name: "Herd Mentality",
    tagline: "Be basic. Match the majority or score nothing.",
    phase: 6,
    needsPhones: true,
  },
  {
    slug: "code-grid",
    name: "Code Grid",
    tagline: "Twenty-five words, two teams, one-word clues.",
    phase: 9,
    needsPhones: true,
  },
  {
    slug: "sketch-and-guess",
    name: "Sketch & Guess",
    tagline: "Draw on your phone, live on the TV, chaos in the room.",
    phase: 9,
    needsPhones: true,
  },
];
