/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs"; // must be nodejs to read local files
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const [dmSerif, ibmPlex] = await Promise.all([
    readFile(join(process.cwd(), "public/assets/fonts/DMSerifDisplay-Regular.ttf")),
    readFile(join(process.cwd(), "public/assets/fonts/IBMPlexMono-Regular.ttf")),
  ]);

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
          <img
            src="https://caresync.vercel.app/logo-EFECE3.jpg"
            width={72}
            height={72}
            style={{ borderRadius: "50%", border: "1.5px solid #c8dac0" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 400, color: "#203C67", lineHeight: "1", fontFamily: "DMSerifDisplay" }}>
              CareSync
            </span>
            <span style={{ fontSize: 15, color: "#4a6b4a", letterSpacing: "0.12em", fontFamily: "IBMPlexMono" }}>
              HEALTH MANAGEMENT
            </span>
          </div>
        </div>

        {/* middle: tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 100, fontWeight: 400, color: "#203C67", lineHeight: "1.05", letterSpacing: "-3px", fontFamily: "DMSerifDisplay" }}>
            Your health,
          </span>
          <span style={{ fontSize: 100, fontWeight: 400, color: "#4a7a3a", lineHeight: "1.05", letterSpacing: "-3px", fontFamily: "DMSerifDisplay" }}>
            in sync.
          </span>
          <span style={{ fontSize: 28, color: "#203C67", opacity: 0.45, marginTop: 16, fontFamily: "IBMPlexMono" }}>
            Book your appointment — unbothered and quick.
          </span>
        </div>

        {/* bottom: footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, color: "#203C67", opacity: 0.3, fontFamily: "IBMPlexMono" }}>
            caresync.vercel.app
          </span>
          <span style={{ fontSize: 20, color: "#203C67", opacity: 0.3, fontFamily: "IBMPlexMono" }}>
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