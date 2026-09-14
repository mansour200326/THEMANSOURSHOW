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
  "bluff-trivia": [
    "Food and drink",
    "Holidays and travel",
    "Films and TV",
    "Everyday life",
    "Pets and animals",
    "Work and school",
    "Music",
    "Growing up",
  ],

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

  /* --- Categories: things you can list quickly --- */
  /* --- Punchline: places a joke can be set --- */
  punchline: [
    "Dating",
    "The office",
    "Family dinners",
    "Doctors and dentists",
    "Airports",
    "The gym",
    "Flatmates",
    "Weddings",
  ],
  /* --- Add a Caption: what the photo should be of --- */
  "caption-this": [
    "Cats",
    "Dogs",
    "Farm animals",
    "Zoo animals",
    "Birds",
    "Animals in costumes",
    "Animals in water",
    "Baby animals",
  ],
  /* --- Act It Out: things you can do with your body --- */
  "act-it-out": [
    "Animals",
    "Sports",
    "Jobs",
    "Films",
    "Household chores",
    "Holidays",
    "Superheroes",
    "Embarrassing moments",
  ],
  /* --- Something Sketchy: categories with lots of drawable things in them --- */
  "one-stroke": [
    "Animals",
    "Things in a kitchen",
    "Vehicles",
    "Food",
    "Sports",
    "Fairy tales",
    "Things at the beach",
    "Musical instruments",
  ],
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
};

/** Falls back to trivia topics for anything not listed. */
/*
 * The same idea in Arabic, for a Gulf living room: what people there would
 * actually tap. Not translations of the English list — a different list,
 * because "90s Movies" is a fine English category and مسلسلات رمضان is the
 * one that starts an argument.
 */
const TRIVIA_AR = [
  "مسلسلات خليجية",
  "أفلام مصرية",
  "أغاني عربية",
  "الدوري السعودي",
  "كأس العالم",
  "جغرافيا الوطن العربي",
  "التاريخ الإسلامي",
  "الأكل الخليجي",
  "مسلسلات رمضان",
  "مشاهير الخليج",
  "الشعر العربي",
  "ألعاب الفيديو",
];

export const THEME_SUGGESTIONS_AR: Record<string, string[]> = {
  "big-board": TRIVIA_AR,
  "trivia-royale": TRIVIA_AR,
  "bluff-trivia": ["الأكل", "السفر", "العائلة", "الجامعة", "الدوام", "الأعراس", "رمضان", "القهوة"],
  "face-off": [
    "أشياء في المطبخ",
    "أسباب التأخير عن الدوام",
    "أكلات العيد",
    "أشياء تشتريها من البقالة",
    "أسماء أولاد شائعة",
    "أماكن تروحها في الويكند",
    "أشياء تنساها في البيت",
    "هدايا الأعراس",
  ],
  impostor: ["أماكن في الخليج", "المول", "المدرسة", "المطار", "الاستراحة", "المستشفى", "السوق الشعبي", "ملعب كرة قدم"],
  "sketch-and-guess": ["أشياء في البيت", "حيوانات", "أكلات عربية", "معالم عربية", "مهن", "رياضات", "أشياء في السيارة", "الشتاء"],
  "emoji-riddles": ["أفلام عربية", "مسلسلات خليجية", "أغاني عربية", "أمثال شعبية", "أكلات", "دول عربية", "مدن خليجية", "مشاهير"],
  "last-one-standing": ["ثقافة عامة", "الوطن العربي", "كرة القدم", "التاريخ الإسلامي", "العلوم", "مسلسلات", "الأكل", "الجغرافيا"],
  timeline: ["التاريخ الإسلامي", "تاريخ الخليج", "كأس العالم", "الاختراعات", "الفضاء", "الأفلام العربية", "التقنية", "الأولمبياد"],
  "dial-it-in": ["الأكل", "السفر", "المشاهير", "الحيوانات", "الوظائف", "الأفلام", "السيارات", "الرياضة"],
  "most-likely-to": ["هالشلة", "في العرس", "في السفر", "في رمضان", "في الدوام", "في الاستراحة", "بعد عشر سنين", "في الويكند"],
  "who-said-it": ["الطفولة", "المدرسة", "السفر", "الأكل", "العائلة", "أسرار صغيرة", "الجامعة", "الويكند"],
  punchline: ["الدوام", "الأعراس", "العائلة", "الطيران", "الجيم", "الجامعة", "السكن مع أصدقاء", "المستشفى"],
  "caption-this": ["قطط", "كلاب", "حيوانات المزرعة", "الجمال", "الصقور", "حيوانات الحديقة", "طيور", "صغار الحيوانات"],
  "act-it-out": ["حيوانات", "رياضات", "مهن", "أفلام عربية", "أعمال البيت", "السفر", "أبطال خارقين", "مواقف محرجة"],
  "one-stroke": ["حيوانات", "أشياء في المطبخ", "سيارات", "أكل", "رياضات", "حكايات شعبية", "أشياء على البحر", "آلات موسيقية"],
  categories: [
    "أشياء في السوبرماركت",
    "دول",
    "حيوانات",
    "أندية كرة قدم",
    "أشياء في الصف",
    "فواكه وخضار",
    "ماركات سيارات",
    "أشياء على البحر",
    "ألعاب",
    "أشياء في المستشفى",
  ],
};

/** Falls back to trivia topics for anything not listed. */
export const suggestionsFor = (gameId?: string, lang: "en" | "ar" = "en"): string[] => {
  const table = lang === "ar" ? THEME_SUGGESTIONS_AR : THEME_SUGGESTIONS;
  return (gameId && table[gameId]) || (lang === "ar" ? TRIVIA_AR : TRIVIA);
};
