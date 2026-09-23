import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { PracticeCreator } from "@/components/admin/ContentEditors";
import { hhmm, shortDay, weekday, formatDateFr } from "@/lib/format";
import { i18n } from "@/lib/i18n";

export default async function AdminPracticePage() {
  await requireAdmin("practice");
  const [sessions, regs, { t, locale }] = await Promise.all([repo.listPractice(), repo.listPracticeRegistrations(), i18n()]);
  return (
    <div className="max-w-6xl space-y-8">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.training")}</p><h1 className="display text-6xl md:text-8xl">{t("a.practice")}</h1></header>
      <PracticeCreator />
      <section><h2 className="display text-4xl mb-3">{t("a.sessions")}</h2>
        <div className="grid gap-3 md:grid-cols-2">{sessions.map((s) => <div key={s.id} className="rounded-3xl bg-white border border-ink/10 p-4"><p className="display-md text-2xl">{weekday(s.date, locale)} {shortDay(s.date, locale)} · {hhmm(s.startTime)}</p>
          <p className="text-sm font-semibold text-slate">{t("a.sessionLine", { teams: s.bookedTeams.length, left: s.spotsLeft, cap: s.capacity, wait: s.waitlistCount, coach: s.coach ? t("a.coachYes") : t("a.coachNo"), level: s.level === "all" ? t("levelAll") : t(`level.${s.level}`) })}</p></div>)}</div></section>
      <section><div className="flex items-center justify-between mb-3"><h2 className="display text-4xl">{t("a.registrations")}</h2><a href="/admin/exports/practice" className="font-extrabold text-sm underline underline-offset-4">{t("a.exportCsv")}</a></div>
        <div className="rounded-3xl bg-white border border-ink/10 overflow-x-auto"><table className="w-full text-sm min-w-[32rem]"><thead className="text-left text-xs font-extrabold tracking-widest text-slate"><tr><th className="p-4">{t("a.col.session")}</th><th>{t("a.col.team")}</th><th>{t("a.col.status")}</th><th>{t("a.col.booked")}</th></tr></thead>
          <tbody className="divide-y divide-ink/10">{regs.map((r) => <tr key={r.id}><td className="p-4 font-bold">{r.sessionLabel}</td><td className="font-extrabold">{r.teamName}</td><td className="font-bold">{r.status === "booked" ? t("pr.booked") : r.status === "waitlist" ? t("pr.onWaitlist") : t("mstatus.cancelled")}</td><td className="text-slate">{formatDateFr(r.createdAt)}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
