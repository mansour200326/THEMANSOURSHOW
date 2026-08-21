"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ready = code.trim().length === 4;

  const go = () => {
    if (ready) router.push(`/play/${code.trim().toUpperCase()}`);
  };

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-moon-deep">
          Big Night
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-moon">
          Enter the room code
        </h1>
      </div>

      <input
        value={code}
        onChange={(e) =>
          setCode(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4))
        }
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="ABCD"
        autoFocus
        autoCapitalize="characters"
        autoCorrect="off"
        inputMode="text"
        className="field text-center font-display text-6xl tracking-[0.35em]"
      />

      <button
        onClick={go}
        disabled={!ready}
        className="btn-brand w-full py-6 text-2xl"
      >
        Join
      </button>

      <p className="text-center text-sm text-moon-deep">
        The code is on the TV.
      </p>
    </main>
  );
}
