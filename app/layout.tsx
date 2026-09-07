import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { ConnectionBar } from "@/components/ConnectionBar";
import { SoundControl } from "@/components/SoundControl";
import { THEME_BOOT, ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
    "One screen, everyone's phones, fourteen games. No downloads, no accounts.",
  openGraph: {
    title: "Big Night",
    description: "Fourteen party games. One TV, everyone's phones.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/*
          * Applies a stored light-mode choice before anything paints. React
          * can't do this early enough: by the time it runs, the dark stage
          * has already been on screen for a frame.
          */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        {children}
        <ConnectionBar />
        {/* The bottom-left corner: sound and lights, side by side. */}
        <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2">
          <SoundControl />
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
