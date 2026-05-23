import Image from "next/image";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// at the top, outside the function
const logoUrl = "https://caresync.vercel.app/android-chrome-512x512.png";

// then replace the ✚ div with:


export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #e8f0e4 0%, #d8e8d0 40%, #c8dac0 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
        }}
      >
        {/* top: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Image
            src={logoUrl}
            alt="logo"
            width={72}
            height={72}
            style={{ borderRadius: "50%" }}
            />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: "#203C67", lineHeight: "1" }}>
              CareSync
            </span>
            <span style={{ fontSize: 15, color: "#4a6b4a", letterSpacing: "0.12em" }}>
              HEALTH MANAGEMENT
            </span>
          </div>
        </div>

        {/* middle: tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 100, fontWeight: 700, color: "#203C67", lineHeight: "1.05", letterSpacing: "-3px" }}>
            Your health,
          </span>
          <span style={{ fontSize: 100, fontWeight: 700, color: "#4a7a3a", lineHeight: "1.05", letterSpacing: "-3px" }}>
            in sync.
          </span>
          <span style={{ fontSize: 28, color: "#203C67", opacity: 0.45, marginTop: 16 }}>
            Book your appointment — unbothered and quick.
          </span>
        </div>

        {/* bottom: footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, color: "#203C67", opacity: 0.3 }}>
            caresync.vercel.app
          </span>
          <span style={{ fontSize: 20, color: "#203C67", opacity: 0.3 }}>
            a project by Shubh
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}