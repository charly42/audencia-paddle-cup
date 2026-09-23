"use client";
import { useLive } from "@/components/sport/LiveProvider";
import { MatchControlRow } from "./MatchControls";
import { ModeSwitch } from "./ModeSwitch";
import { LiveGlobalScore } from "@/components/sport/GlobalScore";
import { LiveIndicator } from "@/components/sport/primitives";
import { EmptyState } from "@/components/ui/Skeleton";
import type { Court } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

/** COMMAND CENTER — vue d'ensemble temps réel + actions rapides. */
export function LiveControl({ courts }: { courts: Court[] }) {
  const { matches, mode, connected } = useLive();
  const t = useT();
  const time = (m: { scheduledAt: string | null }) => m.scheduledAt ?? "9";
  const live = matches.filter((m) => m.status === "live").sort((a, b) => (a.courtName ?? "").localeCompare(b.courtName ?? ""));
  const coming = matches.filter((m) => ["upcoming", "check_in", "warm_up", "postponed"].includes(m.status)).sort((a, b) => time(a).localeCompare(time(b)));
  const recent = matches.filter((m) => m.status === "final").sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? "")).slice(0, 4);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ModeSwitch mode={mode} />
        <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate">{connected ? <><LiveIndicator label={t("a.rtConnected")} className="text-ok" /></> : t("a.polling")}</span>
      </div>
      <LiveGlobalScore showGames={false} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section><h2 className="display text-4xl mb-3">{t("a.onCourt", { n: live.length })}</h2><div className="space-y-3">{live.length ? live.map((m) => <MatchControlRow key={m.id} match={m} courts={courts} />) : <EmptyState title={t("a.noLive")} />}</div></section>
        <section><h2 className="display text-4xl mb-3">{t("a.comingUp", { n: coming.length })}</h2><div className="space-y-3">{coming.length ? coming.map((m) => <MatchControlRow key={m.id} match={m} courts={courts} />) : <EmptyState title={t("a.nothing")} />}</div></section>
      </div>
      <section><h2 className="display text-4xl mb-3">{t("live.results")}</h2><div className="grid gap-3 md:grid-cols-2">{recent.map((m) => <MatchControlRow key={m.id} match={m} courts={courts} />)}</div></section>
    </div>
  );
}
