import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Audencia Padel Cup", short_name: "Padel Cup", description: "STAFF vs STUDENTS — Qualify. Represent. Play. Challenge.",
    start_url: "/", display: "standalone", background_color: BRAND.blue, theme_color: BRAND.blue, orientation: "portrait",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
