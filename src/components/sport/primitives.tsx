"use client";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

/** Pastille LIVE avec pulsation légère. */
export function LiveIndicator({ className, label }: { className?: string; label?: string }) {
  const t = useT();
  label = label ?? t("status.live");
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest", className)}>
      <span className="relative flex size-2.5" aria-hidden><span className="absolute inset-0 rounded-full bg-danger animate-live" /><span className="relative size-2.5 rounded-full bg-danger" /></span>
      {label}
    </span>
  );
}

/** Score avec animation à chaque changement (respecte prefers-reduced-motion via CSS globale). */
export function ScoreNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("num inline-block overflow-hidden align-bottom", className)} aria-label={`Score ${value}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="inline-block" initial={{ y: "70%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-70%", opacity: 0 }} transition={{ duration: 0.25 }}>{value}</motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Photo d'équipe ou monogramme (palette restreinte). */
export function TeamAvatar({ name, photoUrl, size = 40, className }: { name: string; photoUrl?: string | null; size?: number; className?: string }) {
  const tones = ["bg-blue text-white", "bg-ink text-lime", "bg-lime text-ink", "bg-blue-deep text-white"];
  const tone = tones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" width={size} height={size} className={cn("rounded-full object-cover shrink-0", className)} style={{ width: size, height: size }} />;
  }
  return <span aria-hidden className={cn("grid place-items-center rounded-full display shrink-0", tone, className)} style={{ width: size, height: size, fontSize: size * 0.5 }}>{initials(name)}</span>;
}
