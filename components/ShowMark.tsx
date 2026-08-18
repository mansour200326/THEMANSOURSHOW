export function ShowMark({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (size === "sm") {
    return (
      <div className="flex items-baseline gap-2 font-display uppercase">
        <span className="cream-text text-lg tracking-[0.22em]">Parlour</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center font-display uppercase">
      <h1 className="cream-text t-hero tracking-[0.06em] drop-shadow-[0_0_40px_rgba(240,228,198,0.25)]">
        Parlour
      </h1>
      <div className="mt-2 flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cream/50" />
        <span className="t-label whitespace-nowrap text-slate-400">
          Games for the room
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cream/50" />
      </div>
    </div>
  );
}
