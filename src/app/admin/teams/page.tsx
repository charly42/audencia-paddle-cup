import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { TeamStatusBadge } from "@/components/ui/Badge";
import { i18n } from "@/lib/i18n";

export default async function AdminTeamsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("teams");
  const { q } = await searchParams;
  const [teams, { t }] = await Promise.all([repo.listTeams({ q }), i18n()]);
  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.manage")}</p><h1 className="display text-6xl md:text-8xl">{t("a.teams")}</h1></div>
        <form role="search"><input name="q" defaultValue={q} placeholder={t("a.search")} aria-label={t("a.searchTeams")} className="rounded-xl border-2 border-ink/15 bg-white px-4 py-2.5 font-bold min-h-11" /></form></header>
      <div className="rounded-3xl bg-white border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[40rem]"><thead className="text-left text-xs font-extrabold tracking-widest text-slate"><tr><th className="p-4">{t("a.col.team")}</th><th>{t("a.col.type")}</th><th>{t("a.col.promo")}</th><th>{t("a.col.status")}</th><th>{t("a.col.teamId")}</th></tr></thead>
          <tbody className="divide-y divide-ink/10">{teams.map((tm) => (
            <tr key={tm.id} className="hover:bg-paper"><td className="p-4"><Link href={`/admin/teams/${tm.id}`} className="font-extrabold text-blue hover:underline">{tm.name}</Link><p className="text-xs text-slate">{tm.players.map((p) => `${p.firstName} ${p.lastName}`).join(" · ")}</p></td>
              <td className="font-bold">{tm.kind === "staff" ? t("teams.staff") : t("teams.students")}</td><td>{tm.promotionName ?? "—"}</td><td><TeamStatusBadge status={tm.status} /></td><td className="font-mono font-bold">{tm.teamCode}</td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
