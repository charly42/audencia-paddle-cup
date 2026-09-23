import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

/** Icônes PWA générées dynamiquement (192 / 512) — remplaçables par des PNG officiels dans /public/icons. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Math.min(Math.max(parseInt((await params).size, 10) || 192, 48), 1024);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: BRAND.blue, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ fontSize: n * 0.42, fontWeight: 900, color: BRAND.accent, lineHeight: 1 }}>APC</div>
        <div style={{ fontSize: n * 0.09, fontWeight: 800, letterSpacing: n * 0.01, marginTop: n * 0.04 }}>PADEL CUP</div>
      </div>
    ),
    { width: n, height: n },
  );
}
