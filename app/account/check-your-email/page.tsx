import Link from "next/link";
import { tl } from "@/lib/i18n/server";

const canEmail = () => Boolean(process.env.AUTH_RESEND_KEY?.trim());

export default async function CheckYourEmail() {
  const t = await tl();
  if (!canEmail()) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="t-label font-display uppercase tracking-[0.3em] text-moon-deep">{t(t(t("Made it")))}</p>
        <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight">{t(t(t("Check the logs")))}</h1>
        <p className="max-w-sm text-moon-dim">
          No email provider is configured, so your sign-in link was printed to
          the server log instead. On Railway that&apos;s your service &rarr;
          Deployments &rarr; the running deploy. Look for the box with the link
          in it.
        </p>
        <Link href="/" className="btn-ghost px-6 py-3">{t(t(t("Back to the start")))}</Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="t-label font-display uppercase tracking-[0.3em] text-moon-deep">{t(t(t("On its way")))}</p>
      <h1 className="brand-text font-display text-4xl font-bold uppercase tracking-tight">{t(t(t("Check your email")))}</h1>
      <p className="max-w-sm text-moon-dim">{t(t(t("There's a link in your inbox. It signs you in on this device and then it's no use to anybody, so it expires quickly.")))}</p>
      <Link href="/" className="btn-ghost px-6 py-3">{t(t(t("Back to the start")))}</Link>
    </main>
  );
}
