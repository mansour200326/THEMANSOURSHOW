import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { ConnectionBar } from "@/components/ConnectionBar";
import { SoundControl } from "@/components/SoundControl";
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
    "One screen, everyone's phones, sixteen games. No downloads, no accounts.",
  openGraph: {
    title: "Big Night",
    description: "Sixteen party games. One TV, everyone's phones.",
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
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <ConnectionBar />
        <SoundControl />
      </body>
    </html>
  );
}
