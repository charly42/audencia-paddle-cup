import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BRAND } from "../brand";

export type CardFormat = "post" | "story" | "og";
export const SIZES: Record<CardFormat, { width: number; height: number }> = { post: { width: 1080, height: 1350 }, story: { width: 1080, height: 1920 }, og: { width: 1200, height: 630 } };

export interface CardData {
  format: CardFormat; headline: string; sub?: string; teamName?: string; promo?: string | null; players?: string[]; photoUrl?: string | null; extra?: string | null; url: string;
}

/** Police display optionnelle : déposez BigShoulders-Black.ttf dans /public/fonts pour l'activer (sinon police par défaut). */
async function loadFont() {
  try { return await readFile(path.join(process.cwd(), "public/fonts/BigShoulders-Black.ttf")); } catch { return null; }
}
const usablePhoto = (u?: string | null) => !!u && (/^https:\/\//.test(u) || /^data:image\/(png|jpe?g|webp);base64,/.test(u));

function Card({ d, withPhoto }: { d: CardData; withPhoto: boolean }) {
  const { width, height } = SIZES[d.format];
  const u = Math.min(width, height * (d.format === "og" ? 1.9 : 0.8)) / 1080; // échelle typographique
  const wide = d.format === "og";
  const font = "BigShoulders, Impact, 'Arial Narrow', sans-serif";
  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: BRAND.blue, color: "#fff", position: "relative", padding: 64 * u, fontFamily: font, textTransform: "uppercase" }}>
      {withPhoto && d.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.photoUrl} alt="" width={width} height={height} style={{ position: "absolute", inset: 0, width, height, objectFit: "cover", opacity: 0.32 }} />
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: `linear-gradient(180deg, ${BRAND.blueDeep}8C 0%, ${BRAND.blue}33 45%, ${BRAND.blueDeep}EB 100%)` }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34 * u, letterSpacing: 6 * u, color: BRAND.accent, fontWeight: 900 }}>AUDENCIA PADEL CUP</div>
          {!wide && <div style={{ display: "flex", background: BRAND.accent, color: BRAND.ink, padding: `${10 * u}px ${22 * u}px`, borderRadius: 999, fontSize: 30 * u, fontWeight: 900 }}>STAFF VS STUDENTS</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {d.sub && <div style={{ display: "flex", fontSize: 40 * u, letterSpacing: 5 * u, color: BRAND.accent, fontWeight: 900, marginBottom: 12 * u }}>{d.sub}</div>}
          <div style={{ display: "flex", fontSize: (wide ? 210 : d.headline.length > 10 ? 190 : 250) * u, lineHeight: 0.86, fontWeight: 900 }}>{d.headline}</div>
          {d.teamName && <div style={{ display: "flex", fontSize: (wide ? 84 : 92) * u, fontWeight: 900, marginTop: 28 * u, lineHeight: 0.95 }}>{d.teamName}</div>}
          {d.promo && <div style={{ display: "flex", fontSize: 44 * u, color: BRAND.accent, fontWeight: 800, marginTop: 8 * u }}>{d.promo}</div>}
          {d.players && d.players.length > 0 && !wide && <div style={{ display: "flex", fontSize: 38 * u, marginTop: 20 * u, opacity: 0.9, fontWeight: 800 }}>{d.players.join("  ·  ")}</div>}
          {d.extra && <div style={{ display: "flex", fontSize: 40 * u, marginTop: 20 * u, fontWeight: 800 }}>{d.extra}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30 * u, letterSpacing: 4 * u, fontWeight: 900 }}>QUALIFY. REPRESENT. PLAY. CHALLENGE.</div>
          {!wide && <div style={{ display: "flex", fontSize: 26 * u, opacity: 0.8, fontWeight: 800 }}>{d.url.replace(/^https?:\/\//, "")}</div>}
        </div>
      </div>
    </div>
  );
}

export async function renderCard(d: CardData, opts: { download?: boolean; filename?: string } = {}) {
  const size = SIZES[d.format];
  const fontData = await loadFont();
  const fonts = fontData ? [{ name: "BigShoulders", data: fontData, weight: 900 as const, style: "normal" as const }] : undefined;
  const headers: Record<string, string> = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };
  if (opts.download) headers["Content-Disposition"] = `attachment; filename="${opts.filename ?? "audencia-padel-cup"}-${d.format}.png"`;
  try {
    return new ImageResponse(<Card d={d} withPhoto={usablePhoto(d.photoUrl)} />, { ...size, fonts, headers });
  } catch {
    // Photo illisible → on regénère sans photo plutôt que de casser le partage
    return new ImageResponse(<Card d={d} withPhoto={false} />, { ...size, fonts, headers });
  }
}
