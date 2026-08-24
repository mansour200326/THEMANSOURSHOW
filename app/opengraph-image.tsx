import { ImageResponse } from "next/og";

/**
 * The card that shows when the link is pasted into a group chat — which is
 * exactly how this gets shared, and until now it previewed as nothing at all.
 * Drawn here rather than shipped as a file so it can't drift from the brand.
 */
export const runtime = "edge";
export const alt = "Big Night — party games for the room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#101A3C",
          color: "#F4F2EC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -4,
            textTransform: "uppercase",
            color: "#FF6B57",
            display: "flex",
          }}
        >
          Big Night
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 38,
            letterSpacing: 2,
            opacity: 0.75,
            display: "flex",
          }}
        >
          Sixteen games · one TV · everyone&apos;s phones
        </div>
      </div>
    ),
    size,
  );
}
