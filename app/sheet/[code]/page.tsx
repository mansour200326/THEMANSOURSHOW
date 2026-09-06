"use client";

import { use, useState } from "react";
import { useRoom } from "@/lib/room/useRoom";

/**
 * The host's phone, showing what the television must not.
 *
 * Face-Off's answers sit face down on the board and the host has to judge
 * "chips" against "snacks" without seeing either. Every real host of that
 * game has a card in their hand. This is the card.
 *
 * It opens with the six-letter key the lobby shows on the TV. That key is
 * visible to the room for as long as the lobby is, which is a real caveat
 * and an accepted one: this is a party among friends, and somebody who
 * photographs the host key to cheat at Family Feud has a bigger problem than
 * this page can fix.
 */
export default function SheetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [key, setKey] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("key")) ||
      "",
  );
  const [armed, setArmed] = useState(Boolean(key));

  if (!armed) {
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-4 p-6">
        <p className="t-label font-display uppercase text-moon-deep">
          Host sheet · room {code.toUpperCase()}
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-moon">
          The key on the TV
        </h1>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && key.length >= 6 && setArmed(true)}
          placeholder="ABC123"
          maxLength={6}
          autoFocus
          className="field py-5 text-center font-display text-3xl uppercase tracking-[0.3em]"
        />
        <button
          onClick={() => setArmed(true)}
          disabled={key.length < 6}
          className="btn-brand w-full py-5 text-xl"
        >
          Open
        </button>
      </main>
    );
  }

  return <Sheet code={code.toUpperCase()} hostKey={key} />;
}

function Sheet({ code, hostKey }: { code: string; hostKey: string }) {
  const { room, status } = useRoom(code, `host:${hostKey}`);

  if (status === "missing") {
    return <Centre>That room is gone.</Centre>;
  }
  if (!room) return <Centre>Connecting…</Centre>;

  const sheet = room.hostSheet;
  if (!sheet) {
    return (
      <Centre>
        <p className="font-display text-xl uppercase tracking-wide text-moon">
          Nothing to show yet
        </p>
        <p className="text-moon-dim">
          Open Face-Off or Big Board from the lobby on the TV and the answers
          appear here as you play. If this stays blank, check the key.
        </p>
      </Centre>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col gap-3 p-5">
      <p className="t-label font-display uppercase text-moon-deep">Host sheet</p>
      <h1 className="text-balance font-display text-2xl uppercase leading-tight tracking-wide text-moon">
        {sheet.title}
      </h1>
      <ol className="mt-2 flex flex-col gap-2">
        {sheet.lines.map((line, i) => (
          <li
            key={i}
            className={[
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
              line.hidden
                ? "border-accent/50 bg-accent/10"
                : "border-line/10 bg-line/[0.02] opacity-50",
            ].join(" ")}
          >
            <span className="font-display text-lg uppercase tracking-wide text-moon">
              <span className="mr-3 text-moon-deep">{i + 1}</span>
              {line.text}
            </span>
            {line.note && (
              <span className="shrink-0 font-display tabular-nums text-accent">
                {line.note}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-auto pt-4 text-sm text-moon-deep">
        Bright ones are still face down on the TV.
      </p>
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center text-moon-dim">
      {children}
    </main>
  );
}
