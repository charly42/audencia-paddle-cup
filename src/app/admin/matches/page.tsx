import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { tournament } from "@/lib/tournament";
import { MatchCreator, ScheduleCell } from "@/components/admin/MatchCreator";
import { StatusBadge } from "@/components/ui/Badge";
import { roundText } from "@/lib/format";
import { i18n } from "@/lib/i18n";

export default async function AdminMatchesPage() {
  await requireAdmin("matches");
  const [matches, teams, courts, promotions, { t }] = await Promise.all([repo.listMatches(), repo.listTeams(), repo.listCourts(), repo.listPromotions(), i18n()]);
  return (
    <div className="max-w-7xl space-y-8">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.plan")}</p><h1 className="display text-6xl md:text-8xl">{t("a.matches")}</h1></header>
      <MatchCreator teams={teams} courts={courts} promotions={promotions} challonge={tournament.name === "challonge"} />
      <div className="rounded-3xl bg-white border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[52rem]"><thead className="text-left text-xs font-extrabold tracking-widest text-slate"><tr><th className="p-4">{t("a.col.tourRound")}</th><th>{t("a.col.match")}</th><th>{t("a.col.score")}</th><th>{t("a.col.court")}</th><th>{t("a.col.schedule")}</th><th>{t("a.col.status")}</th></tr></thead>
          <tbody className="divide-y divide-ink/10">{matches.map((m) => (
            <tr key={m.id}><td className="p-4 font-bold"><span className="text-xs text-slate block">{m.tournament}</span>{roundText(m, t)}</td>
              <td className="font-extrabold">{m.teamA?.name ?? t("common.tbd")} <span className="text-slate font-bold">vs</span> {m.teamB?.name ?? t("common.tbd")}</td>
              <td className="num text-2xl">{m.scoreA}–{m.scoreB}</td><td className="font-bold">{m.courtName ?? t("a.tbc")}</td><td>{m.status === "final" ? "—" : <ScheduleCell match={m} />}</td><td><StatusBadge status={m.status} /></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
