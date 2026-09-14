import { AR } from "@/lib/i18n/ar";
import type { Lang } from "@/lib/lang";

export type Vars = Record<string, string | number>;

/**
 * The English string, in the room's language.
 *
 * English is the key and the fallback, so a string with no Arabic yet shows
 * up in English rather than as an id — visible, and easy to add. Placeholders
 * are {name}, substituted after lookup, so Arabic can put them anywhere.
 */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const raw = lang === "ar" ? (AR[key] ?? key) : key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type T = (key: string, vars?: Vars) => string;

export const translator = (lang: Lang): T => (key, vars) => translate(lang, key, vars);
