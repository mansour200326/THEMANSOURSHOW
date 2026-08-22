"use client";

import type { SurveyRound } from "@/lib/packs/types";

/**
 * Writing a Face-Off survey.
 *
 * The one shape with numbers that have to agree: the answers are worth points
 * and the points are supposed to total a hundred, because the conceit is that
 * a hundred people were asked. Nothing here enforces that — a host writing a
 * quick round shouldn't be blocked by arithmetic — but the running total is on
 * screen the whole time and turns amber when it's off, which is enough.
 */
export function SurveyEditor({
  rounds,
  onChange,
  min,
}: {
  rounds: SurveyRound[];
  onChange: (next: SurveyRound[]) => void;
  min: number;
}) {
  const set = (i: number, next: SurveyRound) =>
    onChange(rounds.map((r, j) => (j === i ? next : r)));

  const add = () =>
    onChange([
      ...rounds,
      {
        question: "",
        answers: Array.from({ length: 6 }, () => ({ text: "", points: 0 })),
      },
    ]);

  return (
    <div className="space-y-4">
      {rounds.map((round, i) => {
        const filled = round.answers.filter((a) => a.text.trim());
        const total = filled.reduce((sum, a) => sum + (a.points || 0), 0);
        return (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-center font-display text-lg tabular-nums text-moon-deep/70">
                {i + 1}
              </span>
              <input
                value={round.question}
                onChange={(e) => set(i, { ...round, question: e.target.value })}
                placeholder="We asked 100 people: name something everyone complains about."
                maxLength={200}
                className="field"
              />
              <button
                type="button"
                onClick={() => onChange(rounds.filter((_, j) => j !== i))}
                disabled={rounds.length <= min}
                aria-label={`Remove question ${i + 1}`}
                className="btn-ghost h-11 w-11 shrink-0 px-0 py-0 text-lg"
              >
                ×
              </button>
            </div>

            <div className="mt-3 space-y-2 pl-9">
              {round.answers.map((answer, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input
                    value={answer.text}
                    onChange={(e) => {
                      const answers = [...round.answers];
                      answers[k] = { ...answer, text: e.target.value };
                      set(i, { ...round, answers });
                    }}
                    placeholder={`Answer ${k + 1}${k === 0 ? " — the most popular" : ""}`}
                    maxLength={80}
                    className="field flex-1 py-2 text-base"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={answer.points || ""}
                    onChange={(e) => {
                      const answers = [...round.answers];
                      answers[k] = {
                        ...answer,
                        points: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      };
                      set(i, { ...round, answers });
                    }}
                    placeholder="0"
                    aria-label={`Points for answer ${k + 1}`}
                    className="field w-20 py-2 text-center text-base tabular-nums"
                  />
                </div>
              ))}
            </div>

            <p
              className={[
                "mt-2 pl-9 font-display text-xs uppercase tracking-widest",
                total === 100 ? "text-emerald-300" : "text-amber-300",
              ].join(" ")}
            >
              {filled.length} answers · {total} points
              {total === 100 ? " ✓" : " — should add up to 100"}
            </p>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="btn-ghost w-full py-2.5 text-sm"
      >
        + Add question
      </button>
    </div>
  );
}
