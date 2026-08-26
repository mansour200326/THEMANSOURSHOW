import Link from "next/link";

const canEmail = () => Boolean(process.env.AUTH_RESEND_KEY?.trim());

export default function CheckYourEmail() {
  if (!canEmail()) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="t-label font-display uppercase tracking-[0.3em] text-moon-deep">
          Made it
        </p>
        <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight">
          Check the logs
        </h1>
        <p className="max-w-sm text-moon-dim">
          No email provider is configured, so your sign-in link was printed to
          the server log instead. On Railway that&apos;s your service &rarr;
          Deployments &rarr; the running deploy. Look for the box with the link
          in it.
        </p>
        <Link href="/" className="btn-ghost px-6 py-3">
          Back to the start
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="t-label font-display uppercase tracking-[0.3em] text-moon-deep">
        On its way
      </p>
      <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight">
        Check your email
      </h1>
      <p className="max-w-sm text-moon-dim">
        There&apos;s a link in your inbox. It signs you in on this device and
        then it&apos;s no use to anybody, so it expires quickly.
      </p>
      <Link href="/" className="btn-ghost px-6 py-3">
        Back to the start
      </Link>
    </main>
  );
}
