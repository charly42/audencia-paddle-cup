"use client";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { formatTime, roundText } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { Match, TeamLite } from "@/lib/types";
import { LiveIndicator, ScoreNumber, TeamAvatar } from "./primitives";

/** Libellé de tour traduit : « MANCHE 01 » / « LA MANCHE DÉCISIVE » pour le main event. */
export function useRoundText() {
  const t = useT();
  return (m: Match) => roundText(m, t);
}

function TeamLine({ team, score, win, dim, size = "md", tbd = "TBD" }: { team: TeamLite | null; score: number; win: boolean; dim: boolean; size?: "md" | "lg"; tbd?: string }) {
  return (
    <div className={cn("flex items-center gap-3", dim && "opacity-55")}>
      <TeamAvatar name={team?.name ?? tbd} size={size === "lg" ? 44 : 34} />
      {team ? <Link href={`/team/${team.slug}`} className={cn("flex-1 min-w-0 truncate hover:underline font-extrabold", size === "lg" ? "text-lg" : "text-base", win && "text-blue")}>{team.name}</Link>
            : <span className="flex-1 font-extrabold text-slate">{tbd}</span>}
      <ScoreNumber value={score} className={cn(size === "lg" ? "text-6xl" : "text-4xl", win && "text-blue")} />
    </div>
  );
}

/** Match Card — carte standard (liste, prochains matchs, résultats). */
export function MatchCard({ match: m, className }: { match: Match; className?: string }) {
  const t = useT();
  const roundText = useRoundText();
  const final = m.status === "final";
  const aWin = final && m.scoreA > m.scoreB, bWin = final && m.scoreB > m.scoreA;
  return (
    <article className={cn("rounded-3xl bg-white border border-ink/10 p-4 md:p-5", m.status === "live" && "ring-2 ring-lime border-transparent shadow-[0_0_0_4px_rgba(198,241,53,.25)]", className)}>
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-extrabold tracking-widest text-slate">{roundText(m)}</span>
        {m.status === "live" ? <span className="inline-flex items-center gap-2 bg-lime rounded-full px-2.5 py-1"><LiveIndicator /></span> : <StatusBadge status={m.status} />}
      </header>
      <div className="space-y-2.5">
        <TeamLine team={m.teamA} score={m.scoreA} win={aWin} dim={bWin} tbd={t("common.tbd")} />
        <TeamLine team={m.teamB} score={m.scoreB} win={bWin} dim={aWin} tbd={t("common.tbd")} />
      </div>
      <footer className="mt-3 pt-3 border-t border-ink/10 flex items-center gap-3 text-sm font-bold text-slate">
        <span className="num text-xl text-ink">{formatTime(m.scheduledAt)}</span>
        {m.courtName && <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{m.courtName}</span>}
        {m.paused && <span className="ml-auto text-danger">{t("live.paused")}</span>}
      </footer>
    </article>
  );
}

/** Scoreboard XXL — un match en cours sur un terrain (fond sombre, lisible de loin). */
export function Scoreboard({ match: m, compact = false }: { match: Match; compact?: boolean }) {
  const t = useT();
  const roundText = useRoundText();
  return (
    <article className="on-dark rounded-3xl bg-ink text-white p-5 md:p-7 relative overflow-hidden" aria-label={`${m.courtName ?? t("live.courtTbc")}: ${m.teamA?.name} ${m.scoreA} – ${m.scoreB} ${m.teamB?.name}`}>
      <header className="flex items-center justify-between mb-4">
        <h3 className="display-md text-2xl md:text-3xl text-lime">{m.courtName ?? t("live.courtTbc")}</h3>
        <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1"><LiveIndicator className="text-white" label={m.paused ? t("live.paused") : t("status.live")} /></span>
      </header>
      {[[m.teamA, m.scoreA, m.scoreA > m.scoreB], [m.teamB, m.scoreB, m.scoreB > m.scoreA]].map(([tm, s, lead], i) => (
        <div key={i} className={cn("flex items-center gap-4 py-2", i === 0 && "border-b border-white/15")}>
          <span className={cn("flex-1 min-w-0 display-md truncate", compact ? "text-2xl" : "text-3xl md:text-4xl")}>{(tm as TeamLite | null)?.name ?? t("common.tbd")}</span>
          <ScoreNumber value={s as number} className={cn(compact ? "text-6xl" : "text-7xl md:text-8xl", lead ? "text-lime" : "text-white")} />
        </div>
      ))}
      <p className="mt-3 text-xs font-extrabold tracking-widest text-white/60">{roundText(m)}</p>
    </article>
  );
}

/** Court Card — carte terrain : match en cours + prochain match. */
export function CourtCard({ courtName, current, next }: { courtName: string; current: Match | null; next: Match | null }) {
  const t = useT();
  const roundText = useRoundText();
  return (
    <article className="rounded-3xl bg-white border border-ink/10 overflow-hidden flex flex-col">
      <header className={cn("px-5 py-3 flex items-center justify-between", current ? "bg-blue text-white on-dark" : "bg-mist")}>
        <h3 className="display-md text-2xl">{courtName}</h3>
        {current ? <span className="inline-flex items-center gap-2 bg-lime text-ink rounded-full px-2.5 py-1"><LiveIndicator label={t("status.live")} /></span> : <span className="text-xs font-extrabold tracking-widest text-slate">{t("live.available")}</span>}
      </header>
      <div className="p-5 flex-1 space-y-4">
        <section aria-label={t("live.currentMatch")}>
          <p className="text-[11px] font-extrabold tracking-widest text-slate mb-2">{t("live.currentMatch")}</p>
          {current ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3"><span className="font-extrabold truncate">{current.teamA?.name ?? t("common.tbd")}</span><ScoreNumber value={current.scoreA} className="text-4xl text-blue" /></div>
              <div className="flex items-center justify-between gap-3"><span className="font-extrabold truncate">{current.teamB?.name ?? t("common.tbd")}</span><ScoreNumber value={current.scoreB} className="text-4xl text-blue" /></div>
              <p className="text-xs font-bold text-slate pt-1">{roundText(current)} · {formatTime(current.scheduledAt)}</p>
            </div>
          ) : <p className="text-slate text-sm font-semibold">{t("live.noMatchOnCourt")}</p>}
        </section>
        <section aria-label={t("live.nextMatch")} className="border-t border-ink/10 pt-3">
          <p className="text-[11px] font-extrabold tracking-widest text-slate mb-1">{t("live.nextMatch")}</p>
          {next ? <p className="font-bold text-sm"><span className="num text-xl mr-2">{formatTime(next.scheduledAt)}</span>{next.teamA?.name ?? t("common.tbd")} <span className="text-slate">vs</span> {next.teamB?.name ?? t("common.tbd")}</p>
                : <p className="text-slate text-sm font-semibold">{t("live.nothingScheduled")}</p>}
        </section>
      </div>
    </article>
  );
}
