"use client";

import { createContext, useContext } from "react";
import { type T, translator } from "@/lib/i18n";
import type { Lang } from "@/lib/lang";

/**
 * The language, handed down from the layout.
 *
 * The layout reads the cookie on the server and passes it here, so the server
 * render and the first client render agree and nothing flashes from English
 * to Arabic. Flipping the toggle writes the cookie and reloads: one path,
 * and the server-rendered pages follow too.
 */
const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): T {
  return translator(useContext(LangContext));
}
