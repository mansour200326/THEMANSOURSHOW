"use client";

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;

const DEFAULT_NAMES = [
  "Team 1",
  "Team 2",
  "Team 3",
  "Team 4",
  "Team 5",
  "Team 6",
];

/** Two teams to start with, which is what most rooms play. */
export const startingTeams = () => DEFAULT_NAMES.slice(0, MIN_TEAMS);

export const nextTeamName = (count: number) =>
  DEFAULT_NAMES[count] ?? `Team ${count + 1}`;

type Props = {
  names: string[];
  onChange: (names: string[]) => void;
  /** Some games can't be played by more than a couple of teams. */
  max?: number;
};

/**
 * The team list every game's setup shares. Splitting a room into three or four
 * is normal once more than a handful of people turn up, so nothing is fixed at
 * two.
 */
export function TeamsField({ names, onChange, max = MAX_TEAMS }: Props) {
  const setName = (i: number, value: string) =>
    onChange(names.map((n, j) => (j === i ? value : n)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase tracking-widest text-moon/75">
          Teams
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-display text-sm tabular-nums text-moon-deep">
            {names.length}
          </span>
          <button
            type="button"
            onClick={() => onChange(names.slice(0, -1))}
            disabled={names.length <= MIN_TEAMS}
            className="btn-ghost h-9 w-9 px-0 py-0 text-lg"
            aria-label="Remove team"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onChange([...names, nextTeamName(names.length)])}
            disabled={names.length >= max}
            className="btn-ghost h-9 w-9 px-0 py-0 text-lg"
            aria-label="Add team"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {names.map((name, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-moon-deep/70">
              {i + 1}
            </span>
            <input
              value={name}
              onChange={(e) => setName(i, e.target.value)}
              placeholder={`Team ${i + 1}`}
              maxLength={24}
              className="field"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Blank names become "Team 3" rather than an empty scoreboard slot. */
export const cleanTeamNames = (names: string[]) =>
  names.map((n, i) => n.trim() || `Team ${i + 1}`);
