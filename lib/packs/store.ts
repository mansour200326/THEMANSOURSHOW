"use client";

import {
  type PackData,
  type PackKind,
  type SavedPack,
  emptyPackData,
} from "@/lib/packs/types";

/**
 * Saved packs live in the host's browser.
 *
 * Not on the server, deliberately: there are no accounts, rooms are already
 * ephemeral, and the person writing the questions is always sitting at the
 * machine running the show. localStorage means a pack survives the night, the
 * deploy, and the server restart — which is more than the rooms manage.
 *
 * The cost is that packs don't follow you to another device. The export and
 * import below are the way round that, and they're also the way two people
 * write a quiz between them.
 */

const KEY = "bignight:packs:v1";

const read = (): SavedPack[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedPack[]) : [];
  } catch {
    return [];
  }
};

const write = (packs: SavedPack[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(packs));
  } catch {
    /* private mode, or full — the pack just won't persist */
  }
};

/** Everything written for one game, newest first. */
export function listPacks(gameId: string): SavedPack[] {
  return read()
    .filter((p) => p.gameId === gameId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPack(id: string): SavedPack | undefined {
  return read().find((p) => p.id === id);
}

export function savePack<K extends PackKind>(pack: {
  id?: string;
  name: string;
  kind: K;
  gameId: string;
  data: PackData[K];
}): SavedPack {
  const packs = read();
  const saved: SavedPack = {
    id: pack.id ?? `pack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: pack.name.trim() || "Untitled",
    kind: pack.kind,
    gameId: pack.gameId,
    updatedAt: Date.now(),
    data: pack.data,
  };
  const without = packs.filter((p) => p.id !== saved.id);
  write([saved, ...without]);
  return saved;
}

export function deletePack(id: string) {
  write(read().filter((p) => p.id !== id));
}

/** A fresh, empty pack of the right shape for a game. */
export const blankPack = (kind: PackKind) => emptyPackData(kind);

/* ------------------------------------------------------ moving packs about */

/** Everything, as a file the host can keep or send to someone. */
export function exportPacks(): string {
  return JSON.stringify({ version: 1, packs: read() }, null, 2);
}

/**
 * Merge a file back in. Ids are regenerated so importing your own export
 * twice doesn't quietly overwrite the copy you've since edited.
 */
export function importPacks(json: string): number {
  const parsed = JSON.parse(json) as { packs?: SavedPack[] };
  const incoming = Array.isArray(parsed?.packs) ? parsed.packs : [];
  const clean = incoming.filter(
    (p) => p && typeof p.name === "string" && typeof p.gameId === "string" && p.data,
  );
  if (!clean.length) return 0;
  const stamped = clean.map((p, i) => ({
    ...p,
    id: `pack-${Date.now().toString(36)}-${i}`,
    updatedAt: Date.now(),
  }));
  write([...stamped, ...read()]);
  return stamped.length;
}
