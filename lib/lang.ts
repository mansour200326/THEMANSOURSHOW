/**
 * Which language the room plays in.
 *
 * Arabic here means Arabic *content*: the clues, the prompts, the categories
 * the model writes, and the suggestions the host taps. The controls stay in
 * English for now — that's a second round. The choice lives in a cookie so
 * the server routes that write content can read it, and on the room so every
 * phone renders the same way as the TV.
 */
export type Lang = "en" | "ar";

export const LANG_COOKIE = "bignight_lang";

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ar";

/** The language in a cookie header, or English. */
export function langFromCookie(header: string | null | undefined): Lang {
  const m = (header ?? "").match(/(?:^|;\s*)bignight_lang=(ar|en)\b/);
  return m ? (m[1] as Lang) : "en";
}

/**
 * The library shelf and the history are kept per language: an Arabic board
 * about "Football" is not the English one, and a host who has seen the
 * English answers hasn't seen the Arabic ones.
 */
export const withLang = (gameType: string, lang: Lang): string =>
  lang === "ar" ? `${gameType}:ar` : gameType;

/** Runs before React, from the layout. Marks the document so the CSS knows. */
export const LANG_BOOT = `(function(){try{var m=document.cookie.match(/(?:^|; )bignight_lang=(ar|en)/);if(m)document.documentElement.lang=m[1];}catch(e){}})();`;

/**
 * What the writers are told. Appended to every system prompt, so the one
 * place the language changes is here.
 */
export function langBrief(lang: Lang): string {
  if (lang !== "ar") return "";
  return (
    "\n\nLANGUAGE: Write everything a player will read in Arabic. Modern " +
    "Standard Arabic that a Gulf audience finds natural, with a light " +
    "Khaleeji touch where a colloquial word is the obvious one. Category " +
    "titles, clues, questions, answers, prompts, setups, places, words, " +
    "riddle titles — all in Arabic script. Keep answers short. Foreign people, " +
    "places and titles in their common Arabic form (نيويورك، ليونيل ميسي، " +
    "تايتانيك). Years and scores in Western digits (1999). Lean on the Arab " +
    "world for material where the theme allows — Gulf and Arabic television, " +
    "music, football, food, history, poetry, the Islamic calendar — and treat " +
    "an English theme as a topic to write about in Arabic, not a language " +
    "choice. The one exception: any field meant for an image search — a " +
    "'picture' subject or a photo description — stays in English, because " +
    "the photo archive is searched in English."
  );
}
