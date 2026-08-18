"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RoundState } from "@/lib/games/roundEngine";
import { type Player, type Room, playerById } from "@/lib/room/types";

type Props = {
  room: Room;
  state: RoundState;
  me: Player;
  onSubmit: (text: string) => void;
  onVote: (optionId: string) => void;
};

export function RoundPlayer({ room, state, me, onSubmit, onVote }: Props) {
  const [draft, setDraft] = useState("");
  const prompt = state.prompts[state.round];
  const mySubmission = state.submissions[me.id];
  const myVote = state.votes[me.id];
  const isGuessWho = room.gameId === "guess-who-said-it";

  // Fresh box every round.
  useEffect(() => setDraft(""), [state.round, state.phase]);

  if (state.phase === "done") {
    const ranked = [...room.players].sort((a, b) => b.score - a.score);
    const place = ranked.findIndex((p) => p.id === me.id) + 1;
    return (
      <Shell title="Segment over">
        <p className="text-center font-display text-6xl text-cream">#{place}</p>
        <p className="text-center text-slate-400">
          {me.score.toLocaleString()} points tonight
        </p>
      </Shell>
    );
  }

  if (state.phase === "collect") {
    if (mySubmission !== undefined) {
      return (
        <Shell title="Locked in">
          <p className="rounded-xl border border-cream/30 bg-cream/[0.07] px-5 py-4 text-center text-lg text-slate-100">
            {mySubmission}
          </p>
          <p className="text-center text-slate-500">Waiting for everyone else…</p>
        </Shell>
      );
    }
    return (
      <Shell title={prompt?.text ?? ""}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Type your answer"
          className="field text-lg"
        />
        <button
          onClick={() => draft.trim() && onSubmit(draft)}
          disabled={!draft.trim()}
          className="btn-cream w-full py-5 text-xl"
        >
          Send it
        </button>
      </Shell>
    );
  }

  if (state.phase === "vote") {
    const focusText = state.focus ? state.submissions[state.focus] : null;

    if (myVote !== undefined) {
      const chosen = state.options.find((o) => o.id === myVote);
      return (
        <Shell title="Vote in">
          <p className="rounded-xl border border-cream/30 bg-cream/[0.07] px-5 py-4 text-center text-lg text-slate-100">
            {chosen?.label}
          </p>
          <p className="text-center text-slate-500">Waiting for everyone else…</p>
        </Shell>
      );
    }

    return (
      <Shell title={isGuessWho ? "Who wrote this?" : prompt?.text ?? ""}>
        {isGuessWho && focusText && (
          <p className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-center text-lg text-slate-100">
            “{focusText}”
          </p>
        )}
        <div className="grid gap-3">
          {state.options.map((option) => {
            const mine = option.authorId === me.id;
            return (
              <button
                key={option.id}
                onClick={() => !mine && onVote(option.id)}
                disabled={mine}
                className={[
                  "min-h-[4.5rem] rounded-xl border px-5 py-4 text-left text-lg transition-colors",
                  mine
                    ? "cursor-not-allowed border-white/8 bg-white/[0.02] text-slate-600"
                    : "border-white/15 bg-white/[0.04] text-slate-100 active:border-cream/70 active:bg-cream/10",
                ].join(" ")}
              >
                {option.label}
                {mine && (
                  <span className="mt-1 block font-display text-xs uppercase tracking-widest text-slate-600">
                    That&apos;s yours
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  /* reveal */
  const gained = state.lastScores[me.id] ?? 0;
  return (
    <Shell title={gained ? "Nice" : "Nothing that round"}>
      <motion.p
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={[
          "text-center font-display text-6xl font-bold",
          gained ? "text-emerald-300" : "text-slate-600",
        ].join(" ")}
      >
        {gained ? `+${gained}` : "—"}
      </motion.p>
      <p className="text-center text-slate-500">Look at the TV.</p>
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col gap-5 p-5">
      <h1 className="text-balance pt-2 text-center font-display text-xl uppercase leading-snug tracking-wide text-slate-200">
        {title}
      </h1>
      <div className="flex flex-1 flex-col justify-center gap-4">{children}</div>
    </div>
  );
}
