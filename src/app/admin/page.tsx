import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { canAccess } from "@/lib/permissions";
import { ModeSwitch } from "@/components/admin/ModeSwitch";
import { StatCard } from "@/components/sport/Cards";
import { tournamentProviderName } from "@/lib/env";
import { i18n } from "@/lib/i18n";

export default async function AdminDashboard() {
  const profile = await requireAdmin("dashboard");
  const [stats, settings, { t }] = await Promise.all([repo.adminStats(), repo.getSettings(), i18n()]);
  const can = (a: Parameters<typeof canAccess>[1]) => canAccess(profile.role, a);
  const exports = ["teams", "players", "tickets", "practice", "matches"];
  return (
    <div className="space-y-8 max-w-6xl">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.command")}</p><h1 className="display text-6xl md:text-8xl">{t("a.dashboard")}</h1></header>

      {can("live") && (
        <section className="rounded-3xl bg-white border border-ink/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-extrabold tracking-widest text-slate">{t("a.eventMode")}</p><p className="display-md text-3xl">{t(`mode.${settings.eventMode}`)}</p></div>
          <ModeSwitch mode={settings.eventMode} />
        </section>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label={t("a.st.teams")} value={stats.totalTeams} tone="blue" /><StatCard label={t("a.st.qualified")} value={stats.qualifiedTeams} tone="lime" />
        <StatCard label={t("a.st.players")} value={stats.players} /><StatCard label={t("a.st.tickets")} value={stats.tickets} />
        <StatCard label={t("a.st.checked")} value={stats.checkedIn} tone="ink" /><StatCard label={t("a.st.practice")} value={stats.practiceBookings} />
        <StatCard label={t("a.st.upcoming")} value={stats.upcomingMatches} /><StatCard label={t("a.st.live")} value={stats.liveMatches} tone={stats.liveMatches ? "lime" : "light"} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[["/admin/scores", t("a.scores"), t("a.q.scores"), "scores"], ["/admin/live", t("a.live"), t("a.q.live"), "live"], ["/admin/check-in", t("a.checkin"), t("a.q.checkin"), "check-in"],
          ["/admin/matches", t("a.matches"), t("a.q.matches"), "matches"], ["/admin/teams", t("a.teams"), t("a.q.teams"), "teams"], ["/admin/content", t("a.content"), t("a.q.content"), "content"]]
          .filter(([, , , a]) => can(a as never)).map(([href, t, d]) => <Link key={href} href={href} className="rounded-3xl bg-white border border-ink/10 p-5 hover:border-blue min-h-24"><p className="display-md text-3xl">{t}</p><p className="text-sm text-slate font-semibold">{d}</p></Link>)}
      </section>

      {can("exports") && (
        <section className="rounded-3xl bg-white border border-ink/10 p-5"><h2 className="display-md text-3xl mb-3">{t("a.exports")}</h2>
          <div className="flex flex-wrap gap-2">{exports.map((k) => <a key={k} href={`/admin/exports/${k}`} className="rounded-full bg-ink text-white font-extrabold px-5 py-3 text-sm min-h-11 inline-flex items-center">{k.toUpperCase()}.CSV</a>)}</div></section>
      )}
      <p className="text-xs text-slate font-semibold">{t("a.provider", { p: tournamentProviderName, d: repo.kind })}</p>
    </div>
  );
}
