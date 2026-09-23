"use client";
import { useTransition } from "react";
import { setEventModeAction } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { EventMode } from "@/lib/types";

/** Bascule PRE-EVENT / LIVE / POST-EVENT — pilote la homepage publique. */
export function ModeSwitch({ mode }: { mode: EventMode }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t("a.eventModeAria")} className="inline-grid grid-cols-3 gap-1 rounded-2xl bg-ink p-1">
      {(["pre_event", "live", "post_event"] as EventMode[]).map((m) => (
        <button key={m} role="radio" aria-checked={mode === m} disabled={pending} onClick={() => start(async () => {
          const r = await setEventModeAction(m); toast(r.ok ? t("a.modeOn", { mode: t(`mode.${m}`) }) : r.error ?? t("error.generic"), r.ok ? "ok" : "error");
        })} className={cn("rounded-xl px-4 py-3 text-xs md:text-sm font-extrabold tracking-wider min-h-11", mode === m ? (m === "live" ? "bg-danger text-white" : "bg-lime text-ink") : "text-white/70 hover:bg-white/10")}>{t(`mode.${m}`)}</button>
      ))}
    </div>
  );
}
