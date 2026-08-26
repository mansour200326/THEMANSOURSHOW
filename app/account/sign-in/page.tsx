import Link from "next/link";
import { signIn } from "@/auth";
import { ShowMark } from "@/components/ShowMark";
import { hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Signing in — hosts only, and only to carry a plan.
 *
 * No password field, because a party host signs in about twice a year and a
 * password would be a thing to forget rather than a thing to use. A link in
 * an email is the whole flow.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6">
      <Link href="/" className="self-start opacity-80 hover:opacity-100">
        <ShowMark size="sm" />
      </Link>

      <div>
        <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-moon-dim">
          Only hosts need this, and only for Pro. Everyone else just joins with
          the code on the TV.
        </p>
      </div>

      {!hasDatabase() ? (
        <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-amber-100">
          Sign-in isn&apos;t switched on — this deployment has no database
          attached. Every game still works.
        </p>
      ) : (
        <form
          action={async (formData) => {
            "use server";
            await signIn("resend", {
              email: String(formData.get("email") ?? ""),
              redirectTo: "/account",
            });
          }}
          className="flex flex-col gap-3"
        >
          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
              That link didn&apos;t work. Try again — they expire quickly.
            </p>
          )}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="field py-4 text-center text-lg"
          />
          <button type="submit" className="btn-brand w-full py-4 text-lg">
            Email me a link
          </button>
        </form>
      )}

      <Link href="/" className="btn-ghost self-start px-5 py-3 text-sm">
        Back
      </Link>
    </main>
  );
}
