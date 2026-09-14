"use client";

import { useLang } from "@/components/LangProvider";
import { LANG_COOKIE, type Lang } from "@/lib/lang";

export { useLang } from "@/components/LangProvider";

/**
 * عربي / English.
 *
 * Arabic means the whole thing: the buttons, the rules, the questions, the
 * suggested categories, right to left. The choice lives in a cookie the
 * server reads, so the page reloads on a flip and every screen — server-
 * rendered or not — comes back in the new language.
 */
export function LangToggle({
  className = "",
  prominent = false,
  onChange,
}: {
  className?: string;
  prominent?: boolean;
  /** Called before the reload, for a lobby that wants to tell the room. */
  onChange?: (lang: Lang) => void;
}) {
  const lang = useLang();
  const flip = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    onChange?.(next);
    // Give a room update a moment to leave before the page goes.
    window.setTimeout(() => window.location.reload(), onChange ? 250 : 0);
  };
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className={
        prominent
          ? `btn-ghost opacity-100 ${className || "px-4 py-2.5 text-sm"}`
          : `flex h-11 w-11 items-center justify-center rounded-full border border-line/10 bg-midnight/70 text-sm opacity-35 transition-all hover:opacity-100 ${className}`
      }
    >
      {lang === "ar" ? "🌐 English" : "🌐 عربي"}
    </button>
  );
}
