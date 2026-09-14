"use client";

import { useEffect, useState } from "react";
import { LANG_COOKIE, type Lang, isLang } from "@/lib/lang";

const EVENT = "bignight:lang";

/** The language, live: follows the toggle wherever it's pressed. */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const read = () => {
      const l = document.documentElement.lang;
      setLang(isLang(l) ? l : "en");
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  return lang;
}

export function applyLang(next: Lang) {
  document.documentElement.lang = next;
  document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENT));
}

/**
 * عربي / English.
 *
 * Arabic means Arabic content — the questions, the prompts, the suggested
 * categories. It's remembered in a cookie, which is what the writers read,
 * and a room started while it's on carries it to every phone.
 */
export function LangToggle({
  className = "",
  prominent = false,
  onChange,
}: {
  className?: string;
  prominent?: boolean;
  /** For a lobby, so the room can be told too. */
  onChange?: (lang: Lang) => void;
}) {
  const lang = useLang();
  const flip = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    applyLang(next);
    onChange?.(next);
  };
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={lang === "ar" ? "Switch to English content" : "Switch to Arabic content"}
      title={lang === "ar" ? "Questions in English" : "الأسئلة بالعربي"}
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
