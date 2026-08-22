"use client";

import { useEffect, useState } from "react";
import { BoardEditor } from "@/components/packs/BoardEditor";
import { RowEditor, isPlainList } from "@/components/packs/RowEditor";
import { SurveyEditor } from "@/components/packs/SurveyEditor";
import { packSize } from "@/lib/packs/convert";
import {
  deletePack,
  exportPacks,
  importPacks,
  listPacks,
  savePack,
} from "@/lib/packs/store";
import {
  PACK_KIND,
  PACK_MINIMUM,
  PACK_NOUN,
  type BoardCategory,
  type PackData,
  type PackKind,
  type SavedPack,
  type SurveyRound,
  emptyPackData,
} from "@/lib/packs/types";

/**
 * Write your own content for a game, save it under a name, and play it.
 *
 * Saved packs are the point. A one-off form you fill in and lose isn't a
 * template — the set you wrote for someone's birthday should still be there
 * next month, and reusable next time the same people are round.
 */
export function PackWorkshop({
  gameId,
  gameName,
  onPlay,
  onBack,
}: {
  gameId: string;
  gameName: string;
  /** Hand the finished rows to whoever asked for them. */
  onPlay: (kind: PackKind, data: PackData[PackKind]) => void;
  onBack: () => void;
}) {
  const kind = PACK_KIND[gameId] ?? "prompts";
  const noun = PACK_NOUN[kind];
  const min = PACK_MINIMUM[kind];

  const [saved, setSaved] = useState<SavedPack[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [data, setData] = useState<PackData[PackKind]>(() => emptyPackData(kind));
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => setSaved(listPacks(gameId)), [gameId]);

  const ready = packSize(kind, data);
  const enough = ready >= min;

  const load = (pack: SavedPack) => {
    setEditingId(pack.id);
    setName(pack.name);
    setData(pack.data);
    setNote(null);
  };

  const fresh = () => {
    setEditingId(null);
    setName("");
    setData(emptyPackData(kind));
    setNote(null);
  };

  const store = () => {
    const pack = savePack({
      id: editingId ?? undefined,
      name: name || `${gameName} pack`,
      kind,
      gameId,
      data,
    });
    setEditingId(pack.id);
    setSaved(listPacks(gameId));
    setNote(`Saved as “${pack.name}”.`);
  };

  const download = () => {
    const blob = new Blob([exportPacks()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "big-night-packs.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = (file: File) => {
    file.text().then((text) => {
      try {
        const n = importPacks(text);
        setSaved(listPacks(gameId));
        setNote(n ? `Imported ${n} pack${n === 1 ? "" : "s"}.` : "Nothing in that file.");
      } catch {
        setNote("That file didn't look like a pack export.");
      }
    });
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="t-label font-display uppercase text-moon-deep">
            Your own {noun.many}
          </p>
          <h1 className="accent-text font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            {gameName}
          </h1>
        </div>
        <button onClick={onBack} className="btn-ghost px-5 py-2 text-sm">
          ← Back
        </button>
      </div>

      {/* Anything written before */}
      {saved.length > 0 && (
        <div className="mt-6">
          <p className="t-label font-display uppercase text-moon-deep">Saved</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {saved.map((pack) => (
              <span
                key={pack.id}
                className={[
                  "flex items-center gap-1 rounded-full border py-1 pl-4 pr-1 transition-colors",
                  pack.id === editingId
                    ? "border-accent bg-accent/15"
                    : "border-white/12 bg-white/[0.03]",
                ].join(" ")}
              >
                <button
                  onClick={() => load(pack)}
                  className="font-display text-sm uppercase tracking-wide text-moon/90"
                >
                  {pack.name}
                </button>
                <button
                  onClick={() => {
                    deletePack(pack.id);
                    setSaved(listPacks(gameId));
                    if (pack.id === editingId) fresh();
                  }}
                  aria-label={`Delete ${pack.name}`}
                  className="h-7 w-7 rounded-full text-moon-deep hover:text-rose-300"
                >
                  ×
                </button>
              </span>
            ))}
            <button onClick={fresh} className="btn-ghost px-4 py-1.5 text-xs">
              + New
            </button>
          </div>
        </div>
      )}

      {/* The editor */}
      <div className="mt-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Name this pack — "Boys' quiz", "Sara's birthday"`}
          maxLength={40}
          className="field font-display uppercase tracking-wide"
        />
      </div>

      <div className="mt-5">
        {kind === "board" ? (
          <BoardEditor
            categories={data as BoardCategory[]}
            onChange={(next) => setData(next)}
            min={min}
          />
        ) : kind === "survey" ? (
          <SurveyEditor
            rounds={data as SurveyRound[]}
            onChange={(next) => setData(next)}
            min={min}
          />
        ) : (
          <RowEditor
            kind={kind}
            rows={data as never}
            onChange={(next) => setData(next as PackData[PackKind])}
            min={isPlainList(kind) ? min : 1}
          />
        )}
      </div>

      {note && <p className="mt-4 text-sm text-accent">{note}</p>}

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 bg-midnight/90 py-4 backdrop-blur">
        <span
          className={[
            "font-display text-sm uppercase tracking-widest",
            enough ? "text-emerald-300" : "text-moon-deep",
          ].join(" ")}
        >
          {ready} {ready === 1 ? noun.one : noun.many} ready
          {enough ? " ✓" : ` · need ${min}`}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="btn-ghost cursor-pointer px-4 py-2 text-xs">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </label>
          <button onClick={download} className="btn-ghost px-4 py-2 text-xs">
            Export
          </button>
          <button onClick={store} className="btn-ghost px-5 py-2 text-sm">
            Save
          </button>
          <button
            onClick={() => onPlay(kind, data)}
            disabled={!enough}
            className="btn-brand px-8 py-3"
          >
            Play this
          </button>
        </div>
      </div>
    </main>
  );
}
