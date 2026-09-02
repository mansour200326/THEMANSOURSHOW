/**
 * What to write a game about, chosen for the game.
 *
 * The setup screens all offered the same twelve topics — Football, Anime,
 * Geography — regardless of what was being set up. Fine for a trivia board
 * and useless everywhere else: "Rap Lyrics" is a fine quiz category and a
 * hopeless thing to draw, and Impostor needs a kind of *place*, not a subject.
 *
 * Written by hand rather than generated. A suggestion is a starting point
 * somebody taps in two seconds, and it has to be reliably good; asking a
 * model to invent the list would cost a call and a wait to be occasionally
 * worse. These are the ones that actually play well.
 */

const TRIVIA = [
  "90s Movies",
  "Football",
  "Geography",
  "Music of the 2000s",
  "Science",
  "History",
  "Food and drink",
  "Video games",
  "Anime",
  "The Middle East",
  "Television",
  "Cars",
];

export const THEME_SUGGESTIONS: Record<string, string[]> = {
  /* --- boards and surveys: anything you can ask a question about --- */
  "big-board": TRIVIA,
  "trivia-royale": TRIVIA,
  "bluff-trivia": TRIVIA,

  /* --- Face-Off: things a hundred people would give different answers to --- */
  "face-off": [
    "Things you forget to pack",
    "Reasons you'd be late",
    "Things in a fridge",
    "What people do on a plane",
    "Excuses for missing work",
    "Things at a wedding",
    "What ruins a holiday",
    "Things you lose constantly",
    "Annoying habits",
    "Things you'd grab in a fire",
  ],

  /* --- Impostor: places with obvious, distinct roles --- */
  impostor: [
    "Workplaces",
    "Holiday destinations",
    "Places in a city",
    "Somewhere in the desert",
    "Sporting venues",
    "Places on a ship",
    "Hospitals and clinics",
    "Somewhere in the Gulf",
    "Film sets",
    "Places you'd rather not be",
  ],

  /* --- Sketch & Guess: things a person can actually draw in sixty seconds --- */
  "sketch-and-guess": [
    "Animals",
    "Things in a kitchen",
    "Famous landmarks",
    "Sports and equipment",
    "Things in a garden",
    "Vehicles",
    "Jobs and uniforms",
    "Food",
    "Things in a bathroom",
    "Weather",
  ],

  /* --- Code Grid: plain, concrete nouns that carry double meanings --- */
  "code-grid": [
    "Everyday objects",
    "Animals",
    "Places",
    "Food",
    "Sports",
    "Nature",
    "Tools",
    "Body parts",
    "Clothes",
    "Music",
  ],

  /* --- Emoji Riddles: things emoji can actually spell out --- */
  "emoji-riddles": [
    "Films",
    "Countries",
    "Songs",
    "Famous people",
    "Idioms and sayings",
    "Books",
    "Animals",
    "Cities",
    "Food dishes",
    "TV shows",
  ],

  /* --- Last One Standing: one short, certain answer --- */
  "last-one-standing": [
    "General knowledge",
    "Geography",
    "Numbers and counting",
    "Science",
    "Sport",
    "Films and TV",
    "Food",
    "History",
    "Music",
    "The human body",
  ],

  /* --- Timeline: things with a real, orderable date --- */
  timeline: [
    "Inventions",
    "World history",
    "Space exploration",
    "Music history",
    "Film releases",
    "Sporting firsts",
    "Technology",
    "Ancient history",
    "The 20th century",
    "Discoveries",
  ],

  /* --- Dial It In: sliding scales people argue about --- */
  "dial-it-in": [
    "Food opinions",
    "Everyday life",
    "Films and TV",
    "Social rules",
    "Work and school",
    "Travel",
    "Technology",
    "Sport",
    "Music taste",
    "Growing up",
  ],

  /* --- prompt games: things a room will happily shout about --- */
  "most-likely-to": [
    "This group of friends",
    "At a party",
    "On holiday",
    "In an emergency",
    "At work",
    "In ten years",
    "On a night out",
    "In a crisis",
  ],
  "who-said-it": [
    "Confessions",
    "Unpopular opinions",
    "Worst habits",
    "Childhood stories",
    "Guilty pleasures",
    "Things you'd never admit",
  ],
  groupthink: [
    "Everyday things",
    "Food",
    "Colours and shapes",
    "Animals",
    "Places",
    "Famous people",
    "Films",
    "First thing that comes to mind",
  ],

  /* --- Categories / Three in Five: things you can list quickly --- */
  categories: [
    "Things in a supermarket",
    "Countries",
    "Animals",
    "Football clubs",
    "Things in a classroom",
    "Fruits and vegetables",
    "Car brands",
    "Things at the beach",
    "Board games",
    "Things in a hospital",
  ],
  "three-in-five": [
    "Things in a kitchen",
    "Countries in Europe",
    "Colours",
    "Sports",
    "Pizza toppings",
    "Things you'd take camping",
    "Superheroes",
    "Things that fly",
  ],
};

/** Falls back to trivia topics for anything not listed. */
export const suggestionsFor = (gameId?: string): string[] =>
  (gameId && THEME_SUGGESTIONS[gameId]) || TRIVIA;
