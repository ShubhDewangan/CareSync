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
    readFile(join(process.cwd(), "public/logo.png")),
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
        }}
      >
        <span style={{ fontSize: 42, color: "#203C67", fontFamily: "DMSerifDisplay" }}>
          CareSync
        </span>
        <img src={logoSrc} width={72} height={72} style={{ borderRadius: "50%" }} />
        <span style={{ fontSize: 100, color: "#203C67", fontFamily: "DMSerifDisplay" }}>
          Your health, in sync.
        </span>
        <span style={{ fontSize: 22, color: "#203C67", opacity: 0.3, fontFamily: "IBMPlexMono" }}>
          caresync.vercel.app
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "IBMPlexMono", data: ibmPlex, weight: 400, style: "normal" },
        { name: "DMSerifDisplay", data: dmSerif, weight: 400, style: "normal" },
      ],
    }
  );
}