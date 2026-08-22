export function ShowMark({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (size === "sm") {
    return (
      <span className="brand-text whitespace-nowrap font-display text-base uppercase tracking-[0.2em] sm:text-lg sm:tracking-[0.24em]">
        Big Night
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center font-display uppercase">
      <h1 className="brand-text t-hero tracking-[0.08em] drop-shadow-[0_0_50px_rgba(255,107,87,0.35)]">
        Big Night
      </h1>
      <div className="mt-2 flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/50" />
        <span className="t-label whitespace-nowrap text-moon-dim">
          Games for the room
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/50" />
      </div>
    </div>
  );
}
