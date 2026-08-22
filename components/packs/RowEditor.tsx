"use client";

import type { PackKind } from "@/lib/packs/types";
import { PACK_NOUN } from "@/lib/packs/types";

/**
 * One editor for seven of the nine content shapes.
 *
 * Riddles, questions, scales, places, words and prompts are all the same thing
 * underneath — a list of rows with two or three fields — so they share this
 * rather than getting six near-identical forms. The two that don't fit are the
 * board and the survey, which have per-row values and nesting; they have their
 * own editors.
 */

export type Field = {
  key: string;
  placeholder: string;
  /** A list field renders as several boxes on one row (a place's roles). */
  list?: number;
  /** One placeholder per box, when numbering the same word reads oddly. */
  each?: string[];
  /** Roughly how much of the row this field takes. */
  grow?: number;
};

const FIELDS: Partial<Record<PackKind, Field[]>> = {
  riddles: [
    { key: "emoji", placeholder: "🧊🏝️🌋", grow: 1 },
    { key: "answer", placeholder: "Iceland", grow: 2 },
    { key: "hint", placeholder: "Country", grow: 1 },
  ],
  qa: [
    { key: "prompt", placeholder: "What's the capital of Japan?", grow: 3 },
    { key: "answer", placeholder: "Tokyo", grow: 1 },
  ],
  spectrum: [
    { key: "left", placeholder: "Overrated", grow: 1 },
    { key: "right", placeholder: "Underrated", grow: 1 },
  ],
  places: [
    { key: "name", placeholder: "A wedding", grow: 1 },
    {
      key: "roles",
      placeholder: "Someone you'd find there",
      list: 6,
      grow: 3,
      each: [
        "The bride",
        "The best man",
        "A bored cousin",
        "The photographer",
        "The DJ",
        "A crying aunt",
      ],
    },
  ],
  timeline: [
    { key: "prompt", placeholder: "Put these in order", grow: 1 },
    {
      key: "events",
      placeholder: "An event",
      list: 5,
      grow: 3,
      each: [
        "Earliest",
        "Then",
        "Then",
        "Then",
        "Latest",
      ],
    },
  ],
};

type Row = Record<string, string | string[]>;

export function rowFieldsFor(kind: PackKind): Field[] | undefined {
  return FIELDS[kind];
}

/** Plain string lists — words and prompts — get the simplest form of all. */
export function isPlainList(kind: PackKind) {
  return kind === "words" || kind === "prompts";
}

export function RowEditor({
  kind,
  rows,
  onChange,
  min,
}: {
  kind: PackKind;
  rows: Row[] | string[];
  onChange: (rows: Row[] | string[]) => void;
  min: number;
}) {
  const noun = PACK_NOUN[kind];
  const fields = FIELDS[kind];
  const plain = isPlainList(kind);

  const remove = (i: number) =>
    onChange((rows as unknown[]).filter((_, j) => j !== i) as Row[]);

  const add = () => {
    if (plain) return onChange([...(rows as string[]), ""]);
    const blank: Row = {};
    fields?.forEach((f) => {
      blank[f.key] = f.list ? Array.from({ length: f.list }, () => "") : "";
    });
    onChange([...(rows as Row[]), blank]);
  };

  const setPlain = (i: number, value: string) =>
    onChange((rows as string[]).map((v, j) => (j === i ? value : v)));

  const setField = (i: number, key: string, value: string | string[]) =>
    onChange((rows as Row[]).map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <div>
      <div className="space-y-3">
        {plain
          ? (rows as string[]).map((value, i) => (
              <div key={i} className="flex items-center gap-3">
                <Index n={i + 1} />
                <input
                  value={value}
                  onChange={(e) => setPlain(i, e.target.value)}
                  placeholder={
                    kind === "words" ? "Bank" : "Name something you'd find in a kitchen"
                  }
                  maxLength={90}
                  className="field"
                />
                <Remove
                  onClick={() => remove(i)}
                  disabled={rows.length <= min}
                  label={`Remove ${noun.one} ${i + 1}`}
                />
              </div>
            ))
          : (rows as Row[]).map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex items-start gap-3">
                  <Index n={i + 1} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {fields?.map((f) =>
                      f.list ? (
                        <div key={f.key} className="grid gap-2 sm:grid-cols-2">
                          {Array.from({ length: f.list }).map((_, k) => (
                            <input
                              key={k}
                              value={((row[f.key] as string[]) ?? [])[k] ?? ""}
                              onChange={(e) => {
                                const next = [
                                  ...(((row[f.key] as string[]) ?? []) || []),
                                ];
                                while (next.length < f.list!) next.push("");
                                next[k] = e.target.value;
                                setField(i, f.key, next);
                              }}
                              placeholder={f.each?.[k] ?? `${f.placeholder} ${k + 1}`}
                              maxLength={80}
                              className="field py-2 text-base"
                            />
                          ))}
                        </div>
                      ) : (
                        <input
                          key={f.key}
                          value={(row[f.key] as string) ?? ""}
                          onChange={(e) => setField(i, f.key, e.target.value)}
                          placeholder={f.placeholder}
                          maxLength={140}
                          className="field py-2 text-base"
                        />
                      ),
                    )}
                  </div>
                  <Remove
                    onClick={() => remove(i)}
                    disabled={rows.length <= min}
                    label={`Remove ${noun.one} ${i + 1}`}
                  />
                </div>
              </div>
            ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="btn-ghost mt-3 w-full py-2.5 text-sm"
      >
        + Add {noun.one}
      </button>
    </div>
  );
}

function Index({ n }: { n: number }) {
  return (
    <span className="w-6 shrink-0 pt-2 text-center font-display text-lg tabular-nums text-moon-deep/70">
      {n}
    </span>
  );
}

function Remove({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="btn-ghost h-10 w-10 shrink-0 px-0 py-0 text-lg"
    >
      ×
    </button>
  );
}
