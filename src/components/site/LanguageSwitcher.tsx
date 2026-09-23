"use client";
import { useTransition } from "react";
import { setLocaleAction } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

/** Sélecteur FR / EN. Le choix est mémorisé dans un cookie et s'applique à tout le site. */
export function LanguageSwitcher({ locale, label, dark = false }: { locale: Locale; label: string; dark?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-full p-0.5", dark ? "bg-white/15" : "bg-ink/10")}>
      {(["fr", "en"] as Locale[]).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={locale === l} disabled={pending}
          onClick={() => locale !== l && start(() => setLocaleAction(l))}
          className={cn("px-2.5 py-1.5 text-xs font-extrabold tracking-wider rounded-full min-h-9",
            locale === l ? (dark ? "bg-lime text-ink" : "bg-ink text-white") : dark ? "text-white/80" : "text-ink/70")}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
