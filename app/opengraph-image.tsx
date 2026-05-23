import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #e8f0e4 0%, #d8e8d0 40%, #c8dac0 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* subtle grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(#b8ceae44 1px, transparent 1px), linear-gradient(90deg, #b8ceae44 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />

        {/* top-left circle blur */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "#c8dac066",
            display: "flex",
          }}
        />

        {/* logo + wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 56,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: "#efece3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #c8dac0",
            }}
          >
            {/* stethoscope SVG drawn inline */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M30 20 C30 20 24 20 24 30 L24 52 C24 64 34 72 46 72 C58 72 68 64 68 52 L68 44"
                stroke="#203C67"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="68" cy="38" r="8" stroke="#203C67" strokeWidth="5" fill="none" />
              <circle cx="68" cy="38" r="3" fill="#203C67" />
              <line x1="30" y1="20" x2="38" y2="20" stroke="#203C67" strokeWidth="5" strokeLinecap="round" />
              <line x1="38" y1="14" x2="38" y2="26" stroke="#203C67" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#203C67",
                fontFamily: "serif",
                letterSpacing: "-1px",
                lineHeight: 1,
                display: "flex",
              }}
            >
              CareSync
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#4a6b4a",
                letterSpacing: "0.12em",
                display: "flex",
              }}
            >
              HEALTH MANAGEMENT
            </span>
          </div>
        </div>

        {/* tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            zIndex: 1,
            marginBottom: 48,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#203C67",
              fontFamily: "serif",
              letterSpacing: "-3px",
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            Your health,
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#4a7a3a",
              fontFamily: "serif",
              letterSpacing: "-3px",
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            in sync.
          </span>
        </div>

        {/* sub copy */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#203C67",
            opacity: 0.5,
            letterSpacing: "-0.3px",
            zIndex: 1,
          }}
        >
          Book your appointment — unbothered and quick.
        </div>

        {/* bottom: url + credit */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 20, color: "#203C67", opacity: 0.3, display: "flex" }}>
            caresync.vercel.app
          </span>
          <span style={{ fontSize: 18, color: "#203C67", opacity: 0.3, display: "flex" }}>
            a project by Shubh
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}