import type { Metadata, Viewport } from "next";
import { Cairo, Inter, Oswald } from "next/font/google";
import { ConnectionBar } from "@/components/ConnectionBar";
import { SoundControl } from "@/components/SoundControl";
import { THEME_BOOT, ThemeToggle } from "@/components/ThemeToggle";
import { LangProvider } from "@/components/LangProvider";
import { currentLang } from "@/lib/i18n/server";
import "./globals.css";

const display = Oswald({
  /*
   * No automatic local stand-in for this face. The stand-in next/font adds
   * covers every character, so Arabic letters were being drawn by it — a
   * system font — before Cairo, which comes later in the stack, was ever
   * consulted. Without it, a glyph this face lacks falls through to Cairo.
   */
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  /*
   * No automatic local stand-in for this face. The stand-in next/font adds
   * covers every character, so Arabic letters were being drawn by it — a
   * system font — before Cairo, which comes later in the stack, was ever
   * consulted. Without it, a glyph this face lacks falls through to Cairo.
   */
  adjustFontFallback: false,
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/*
 * Arabic. The display face has no Arabic glyphs, so Cairo sits behind it in
 * every stack: Latin keeps its face, Arabic falls through to this one, and
 * a mixed line reads as one line.
 */
const arabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute URLs for the link card. Without a base, the preview image
  // resolves against nothing and chat apps show a blank card.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bignight.games",
  ),
  title: "Big Night — party games for the room",
  description:
    "One screen, everyone's phones, seventeen games. No downloads, no accounts.",
  openGraph: {
    title: "Big Night",
    description: "Seventeen party games. One TV, everyone's phones.",
    siteName: "Big Night",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#101A3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await currentLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${display.variable} ${body.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        {/*
          * Applies a stored light-mode choice before anything paints. React
          * can't do this early enough: by the time it runs, the dark stage
          * has already been on screen for a frame.
          */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <LangProvider lang={lang}>
        {children}
        <ConnectionBar />
        </LangProvider>
        {/*
          * The bottom-left corner: sound and lights, side by side. Hidden
          * while the lobby is up, because the lobby puts labelled ones in
          * its header where they can actually be seen.
          */}
        <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2 [body[data-controls=header]_&]:hidden">
          <SoundControl />
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
