import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    (<div style={{ width: "100%", height: "100%", background: BRAND.blue, color: BRAND.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, borderRadius: 14 }}>A</div>),
    size,
  );
}
