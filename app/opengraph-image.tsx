import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const [ibmPlex, dmSerif, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/assets/fonts/IBMPlexMono-Regular.ttf")),
    readFile(join(process.cwd(), "public/assets/fonts/DMSerifDisplay-Regular.ttf")),
    readFile(join(process.cwd(), "public/logo-only.png")),
  ]);

  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

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
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* background circles */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 420, height: 420, borderRadius: "50%", background: "#b8d4c0", opacity: 0.45, display: "flex" }} />
        <div style={{ position: "absolute", top: 60, right: 180, width: 220, height: 220, borderRadius: "50%", background: "#203C67", opacity: 0.06, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -100, right: 100, width: 340, height: 340, borderRadius: "50%", background: "#4a7a3a", opacity: 0.1, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "#c8dac0", opacity: 0.5, display: "flex" }} />
        <div style={{ position: "absolute", top: 200, right: -40, width: 180, height: 180, borderRadius: "50%", background: "#8fabd4", opacity: 0.12, display: "flex" }} />

        {/* grid lines — horizontal */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ width: "100%", height: "1px", background: "#a8c4a0", opacity: 0.35, display: "flex" }} />
          ))}
        </div>

        {/* grid lines — vertical */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ width: "1px", height: "100%", background: "#a8c4a0", opacity: 0.35, display: "flex" }} />
          ))}
        </div>

        {/* top: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, zIndex: 1 }}>
          <div style={{backgroundColor: '#EFECE3', border: '1px solid #203C67', borderRadius: '50%', overflow: 'hidden'
          }}>
            <img
            src={logoSrc}
            width={80}
            height={80}
          />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 400, color: "#203C67", lineHeight: "1", fontFamily: "DMSerifDisplay" }}>
              CareSync
            </span>
            <span style={{ fontSize: 15, color: "#4a6b4a", letterSpacing: "0.14em", fontFamily: "IBMPlexMono" }}>
              HEALTH MANAGEMENT
            </span>
          </div>
        </div>

        {/* middle: tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, zIndex: 1 }}>
          <span style={{ fontSize: 108, fontWeight: 400, color: "#203C67", lineHeight: "1.05", letterSpacing: "-3px", fontFamily: "DMSerifDisplay" }}>
            Your health,
          </span>
          <span style={{ fontSize: 108, fontWeight: 400, color: "#4a7a3a", lineHeight: "1.05", letterSpacing: "-3px", fontFamily: "DMSerifDisplay" }}>
            in sync.
          </span>
          <span style={{ fontSize: 26, color: "#203C67", opacity: 0.45, marginTop: 24, fontFamily: "IBMPlexMono" }}>
            Book your appointment — unbothered and quick.
          </span>
        </div>

        {/* bottom: footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <span style={{ fontSize: 20, color: "#203C67", opacity: 0.3, fontFamily: "IBMPlexMono" }}>
            caresync.vercel.app
          </span>
          <span style={{ fontSize: 18, color: "#203C67", opacity: 0.3, fontFamily: "IBMPlexMono" }}>
            a project by Shubh
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "DMSerifDisplay", data: dmSerif, weight: 400, style: "normal" },
        { name: "IBMPlexMono", data: ibmPlex, weight: 400, style: "normal" },
      ],
    }
  );
}