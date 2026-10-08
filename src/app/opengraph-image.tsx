import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0B1026 0%, #1a1f4d 60%, #0B1026 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #5B4BFF, #3B82F6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            B
          </div>
          BlooCube
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 900 }}>
          Where brands meet the right creators.
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#B8BCD9", marginTop: 24, maxWidth: 820 }}>
          Discover verified creators, launch campaigns, compare bids and manage collaborations securely.
        </div>
      </div>
    ),
    size
  );
}
