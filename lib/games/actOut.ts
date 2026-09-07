import { roundsFor } from "@/lib/games/lengths";
import { startsAfterLeadIn } from "@/lib/games/leadIn";
import { shuffle } from "@/lib/games/roundEngine";
import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * Charades, with the phone as the hat.
 *
 * One person's phone hands them a word. They act, the room shouts, and they
 * tap "got it" and who got it — or pass. The TV shows the clock and the words
 * as they land, never the one being acted. Nothing is typed by anyone, which
 * is the point: half the lineup is people looking down at a keyboard, and
 * this is the game where everyone is looking at one person in the middle of
 * the room.
 */

export const ACT_SECONDS = 60;

export type ActGot = { word: string; by: string | null };

export type ActState = {
  kind: "act";
  phase: "ready" | "acting" | "turnOver" | "done";
  /** The deck, in play order. Stripped from the wire; see lib/room/redact. */
  words: string[];
  /** Index of the word being acted. Wraps if the deck runs dry. */
  cursor: number;
  turn: number;
  turns: number;
  actorId: string | null;
  startedAt: number | null;
  seconds: number;
  /** This turn's hits, in order, with who shouted it. */
  got: ActGot[];
  /** This turn's passes. Public once the turn is over. */
  passed: string[];
  lastScores: Record<string, number>;
  /** Every finished turn, for the summary. */
  tally: Array<{ actorId: string; got: number }>;
};

const st = (room: Room) => room.game as ActState;

export const actWord = (s: ActState): string =>
  s.words.length ? s.words[s.cursor % s.words.length] : "";

/** A practice bot can't wave its arms, so the turn only goes to people. */
const actors = (room: Room) => {
  const everyone = connectedPlayers(room);
  const people = everyone.filter((p) => !p.bot);
  return people.length ? people : everyone;
};

const GOT = 500;

export function createActGame(pool: string[]): GameModule {
  const beginTurn = (room: Room, s: ActState): Room => {
    const order = actors(room);
    if (!order.length) return { ...room, game: { ...s, phase: "done" } };
    return {
      ...room,
      game: {
        ...s,
        phase: "ready",
        actorId: order[s.turn % order.length].id,
        startedAt: null,
        got: [],
        passed: [],
        lastScores: {},
      },
    };
  };

  const go = (room: Room, s: ActState): Room => ({
    ...room,
    game: { ...s, phase: "acting", startedAt: startsAfterLeadIn() },
  });

  const endTurn = (room: Room, s: ActState): Room => ({
    ...room,
    game: {
      ...s,
      phase: "turnOver",
      tally: [...s.tally, { actorId: s.actorId ?? "", got: s.got.length }],
    },
  });

  return {
    id: "act-it-out",
    name: "Act It Out",
    minPlayers: 3,
    needsPhones: true,

    init(room) {
      const primed = room as unknown as { pendingWords?: string[]; pendingRounds?: number };
      const words = shuffle(primed.pendingWords?.length ? primed.pendingWords : pool);
      const fresh: ActState = {
        kind: "act",
        phase: "ready",
        words,
        cursor: 0,
        turn: 0,
        turns: roundsFor("act-it-out", primed.pendingRounds),
        actorId: null,
        startedAt: null,
        seconds: ACT_SECONDS,
        got: [],
        passed: [],
        lastScores: {},
        tally: [],
      };
      return beginTurn({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;
      const isActor = Boolean(action.playerId) && action.playerId === s.actorId;

      switch (action.type) {
        /** The TV or the actor's own phone starts the clock. */
        case "start":
          if (s.phase !== "ready") return room;
          if (action.playerId && !isActor) return room;
          return go(room, s);

        case "got": {
          if (s.phase !== "acting" || !isActor || !s.actorId) return room;
          const by = typeof action.payload?.by === "string" ? action.payload.by : null;
          const guesser =
            by && by !== s.actorId && connectedPlayers(room).some((p) => p.id === by)
              ? by
              : null;
          const points: Record<string, number> = { [s.actorId]: GOT };
          if (guesser) points[guesser] = GOT;
          const scored = award(room, points);
          const lastScores = { ...s.lastScores };
          for (const [id, n] of Object.entries(points)) lastScores[id] = (lastScores[id] ?? 0) + n;
          return {
            ...scored,
            game: {
              ...st(scored),
              got: [...s.got, { word: actWord(s), by: guesser }],
              cursor: s.cursor + 1,
              lastScores,
            },
          };
        }

        case "pass":
          if (s.phase !== "acting" || !isActor) return room;
          return { ...room, game: { ...s, passed: [...s.passed, actWord(s)], cursor: s.cursor + 1 } };

        /** The clock ran out, or the host moved things along. */
        case "timeup":
        case "force":
          if (s.phase === "acting") return endTurn(room, s);
          // A host nudging an actor who won't tap start.
          if (s.phase === "ready" && action.type === "force") return go(room, s);
          return room;

        case "next": {
          if (s.phase !== "turnOver") return room;
          const turn = s.turn + 1;
          if (turn >= s.turns) return { ...room, game: { ...s, phase: "done" } };
          return beginTurn(room, { ...s, turn });
        }

        default:
          return room;
      }
    },
  };
}

/**
 * Things a person can do with their body in a minute. Actions, animals, jobs
 * and situations, with a few that are funny to fail at.
 */
export const ACT_WORDS: string[] = [
  "Brushing your teeth", "Riding a horse", "A penguin", "Juggling", "Milking a cow",
  "Surfing", "Tightrope walker", "Changing a nappy", "A sneeze", "Making popcorn",
  "Karate", "An elephant", "Ballet", "Fishing", "Snoring",
  "Hula hoop", "Ironing", "Bowling", "Yoga", "A vampire",
  "A chicken", "Golf", "Shark attack", "Making pizza", "Sunburn",
  "A robot", "A zombie", "Rowing a boat", "Lifting weights", "Taking a selfie",
  "Boxing", "A frog", "Skiing", "Painting a wall", "Cracking an egg",
  "A spider", "A monkey", "Traffic warden", "Hairdresser", "Dentist",
  "Firefighter", "Pilot", "Photographer", "Sleepwalking", "Hiccups",
  "Playing the drums", "Bagpipes", "Violin", "Blowing out candles", "Skipping rope",
  "Swimming", "Mopping the floor", "Walking the dog", "Rock climbing", "Chess",
  "Tennis", "Basketball", "A sumo wrestler", "A ghost", "A kangaroo",
  "A giraffe", "A snake", "A butterfly", "A crab", "A gorilla",
  "A T-Rex", "An octopus", "Windscreen wipers", "A toaster", "A washing machine",
  "A helicopter", "A rollercoaster", "A waiter", "An opera singer", "A magician",
  "A cowboy", "An astronaut", "Sunbathing", "A marriage proposal", "Lost luggage",
  "Missing the bus", "Stepping on Lego", "Dropping your phone", "Parallel parking", "A hangover",
  "First day at work", "A flight attendant", "Sculpting", "Bird watching", "A lifeguard",
];
