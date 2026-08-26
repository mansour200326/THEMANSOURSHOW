import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/auth";
import { hasDatabase, query } from "@/lib/db";
import { isAdmin } from "@/lib/plan/admin";
import { setPlanByEmail } from "@/lib/plan/billing";
import type { Plan } from "@/lib/plan/limits";

export const dynamic = "force-dynamic";

/**
 * Setting somebody's plan, until Stripe does it.
 *
 * Goes through the same setPlan* functions a webhook will, so payments
 * arriving means adding a webhook route rather than reworking this.
 */
type Row = {
  id: string;
  email: string | null;
  plan: Plan;
  plan_expires_at: Date | null;
  plan_source: string;
  created_at: Date;
};

export default async function AdminPage() {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    // Deliberately identical whether you're signed out, signed in as somebody
    // else, or the page doesn't apply — an admin page shouldn't confirm it
    // exists to people who can't use it.
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-moon-dim">Nothing here.</p>
      </main>
    );
  }

  const users = await query<Row>(
    `SELECT id, email, plan, plan_expires_at, plan_source, created_at
       FROM users ORDER BY created_at DESC LIMIT 100`,
  );

  const stats = await query<{ boards: string; personal: string; retired: string; served: string }>(
    `SELECT count(*)::text AS boards,
            count(*) FILTER (WHERE is_personal)::text AS personal,
            count(*) FILTER (WHERE retired_at IS NOT NULL)::text AS retired,
            coalesce(sum(times_served), 0)::text AS served
       FROM boards`,
  );

  async function grant(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const plan = String(formData.get("plan") ?? "free") as Plan;
    const months = Number(formData.get("months") ?? 0);
    if (!email) return;
    await setPlanByEmail(
      email,
      plan === "pro" ? "pro" : "free",
      plan === "pro" && months > 0
        ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
        : null,
      "admin",
    );
    revalidatePath("/admin");
  }

  const s = stats[0];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="brand-text font-display text-3xl font-bold uppercase tracking-tight">
          Admin
        </h1>
        <Link href="/" className="btn-ghost px-4 py-2 text-sm">
          Back
        </Link>
      </div>

      {!hasDatabase() && (
        <p className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-amber-100">
          No database attached, so plans aren&apos;t enforced and nothing here
          persists. Every host is being treated as Pro.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg uppercase tracking-widest text-moon/75">
          Library
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Boards" value={s?.boards ?? "0"} />
          <Stat label="Personal" value={s?.personal ?? "0"} />
          <Stat label="Retired" value={s?.retired ?? "0"} />
          <Stat label="Times served" value={s?.served ?? "0"} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg uppercase tracking-widest text-moon/75">
          Set a plan
        </h2>
        <form action={grant} className="mt-3 flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="someone@example.com"
            className="field flex-1 min-w-[16rem]"
          />
          <select name="plan" className="field w-28" defaultValue="pro">
            <option value="pro">pro</option>
            <option value="free">free</option>
          </select>
          <input
            name="months"
            type="number"
            min={0}
            max={120}
            defaultValue={12}
            title="Months — 0 for no expiry"
            className="field w-24"
          />
          <button type="submit" className="btn-accent px-6">
            Apply
          </button>
        </form>
        <p className="mt-2 text-sm text-moon-deep">
          They have to have signed in once before they exist. Months of 0 means
          no expiry.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg uppercase tracking-widest text-moon/75">
          Accounts ({users.length})
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-moon-deep">
              <tr>
                <th className="py-2 pr-4 font-display uppercase">Email</th>
                <th className="py-2 pr-4 font-display uppercase">Plan</th>
                <th className="py-2 pr-4 font-display uppercase">Until</th>
                <th className="py-2 font-display uppercase">Source</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/8">
                  <td className="py-2 pr-4 text-moon">{u.email}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        u.plan === "pro" ? "text-accent-bright" : "text-moon-deep"
                      }
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-moon-dim">
                    {u.plan_expires_at
                      ? new Date(u.plan_expires_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-2 text-moon-deep">{u.plan_source}</td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-moon-deep">
                    Nobody has signed in yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
      <p className="t-label font-display uppercase text-moon-deep">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums text-moon">{value}</p>
    </div>
  );
}
