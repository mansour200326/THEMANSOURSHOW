import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * One player doesn't know where everyone else is. The TV shows the full list of
 * possible places and a clock; the phones each hold one secret. Everything
 * interesting happens out loud in the room, so this engine only has to be a
 * fair dealer and an honest vote counter.
 *
 * The impostor's identity lives in server memory and is never broadcast — a
 * phone is only ever told about its own card.
 */

export type ImpostorPlace = {
  name: string;
  roles: string[];
};

export type ImpostorState = {
  kind: "impostor";
  /** deal — read your card. talk — the clock is running. vote — accusing. reveal — done. */
  phase: "deal" | "talk" | "vote" | "reveal" | "done";
  places: ImpostorPlace[];
  /** Index into places. Never sent to the impostor's phone. */
  placeIndex: number;
  /** playerId -> the role on their card. The impostor isn't in here. */
  roles: Record<string, string>;
  impostorId: string | null;
  /** Seen their card and tapped ready. */
  ready: string[];
  /** When the talking clock started, and how long it runs. */
  startedAt: number | null;
  seconds: number;
  /** Who called the vote, so the TV can say. */
  calledBy: string | null;
  /** playerId -> who they're accusing. */
  votes: Record<string, string>;
  /** The impostor's one shot: naming the place wins it outright. */
  guessedPlace: number | null;
  outcome: "impostor-caught" | "impostor-survived" | "place-guessed" | null;
  round: number;
  lastScores: Record<string, number>;
};

const st = (room: Room) => room.game as ImpostorState;

export const IMPOSTOR_SECONDS = 480;

export const impostorPlace = (s: ImpostorState): ImpostorPlace | undefined =>
  s.places[s.placeIndex];

/** What this phone is allowed to know. Everything else stays on the server. */
export function impostorCard(
  s: ImpostorState,
  playerId: string,
): { impostor: true } | { impostor: false; place: string; role: string } | null {
  if (s.phase === "deal" || s.phase === "talk" || s.phase === "vote") {
    if (s.impostorId === playerId) return { impostor: true };
    const place = impostorPlace(s);
    if (!place) return null;
    return { impostor: false, place: place.name, role: s.roles[playerId] ?? "A regular" };
  }
  return null;
}

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** Majority of everyone still in the room, so a split vote catches nobody. */
const majority = (room: Room) =>
  Math.floor(connectedPlayers(room).length / 2) + 1;

export function createImpostorGame(pack: ImpostorPlace[]): GameModule {
  /** Deal a fresh place, a fresh impostor and a role for everyone else. */
  const deal = (room: Room, s: ImpostorState): Room => {
    const players = connectedPlayers(room);
    if (!players.length) return { ...room, game: { ...s, phase: "done" } };

    const placeIndex = Math.floor(Math.random() * s.places.length);
    const place = s.places[placeIndex];
    const impostor = pick(players);

    const roles: Record<string, string> = {};
    const pool = [...(place?.roles ?? [])];
    players.forEach((p) => {
      if (p.id === impostor.id) return;
      // Roles run out in a big room, so they start cycling rather than repeat
      // the same one twice in a row.
      if (!pool.length) pool.push(...(place?.roles ?? ["A regular"]));
      roles[p.id] = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    });

    return {
      ...room,
      game: {
        ...s,
        phase: "deal",
        placeIndex,
        roles,
        impostorId: impostor.id,
        ready: [],
        startedAt: null,
        calledBy: null,
        votes: {},
        guessedPlace: null,
        outcome: null,
        lastScores: {},
      },
    };
  };

  /** Count the accusation and hand out the points. */
  const settleVote = (room: Room): Room => {
    const s = st(room);
    const counts: Record<string, number> = {};
    Object.values(s.votes).forEach((id) => {
      counts[id] = (counts[id] ?? 0) + 1;
    });
    const top = Math.max(0, ...Object.values(counts));
    const accused = Object.entries(counts).find(([, n]) => n === top)?.[0];
    const tied = Object.values(counts).filter((n) => n === top).length > 1;

    // No majority, or the room split — the impostor walks.
    const caught = !tied && top >= majority(room) && accused === s.impostorId;

    const points: Record<string, number> = {};
    if (caught) {
      // A point each to everyone who pointed at the right person.
      Object.entries(s.votes).forEach(([voter, target]) => {
        if (target === s.impostorId) points[voter] = 1000;
      });
    } else if (s.impostorId) {
      points[s.impostorId] = 2000;
    }

    const scored = award(room, points);
    return {
      ...scored,
      game: {
        ...st(scored),
        phase: "reveal",
        outcome: caught ? "impostor-caught" : "impostor-survived",
        lastScores: points,
      },
    };
  };

  return {
    id: "impostor",
    name: "Impostor",
    minPlayers: 3,
    needsPhones: true,

    init(room) {
      const supplied = (room as unknown as { pendingPlaces?: ImpostorPlace[] })
        .pendingPlaces;
      const fresh: ImpostorState = {
        kind: "impostor",
        phase: "deal",
        places: supplied?.length ? supplied : pack,
        placeIndex: 0,
        roles: {},
        impostorId: null,
        ready: [],
        startedAt: null,
        seconds: IMPOSTOR_SECONDS,
        calledBy: null,
        votes: {},
        guessedPlace: null,
        outcome: null,
        round: 0,
        lastScores: {},
      };
      return deal({ ...room, game: fresh }, fresh);
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;

      switch (action.type) {
        /** "I've read my card." Everyone in, and the clock starts. */
        case "ready": {
          if (s.phase !== "deal" || !action.playerId) return room;
          if (s.ready.includes(action.playerId)) return room;
          const ready = [...s.ready, action.playerId];
          const everyone = connectedPlayers(room).every((p) =>
            ready.includes(p.id),
          );
          return {
            ...room,
            game: everyone
              ? { ...s, ready, phase: "talk", startedAt: Date.now() }
              : { ...s, ready },
          };
        }

        /** Host starts the clock without waiting for a straggler. */
        case "start": {
          if (s.phase !== "deal") return room;
          return { ...room, game: { ...s, phase: "talk", startedAt: Date.now() } };
        }

        /** Anyone can stop the clock and put it to the room. */
        case "accuse": {
          if (s.phase !== "talk") return room;
          return {
            ...room,
            game: { ...s, phase: "vote", calledBy: action.playerId ?? null, votes: {} },
          };
        }

        case "vote": {
          if (s.phase !== "vote" || !action.playerId) return room;
          const target = String(action.payload?.playerId ?? "");
          if (!connectedPlayers(room).some((p) => p.id === target)) return room;
          if (target === action.playerId) return room;

          const votes = { ...s.votes, [action.playerId]: target };
          const voted: Room = { ...room, game: { ...s, votes } };
          const everyone = connectedPlayers(room).every(
            (p) => votes[p.id] !== undefined,
          );
          return everyone ? settleVote(voted) : voted;
        }

        /** Host closes the vote early. */
        case "force":
          return s.phase === "vote" ? settleVote(room) : room;

        /**
         * The impostor's escape hatch: name the place and the round is theirs.
         * Getting it wrong ends the round just as fast.
         */
        case "guess": {
          if (action.playerId !== s.impostorId) return room;
          if (s.phase !== "talk" && s.phase !== "vote") return room;
          const guess = Number(action.payload?.placeIndex);
          if (!Number.isFinite(guess) || !s.places[guess]) return room;

          const right = guess === s.placeIndex;
          const points = right && s.impostorId ? { [s.impostorId]: 2000 } : {};
          const scored = award(room, points);
          return {
            ...scored,
            game: {
              ...st(scored),
              phase: "reveal",
              guessedPlace: guess,
              outcome: right ? "place-guessed" : "impostor-caught",
              lastScores: points,
            },
          };
        }

        /** Clock ran out with nobody accused — the impostor got away with it. */
        case "timeup": {
          if (s.phase !== "talk") return room;
          const points = s.impostorId ? { [s.impostorId]: 2000 } : {};
          const scored = award(room, points);
          return {
            ...scored,
            game: {
              ...st(scored),
              phase: "reveal",
              outcome: "impostor-survived",
              lastScores: points,
            },
          };
        }

        case "next": {
          if (s.phase !== "reveal") return room;
          const round = s.round + 1;
          if (round >= 5) return { ...room, game: { ...s, phase: "done" } };
          return deal(room, { ...s, round });
        }

        default:
          return room;
      }
    },
  };
}
