import type { GameModule } from "@/lib/games/types";
import { type Action, type Room, award, connectedPlayers } from "@/lib/room/types";

/**
 * Twenty-five words on the TV, two teams, and one person per team who can see
 * which words are theirs. The key card is the whole game, so it lives here and
 * is only ever handed to the two phones entitled to it — see gridKeyFor.
 *
 * The assassin ends the game instantly. That's deliberate: it's the thing that
 * makes a clue-giver hesitate, and hesitation is where the fun is.
 */

/**
 * "hidden" never exists server-side — it's what a face-down word looks like
 * after redactFor has been over the key on its way to a phone.
 */
export type GridOwner = "a" | "b" | "neutral" | "assassin" | "hidden";

export type CodeGridState = {
  kind: "grid";
  /** teams — the room is still sorting out who's on which side. */
  phase: "teams" | "clue" | "guess" | "done";
  words: string[];
  /** Who each word belongs to. Never sent to a phone that isn't a spymaster. */
  key: GridOwner[];
  /** Face-up words, by index. */
  revealed: number[];
  /** Whose turn — 0 is team A, 1 is team B. */
  turn: 0 | 1;
  teams: { name: string; spymaster: string | null; members: string[] }[];
  clue: { word: string; count: number } | null;
  /** Guesses left this turn. A clue of 3 buys 4 tries, as it should. */
  guessesLeft: number;
  winner: 0 | 1 | null;
  /** Set when a team hits the assassin, so the TV can say why it ended. */
  struckAssassin: boolean;
};

const st = (room: Room) => room.game as CodeGridState;

export const GRID_SIZE = 25;

const ownerOf = (team: 0 | 1): GridOwner => (team === 0 ? "a" : "b");
const other = (team: 0 | 1): 0 | 1 => (team === 0 ? 1 : 0);

/** How many of a team's words are still face-down. */
export const gridRemaining = (s: CodeGridState, team: 0 | 1): number =>
  s.key.filter((o, i) => o === ownerOf(team) && !s.revealed.includes(i)).length;

/**
 * The key card, but only for the two people allowed to see it. Everyone else
 * gets null and their phone shows the guessing grid instead.
 */
export const gridKeyFor = (
  s: CodeGridState,
  playerId: string,
): GridOwner[] | null =>
  s.teams.some((t) => t.spymaster === playerId) ? s.key : null;

export const gridIsSpymaster = (s: CodeGridState, playerId: string) =>
  s.teams.some((t) => t.spymaster === playerId);

export const gridTeamOf = (s: CodeGridState, playerId: string): 0 | 1 | null => {
  const index = s.teams.findIndex(
    (t) => t.members.includes(playerId) || t.spymaster === playerId,
  );
  return index === 0 || index === 1 ? index : null;
};

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Nine for whoever starts, eight for the other side, one assassin, the rest
 * neutral. The extra word is what the first team pays for going first.
 */
function buildKey(first: 0 | 1): GridOwner[] {
  const key: GridOwner[] = [
    ...Array<GridOwner>(9).fill(ownerOf(first)),
    ...Array<GridOwner>(8).fill(ownerOf(other(first))),
    "assassin",
    ...Array<GridOwner>(GRID_SIZE - 18).fill("neutral"),
  ];
  return shuffle(key);
}

/** Split the room in two and give each side someone who can see the key. */
function buildTeams(room: Room): CodeGridState["teams"] {
  const players = shuffle(connectedPlayers(room).map((p) => p.id));
  const half = Math.ceil(players.length / 2);
  const a = players.slice(0, half);
  const b = players.slice(half);
  return [
    { name: "Team A", spymaster: a[0] ?? null, members: a.slice(1) },
    { name: "Team B", spymaster: b[0] ?? null, members: b.slice(1) },
  ];
}

export function createCodeGrid(wordPool: string[]): GameModule {
  const endTurn = (s: CodeGridState): CodeGridState => ({
    ...s,
    phase: "clue",
    turn: other(s.turn),
    clue: null,
    guessesLeft: 0,
  });

  return {
    id: "code-grid",
    name: "Code Grid",
    minPlayers: 4,
    needsPhones: true,

    init(room) {
      const supplied = (room as unknown as { pendingWords?: string[] })
        .pendingWords;
      const pool = supplied?.length ? supplied : wordPool;
      const first: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      const fresh: CodeGridState = {
        kind: "grid",
        // Split at random to begin with, but the room gets to fix it before
        // anything starts. Four people dealt into the wrong pairs was the
        // fastest way to make this game not work.
        phase: "teams",
        words: shuffle(pool).slice(0, GRID_SIZE),
        key: buildKey(first),
        revealed: [],
        turn: first,
        teams: buildTeams(room),
        clue: null,
        guessesLeft: 0,
        winner: null,
        struckAssassin: false,
      };
      return { ...room, game: fresh };
    },

    reduce(room, action: Action) {
      const s = st(room);
      if (!s) return room;

      switch (action.type) {
        /** Moving somebody, or handing over the key card, before kickoff. */
        case "assign": {
          if (s.phase !== "teams") return room;
          const who = String(action.payload?.playerId ?? "");
          const team = Number(action.payload?.team);
          const asSpymaster = Boolean(action.payload?.spymaster);
          if (!who || (team !== 0 && team !== 1)) return room;

          const teams = s.teams.map((t, i) => {
            // Take them off whichever side they were on.
            const stripped = {
              ...t,
              spymaster: t.spymaster === who ? null : t.spymaster,
              members: t.members.filter((id) => id !== who),
            };
            if (i !== team) return stripped;
            if (!asSpymaster) {
              return { ...stripped, members: [...stripped.members, who] };
            }
            // Only one key card per side; whoever had it becomes a guesser.
            return {
              ...stripped,
              spymaster: who,
              members: stripped.spymaster
                ? [...stripped.members, stripped.spymaster]
                : stripped.members,
            };
          }) as CodeGridState["teams"];

          return { ...room, game: { ...s, teams } };
        }

        /** The room is happy with the sides. */
        case "begin": {
          if (s.phase !== "teams") return room;
          // Both sides need somebody who can see the key, or it can't be played.
          if (s.teams.some((t) => !t.spymaster)) return room;
          return { ...room, game: { ...s, phase: "clue" } };
        }

        /** Only the spymaster whose turn it is may speak. */
        case "clue": {
          if (s.phase !== "clue" || !action.playerId) return room;
          if (s.teams[s.turn]?.spymaster !== action.playerId) return room;

          const word = String(action.payload?.word ?? "").trim().slice(0, 30);
          const count = Math.max(0, Math.min(9, Number(action.payload?.count) || 0));
          if (!word) return room;

          return {
            ...room,
            game: {
              ...s,
              phase: "guess",
              clue: { word, count },
              // The bonus guess is what lets a team pick up last turn's leftovers.
              guessesLeft: count + 1,
            },
          };
        }

        case "tap": {
          if (s.phase !== "guess" || !action.playerId) return room;
          // The spymaster can see the answers, so they don't get to point.
          if (gridIsSpymaster(s, action.playerId)) return room;
          if (gridTeamOf(s, action.playerId) !== s.turn) return room;

          const index = Number(action.payload?.index);
          if (!Number.isFinite(index) || !s.words[index]) return room;
          if (s.revealed.includes(index)) return room;

          const owner = s.key[index];
          const revealed = [...s.revealed, index];
          const opened: CodeGridState = { ...s, revealed };

          if (owner === "assassin") {
            const winner = other(s.turn);
            return {
              ...room,
              game: { ...opened, phase: "done", winner, struckAssassin: true },
            };
          }

          if (owner === ownerOf(s.turn)) {
            const left = gridRemaining(opened, s.turn);
            if (left === 0) {
              const points: Record<string, number> = {};
              [s.teams[s.turn].spymaster, ...s.teams[s.turn].members]
                .filter((id): id is string => Boolean(id))
                .forEach((id) => {
                  points[id] = 2000;
                });
              const scored = award(room, points);
              return {
                ...scored,
                game: { ...opened, phase: "done", winner: s.turn },
              };
            }
            const guessesLeft = opened.guessesLeft - 1;
            return {
              ...room,
              game:
                guessesLeft > 0
                  ? { ...opened, guessesLeft }
                  : endTurn(opened),
            };
          }

          // Neutral, or worse, one of theirs. Either way the turn is over.
          if (owner === ownerOf(other(s.turn)) && gridRemaining(opened, other(s.turn)) === 0) {
            const winner = other(s.turn);
            const points: Record<string, number> = {};
            [s.teams[winner].spymaster, ...s.teams[winner].members]
              .filter((id): id is string => Boolean(id))
              .forEach((id) => {
                points[id] = 2000;
              });
            const scored = award(room, points);
            return { ...scored, game: { ...opened, phase: "done", winner } };
          }
          return { ...room, game: endTurn(opened) };
        }

        /** "We'll stop there" — a team banking what they've got. */
        case "pass": {
          if (s.phase !== "guess") return room;
          if (action.playerId && gridTeamOf(s, action.playerId) !== s.turn) {
            return room;
          }
          return { ...room, game: endTurn(s) };
        }

        default:
          return room;
      }
    },
  };
}
