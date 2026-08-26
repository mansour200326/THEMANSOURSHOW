import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ShowMark } from "@/components/ShowMark";
import { ENTITLEMENTS } from "@/lib/plan/limits";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-2xl uppercase text-moon/90">
          Not signed in
        </h1>
        <Link href="/account/sign-in" className="btn-brand px-8 py-4">
          Sign in
        </Link>
      </main>
    );
  }

  const { plan, email, planExpiresAt } = session.user;
  const limits = ENTITLEMENTS[plan];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6">
      <Link href="/" className="self-start opacity-80 hover:opacity-100">
        <ShowMark size="sm" />
      </Link>

      <div>
        <p className="t-label font-display uppercase text-moon-deep">
          Signed in as
        </p>
        <p className="font-display text-xl text-moon">{email}</p>
      </div>

      <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-6">
        <p className="font-display text-2xl uppercase tracking-wide text-accent-bright">
          {plan === "pro" ? "Pro Host" : "Free"}
        </p>
        {planExpiresAt && (
          <p className="mt-1 text-sm text-moon-deep">
            Until {new Date(planExpiresAt).toLocaleDateString()}
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-1.5 text-moon/80">
          <li>{limits.games === "all" ? "All sixteen games" : `${limits.games} games`}</li>
          <li>
            {limits.aiPerNight === "unlimited"
              ? "Unlimited written boards"
              : `${limits.aiPerNight} written boards a night`}
          </li>
          <li>{limits.players} phones in a room</li>
        </ul>
      </div>

      <div className="flex gap-3">
        {plan === "free" && (
          <Link href="/account/upgrade" className="btn-brand px-6 py-4">
            See Pro
          </Link>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="btn-ghost px-6 py-4">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
