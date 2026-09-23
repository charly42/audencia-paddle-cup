"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildBracket, winnerOf } from "@/lib/tournament/bracket";
import { formatTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Skeleton";
import { LiveIndicator, ScoreNumber } from "./primitives";
import type { Match, TournamentSlug } from "@/lib/types";
import { useTournamentMatches } from "./LiveProvider";
import { useT } from "@/lib/i18n/provider";
import { CheckCircle2 } from "lucide-react";

function BracketMatch({ m, qualifiers }: { m: Match; qualifiers: boolean }) {
  const t = useT();
  const w = winnerOf(m);
  const row = (tm: Match["teamA"], score: number, isWin: boolean, lost: boolean) => (
    <div className={cn("flex items-center gap-2 px-3 py-2", isWin && "bg-blue text-white", lost && "opacity-50")}>
      {tm ? <Link href={`/team/${tm.slug}`} className="flex-1 truncate text-sm font-extrabold hover:underline">{tm.name}</Link> : <span className="flex-1 text-sm font-bold text-slate italic">{t("common.tbd")}</span>}
      <ScoreNumber value={score} className="text-2xl" />
    </div>
  );
  return (
    <div className={cn("rounded-2xl bg-white border border-ink/15 overflow-hidden", m.status === "live" && "ring-2 ring-lime")}>
      {row(m.teamA, m.scoreA, !!w && w.id === m.teamA?.id, !!w && w.id !== m.teamA?.id)}
      <div className="border-t border-ink/10" />
      {row(m.teamB, m.scoreB, !!w && w.id === m.teamB?.id, !!w && w.id !== m.teamB?.id)}
      <div className="bg-mist px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] font-bold text-slate">
        <span>{formatTime(m.scheduledAt)}{m.courtName ? ` · ${m.courtName}` : ""}</span>
        {m.status === "live" ? <LiveIndicator label={t("status.live")} /> : <StatusBadge status={m.status} className="!py-0.5" />}
      </div>
      {qualifiers && w && <div className="bg-lime text-ink px-3 py-1.5 text-[11px] font-extrabold tracking-wider flex items-center gap-1.5"><CheckCircle2 size={13} aria-hidden />{t("bracket.qualified")} · {w.name}</div>}
    </div>
  );
}

/**
 * Bracket responsive — Desktop : colonnes horizontales par round. Mobile : onglets de rounds (jamais un mini-bracket illisible).
 */
export function BracketView({ matches, qualifiers = false }: { matches: Match[]; qualifiers?: boolean }) {
  const t = useT();
  const rounds = useMemo(() => buildBracket(matches), [matches]);
  const live = rounds.find((r) => r.matches.some((m) => m.status === "live"));
  const [active, setActive] = useState<string | null>(null);
  if (!rounds.length) return <EmptyState title={t("bracket.soon")} body={t("bracket.soonBody")} />;
  const current = active ?? live?.round ?? rounds.find((r) => r.matches.some((m) => m.status !== "final"))?.round ?? rounds[rounds.length - 1].round;
  return (
    <div>
      <div role="tablist" aria-label={t("bracket.rounds")} className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 snap-x">
        {rounds.map((r) => (
          <button key={r.round} role="tab" aria-selected={current === r.round} onClick={() => setActive(r.round)}
            className={cn("snap-start shrink-0 rounded-full px-4 py-2.5 text-sm font-extrabold tracking-wider border-2 min-h-11", current === r.round ? "bg-blue border-blue text-white" : "border-ink/20 bg-white")}>
            {t(`roundShort.${r.round}`)}{r.matches.some((m) => m.status === "live") && <span className="ml-1.5 inline-block size-2 rounded-full bg-danger animate-live align-middle" />}
          </button>
        ))}
      </div>
      <div className="md:flex md:gap-6 md:overflow-x-auto md:pb-4">
        {rounds.map((r) => (
          <section key={r.round} role="tabpanel" aria-label={t(`round.${r.round}`)} className={cn("md:min-w-72 md:flex-1 md:block", current === r.round ? "block" : "hidden")}>
            <h3 className="hidden md:flex display-md text-xl mb-3 items-center gap-2 text-blue">{t(`round.${r.round}`)}<span className="text-xs font-extrabold text-slate">{r.matches.length}</span></h3>
            <div className="space-y-3 md:flex md:flex-col md:justify-around md:h-[calc(100%-2.5rem)] md:gap-3">
              {r.matches.map((m) => <BracketMatch key={m.id} m={m} qualifiers={qualifiers} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Bracket branché sur le temps réel. */
export function LiveBracket({ tournament, promotionId, qualifiers, kind }: { tournament: TournamentSlug; promotionId?: string; qualifiers?: boolean; kind?: "student" | "staff" }) {
  const all = useTournamentMatches(tournament);
  const matches = all.filter((m) => m.gameNo == null || tournament !== "staff-vs-students")
    .filter((m) => !promotionId || m.promotionId === promotionId)
    .filter((m) => !kind || m.teamA?.kind === kind || m.teamB?.kind === kind);
  return <BracketView matches={matches} qualifiers={qualifiers} />;
}
