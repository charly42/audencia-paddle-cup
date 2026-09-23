"use client";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { JourneyStep } from "@/lib/journey";

/** ROAD TO THE CUP — parcours personnel d'une équipe (historique toujours visible). */
export function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  const t = useT();
  return (
    <ol className="space-y-0" aria-label={t("journey.aria")}>
      {steps.map((s, i) => (
        <li key={s.key} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className={cn("grid place-items-center size-9 rounded-full text-sm font-extrabold shrink-0", s.state === "done" && "bg-blue text-white", s.state === "current" && "bg-lime text-ink ring-4 ring-blue", s.state === "todo" && "bg-mist text-slate")}>
              {s.state === "done" ? <Check size={18} aria-hidden /> : s.state === "current" ? "▶" : "—"}
            </span>
            {i < steps.length - 1 && <span aria-hidden className={cn("w-0.5 flex-1 min-h-6", s.state === "done" ? "bg-blue" : "bg-ink/15")} />}
          </div>
          <div className="pb-5">
            <p className={cn("display-md text-2xl", s.state === "todo" && "text-slate/70")}>{t(`journey.${s.key}`)}</p>
            <p className="text-[11px] font-extrabold tracking-widest text-slate">{s.state === "done" ? t("journey.done") : s.state === "current" ? t("journey.next") : "—"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
