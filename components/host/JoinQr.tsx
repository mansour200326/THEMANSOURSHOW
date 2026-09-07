"use client";

import { useEffect, useState } from "react";
import { toString as qrToString } from "qrcode";

/**
 * The join address as something a phone camera reads in one second.
 *
 * Typing bignight.games/play and a four-letter code is fine. Pointing a
 * camera at the television is better, and it removes the two places people
 * mistype: the domain, and the O that was a zero. Drawn as SVG on the client
 * from the same URL the text shows, so the two can never disagree.
 */
export function JoinQr({ url, className = "" }: { url: string; className?: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!url) return;
    let live = true;
    qrToString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#101A3C", light: "#F4F2EC" },
    })
      .then((s) => live && setSvg(s))
      .catch(() => {
        /* The URL is still printed beside it; the code is a bonus. */
      });
    return () => {
      live = false;
    };
  }, [url]);

  if (!svg) return null;
  return (
    <div
      aria-label={`QR code for ${url}`}
      role="img"
      className={`overflow-hidden rounded-xl bg-[#F4F2EC] p-1 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
