"use client";
import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

/** Confettis discrets (une seule fois) — désactivés si prefers-reduced-motion. */
export function Confetti({ active = true }: { active?: boolean }) {
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = [BRAND.accent, BRAND.blue, "#FFFFFF"];
      confetti({ particleCount: 70, spread: 70, origin: { x: 0.2, y: 0.7 }, colors, disableForReducedMotion: true });
      confetti({ particleCount: 70, spread: 70, origin: { x: 0.8, y: 0.7 }, colors, disableForReducedMotion: true });
    });
    return () => { cancelled = true; };
  }, [active]);
  return null;
}
