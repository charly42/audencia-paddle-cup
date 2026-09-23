import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { StatCard } from "@/components/sport/Cards";
import { formatDateFr } from "@/lib/format";
import { i18n } from "@/lib/i18n";
import { canAccess } from "@/lib/permissions";

export default async function AdminTicketsPage() {
  const profile = await requireAdmin("tickets");
  const [tickets, settings, { t }] = await Promise.all([repo.listTickets(), repo.getSettings(), i18n()]);
  const checked = tickets.filter((tk) => tk.checkedInAt).length;
  return (
    <div className="max-w-6xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.ticketing")}</p><h1 className="display text-6xl md:text-8xl">{t("a.tickets")}</h1></header>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4"><StatCard label={t("a.st.tickets")} value={tickets.length} tone="blue" /><StatCard label={t("a.st.checked")} value={checked} tone="lime" /><StatCard label={t("a.notArrived")} value={tickets.length - checked} /><StatCard label={t("a.capacity")} value={settings.ticketCapacity ?? "∞"} tone="ink" /></div>
      {canAccess(profile.role, "exports") && <a href="/admin/exports/tickets" className="inline-flex rounded-full bg-ink text-white font-extrabold px-5 py-3 text-sm min-h-11 items-center">{t("a.exportCsv")}</a>}
      <div className="rounded-3xl bg-white border border-ink/10 overflow-x-auto"><table className="w-full text-sm min-w-[40rem]"><thead className="text-left text-xs font-extrabold tracking-widest text-slate"><tr><th className="p-4">{t("a.col.name")}</th><th>{t("a.col.email")}</th><th>{t("a.col.type")}</th><th>{t("a.col.code")}</th><th>{t("a.col.checkin")}</th></tr></thead>
        <tbody className="divide-y divide-ink/10">{tickets.map((tk) => <tr key={tk.id}><td className="p-4 font-extrabold">{tk.firstName} {tk.lastName}</td><td>{tk.email}</td><td className="font-bold">{t(`tk.${tk.ticketType}`)}</td><td className="font-mono font-bold">{tk.code}</td><td className={tk.checkedInAt ? "font-extrabold text-ok" : "text-slate"}>{tk.checkedInAt ? `✓ ${formatDateFr(tk.checkedInAt)}` : "—"}</td></tr>)}</tbody></table></div>
    </div>
  );
}
