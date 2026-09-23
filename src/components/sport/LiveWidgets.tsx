"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/Skeleton";
import { CourtCard, MatchCard, Scoreboard, useRoundText } from "./MatchCards";
import { useT } from "@/lib/i18n/provider";
import { LiveIndicator } from "./primitives";
import { useLive } from "./LiveProvider";
import { Confetti } from "./Confetti";
import { formatTime } from "@/lib/format";
import type { Court, Match, TeamStatus } from "@/lib/types";

const PENDING: Match["status"][] = ["upcoming", "check_in", "warm_up"];
const byTime = (a: Match, b: Match) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9");

/** LIVE NOW — matchs en cours (un scoreboard par terrain) */
export function LiveNow({ compact = false }: { compact?: boolean }) {
  const { matches, connected } = useLive();
  const t = useT();
  const live = matches.filter((m) => m.status === "live").sort((a, b) => (a.courtName ?? "").localeCompare(b.courtName ?? ""));
  return (
    <section aria-label={t("live.now")}>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="display text-5xl md:text-7xl">{t("live.now")}</h2>
        <LiveIndicator className="text-danger" label={connected ? t("live.realtime") : t("status.live")} />
      </div>
      {live.length ? <div className={cn("grid gap-4", compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>{live.map((m) => <Scoreboard key={m.id} match={m} compact={compact} />)}</div>
        : <EmptyState title={t("live.noMatch")} body={t("live.noMatchBody")} />}
    </section>
  );
}

export function NextMatches({ limit = 4, title }: { limit?: number; title?: string }) {
  const { matches } = useLive();
  const t = useT();
  title = title ?? t("live.next");
  const next = matches.filter((m) => PENDING.includes(m.status)).sort(byTime).slice(0, limit);
  return (
    <section aria-label={title}>
      <h2 className="display text-4xl md:text-6xl mb-4">{title}</h2>
      {next.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{next.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        : <EmptyState title={t("live.noNext")} body={t("live.noNextBody")} />}
    </section>
  );
}

export function LatestResults({ limit = 4, title }: { limit?: number; title?: string }) {
  const { matches } = useLive();
  const t = useT();
  title = title ?? t("live.results");
  const done = matches.filter((m) => m.status === "final").sort((a, b) => (b.endedAt ?? b.updatedAt).localeCompare(a.endedAt ?? a.updatedAt)).slice(0, limit);
  return (
    <section aria-label={title}>
      <h2 className="display text-4xl md:text-6xl mb-4">{title}</h2>
      {done.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{done.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        : <EmptyState title={t("live.noResult")} body={t("live.noResultBody")} />}
    </section>
  );
}

/** COURTS VIEW — un terrain = un match en cours + le suivant */
export function CourtsView({ courts }: { courts: Court[] }) {
  const { matches } = useLive();
  const view = useMemo(() => {
    const used = new Set(matches.map((m) => m.courtId).filter(Boolean));
    const list = courts.filter((c) => c.active && (used.size === 0 || used.has(c.id)));
    return list.map((c) => {
      const onCourt = matches.filter((m) => m.courtId === c.id);
      return { court: c, current: onCourt.find((m) => m.status === "live") ?? null, next: onCourt.filter((m) => PENDING.includes(m.status)).sort(byTime)[0] ?? null };
    });
  }, [courts, matches]);
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{view.map((v) => <CourtCard key={v.court.id} courtName={v.court.name} current={v.current} next={v.next} />)}</div>;
}

/** Bandeau dynamique d'une Team Page : LIVE NOW / NEXT MATCH / THANK YOU / QUALIFIED / CHAMPIONS. */
export function TeamLiveStrip({ teamId, status }: { teamId: string; status: TeamStatus }) {
  const { matches } = useLive();
  const t = useT();
  const roundText = useRoundText();
  const mine = matches.filter((m) => m.teamA?.id === teamId || m.teamB?.id === teamId);
  const live = mine.find((m) => m.status === "live");
  const next = mine.filter((m) => PENDING.includes(m.status)).sort(byTime)[0];
  if (live) return <div className="mb-6"><div className="flex items-center gap-2 mb-3"><LiveIndicator className="text-danger" label={t("status.live")} /><span className="display-md text-3xl">{t("live.now")}</span></div><Scoreboard match={live} /></div>;
  if (status === "champion") return <div className="mb-6 rounded-3xl bg-lime text-ink p-6 text-center"><Confetti /><p className="display text-6xl md:text-8xl">{t("journey.champion")}</p></div>;
  if (status === "eliminated") return <div className="mb-6 rounded-3xl bg-ink text-white p-6 text-center"><p className="display text-4xl md:text-6xl">{t("team.thanks")}</p></div>;
  if (next) return (
    <div className="mb-6 rounded-3xl bg-blue text-white on-dark p-6">
      <p className="text-xs font-extrabold tracking-widest text-lime">{t("team.nextMatch")} · {roundText(next)}</p>
      <p className="display text-4xl md:text-6xl mt-2">{next.teamA?.name ?? t("live.tbd")} <span className="text-lime">VS</span> {next.teamB?.name ?? t("live.tbd")}</p>
      <p className="mt-2 font-bold"><span className="num text-3xl mr-3">{formatTime(next.scheduledAt)}</span>{next.courtName}</p>
    </div>
  );
  if (["qualified", "semi_finalist", "finalist"].includes(status)) return <div className="mb-6 rounded-3xl bg-lime text-ink p-5 text-center"><p className="display text-4xl md:text-5xl">{t("team.qualifiedNext")}</p></div>;
  return null;
}

/** Filtres simples pour la liste de matchs : round / court / équipe / statut. */
export function MatchFilters({ matches, courts }: { matches: Match[]; courts: Court[] }) {
  const t = useT();
  const [round, setRound] = useState(""), [court, setCourt] = useState(""), [team, setTeam] = useState(""), [status, setStatus] = useState("");
  const teams = useMemo(() => [...new Map(matches.flatMap((m) => [m.teamA, m.teamB]).filter(Boolean).map((t) => [t!.id, t!])).values()].sort((a, b) => a.name.localeCompare(b.name)), [matches]);
  const rounds = [...new Set(matches.map((m) => m.round))];
  const list = matches.filter((m) => (!round || m.round === round) && (!court || m.courtId === court) && (!team || m.teamA?.id === team || m.teamB?.id === team) && (!status || m.status === status));
  const sel = "rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5 text-sm font-bold min-h-11";
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5" role="search" aria-label={t("filter.aria")}>
        <select aria-label={t("filter.round")} className={sel} value={round} onChange={(e) => setRound(e.target.value)}><option value="">{t("filter.allRounds")}</option>{rounds.map((r) => <option key={r} value={r}>{t(`round.${r}`)}</option>)}</select>
        <select aria-label={t("filter.court")} className={sel} value={court} onChange={(e) => setCourt(e.target.value)}><option value="">{t("filter.allCourts")}</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label={t("filter.team")} className={sel} value={team} onChange={(e) => setTeam(e.target.value)}><option value="">{t("filter.allTeams")}</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select aria-label={t("filter.status")} className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t("filter.allStatus")}</option>{["upcoming", "check_in", "warm_up", "live", "final", "postponed"].map((s) => <option key={s} value={s}>{t(`mstatus.${s}`)}</option>)}</select>
      </div>
      {list.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((m) => <MatchCard key={m.id} match={m} />)}</div> : <EmptyState title={t("filter.none")} body={t("filter.noneBody")} />}
    </div>
  );
}
