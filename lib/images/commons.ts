import "server-only";

/**
 * Pictures for picture clues, from Wikimedia Commons.
 *
 * A model cannot hand you an image. Ask one for a photo URL and it invents a
 * plausible-looking address that 404s, which on a television in front of ten
 * people is worse than having no picture at all. So the model says what the
 * picture should be *of*, and this goes and finds a real one.
 *
 * Commons because it is the only source that is simultaneously free to use,
 * enormous, properly licensed, and about *subjects* — real people, places,
 * animals, flags, paintings, objects. Stock-photo sites have beautiful
 * pictures of nothing in particular, which is useless when the question is
 * "who is this?".
 *
 * The hard part is not finding an image, it's refusing the wrong one. A search
 * for "Mickey Mouse" returns a file called Earlypete.jpg — a different
 * character altogether — and putting that on screen under the answer "Mickey
 * Mouse" ruins the round and makes the game look broken. Everything below is
 * built around rejecting rather than finding: no confident match, no picture,
 * and the clue is played as text.
 */

const ENDPOINT = "https://commons.wikimedia.org/w/api.php";

/** Commons asks that tools identify themselves, and it's their bandwidth. */
const AGENT = "BigNight/1.0 (https://bignight.games; party game)";

export type ClueImage = {
  /** Ready-sized for a television, not the 8000px original. */
  url: string;
  /** Author and licence, shown when the answer is. */
  credit: string;
  licence: string;
  /** The file page, so the credit can be followed to its source. */
  sourceUrl: string;
};

const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "at", "and", "or", "de", "la",
  "portrait", "photo", "photograph", "picture", "image", "bust", "statue",
]);

/** The words that have to show up in a filename for it to be the right thing. */
const keyWords = (subject: string): string[] =>
  subject
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

/**
 * Does this file plausibly show what we asked for?
 *
 * Commons filenames are descriptive by convention — "The Treasury, Petra,
 * Jordan1.jpg", "Mona Lisa, by Leonardo da Vinci" — so requiring the
 * subject's distinctive words to appear in the title is a crude check that
 * happens to be a very effective one. It throws away good images whose names
 * are unhelpful, which costs nothing: the clue simply runs as text.
 */
function looksRight(title: string, subject: string): boolean {
  const words = keyWords(subject);
  if (!words.length) return false;
  const haystack = title.toLowerCase().replace(/[_\-]/g, " ");
  const hits = words.filter((w) => haystack.includes(w)).length;
  // Every word for a one- or two-word subject; most of them for a longer one.
  return words.length <= 2 ? hits === words.length : hits >= Math.ceil(words.length * 0.7);
}

/** Diagrams, maps, logos and charts are not "who is this?" material. */
const WRONG_SHAPE =
  /\b(map|diagram|chart|logo|icon|coat of arms|signature|location|locator|graph|plaque|timeline|blank)\b/i;

/**
 * Photographs nobody wants on the wall at a party.
 *
 * The very first picture clue this produced was the Statue of Liberty with
 * the World Trade Center burning behind it — a National Park Service photo
 * from September 11th. Correctly identified, properly licensed, technically a
 * picture of the right landmark, and an appalling thing to put on a screen in
 * a room of people playing a game.
 *
 * Commons is an archive of everything, including the worst days on record,
 * and "is this the right subject?" is a different question from "should this
 * be on the television tonight?". Filenames are descriptive enough that
 * refusing on them catches most of it. It over-refuses, which costs a clue
 * its picture and costs nothing else.
 */
const GRIM =
  /\b(9[-\s]?11|september 11|ground zero|memorial|cemetery|grave|funeral|war|battle|bomb|bombing|attack|terror|massacre|shooting|crash|wreck|disaster|earthquake|tsunami|famine|refugee|riot|protest|corpse|autopsy|wound|injur|casualt|nazi|holocaust|execution|nuclear)\b/i;

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

type CommonsPage = {
  title: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }>;
};

/**
 * Find a picture of `subject`, or nothing.
 *
 * Never throws. A picture is a bonus on top of a clue that already works
 * without one, so every failure here — network, rate limit, nothing suitable
 * — has to end with the clue being played as text rather than the board
 * failing to build.
 */
export async function findPicture(subject: string): Promise<ClueImage | null> {
  const term = subject.trim();
  if (term.length < 2) return null;

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `${term} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1400",
  });

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { "User-Agent": AGENT, "Api-User-Agent": AGENT },
      // Commons is stable content; a day of caching is polite and faster.
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      query?: { pages?: Record<string, CommonsPage> };
    };
    const pages = Object.values(data.query?.pages ?? {});

    for (const page of pages) {
      const title = page.title.replace(/^File:/, "");
      if (WRONG_SHAPE.test(title)) continue;
      if (GRIM.test(title)) continue;
      if (!looksRight(title, term)) continue;

      const info = page.imageinfo?.[0];
      const url = info?.thumburl ?? info?.url;
      if (!url) continue;

      const meta = info?.extmetadata ?? {};
      const licence = stripHtml(meta.LicenseShortName?.value ?? "").slice(0, 40);
      // No licence stated means no permission established. Skip it.
      if (!licence) continue;

      const artist = stripHtml(meta.Artist?.value ?? "").slice(0, 60);

      return {
        url,
        credit: artist || "Wikimedia Commons",
        licence,
        sourceUrl: info?.descriptionurl ?? "https://commons.wikimedia.org",
      };
    }
  } catch {
    // A picture is a bonus. Losing it costs the clue nothing.
  }
  return null;
}
