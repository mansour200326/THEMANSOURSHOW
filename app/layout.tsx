import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
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
  title: "Parlour — party games for the room",
  description: "Party games for the room. The TV is the stage, your phone is the controller.",
};

export const viewport: Viewport = {
  themeColor: "#04081a",
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
      <body>{children}</body>
    </html>
  );
}
