import { renderCard } from "@/lib/cards/render";
import { siteUrl } from "@/lib/env";

/** Carte Open Graph générique du site (1200×630). */
export async function GET() {
  return renderCard({ format: "og", headline: "STAFF VS STUDENTS", sub: "PADEL CUP · 4PADEL SAINT-OUEN", url: siteUrl });
}
