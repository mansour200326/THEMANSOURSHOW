import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang, isLang } from "@/lib/lang";
import { type T, translator } from "@/lib/i18n";

/** The language this request asked for, from the cookie. */
export async function currentLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

/** A translator for a server component. */
export async function tl(): Promise<T> {
  return translator(await currentLang());
}
