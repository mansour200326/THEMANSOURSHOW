import type { ImpostorPlace } from "@/lib/games/impostor";

/**
 * Bundled locations. Each one needs roles that let you say something vague
 * enough to bluff with but specific enough to catch someone out — that tension
 * is the whole game, so the roles matter more than the place does.
 */
export const impostorPack: ImpostorPlace[] = [
  {
    name: "A wedding",
    roles: ["The bride", "The best man", "A bored cousin", "The photographer", "The DJ", "A crying aunt"],
  },
  {
    name: "An aeroplane",
    roles: ["The pilot", "A nervous flyer", "Cabin crew", "A crying baby's parent", "An air marshal", "Someone in the middle seat"],
  },
  {
    name: "A hospital",
    roles: ["A surgeon", "A patient", "A worried relative", "The receptionist", "A student doctor", "A porter"],
  },
  {
    name: "A football stadium",
    roles: ["The striker", "The referee", "A season ticket holder", "A steward", "The commentator", "A pie seller"],
  },
  {
    name: "A supermarket",
    roles: ["A shelf stacker", "Someone doing a big shop", "The security guard", "A sample handout", "A checkout worker", "A kid asking for sweets"],
  },
  {
    name: "A gym",
    roles: ["A personal trainer", "Someone on their first day", "The person hogging the bench", "The receptionist", "A cleaner", "Someone just here for the sauna"],
  },
  {
    name: "A film set",
    roles: ["The director", "The lead actor", "An extra", "The boom operator", "Catering", "A stunt double"],
  },
  {
    name: "A school",
    roles: ["The head teacher", "A student", "A supply teacher", "The caretaker", "A parent at pickup", "A dinner lady"],
  },
  {
    name: "A cruise ship",
    roles: ["The captain", "An entertainer", "A seasick passenger", "A waiter", "The engineer", "Someone at the buffet"],
  },
  {
    name: "A police station",
    roles: ["A detective", "Someone in the cells", "The desk sergeant", "A lawyer", "A witness", "A cleaner"],
  },
];
