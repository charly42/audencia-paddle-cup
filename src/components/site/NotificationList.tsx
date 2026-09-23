"use client";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { markNotificationsReadAction } from "@/lib/actions/player";
import { formatDateFr } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function NotificationList({ items }: { items: AppNotification[] }) {
  const [pending, start] = useTransition();
  const t = useT();
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <section aria-label={t("pl.notifs")} className="rounded-3xl bg-white border border-ink/10 p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="display-md text-3xl flex items-center gap-2"><Bell size={22} aria-hidden />{t("pl.notifs")}{unread > 0 && <span className="bg-lime text-ink rounded-full px-2.5 text-sm font-extrabold">{unread}</span>}</h2>
        {unread > 0 && <button disabled={pending} onClick={() => start(() => markNotificationsReadAction())} className="text-sm font-extrabold underline underline-offset-4">{t("pl.markRead")}</button>}
      </div>
      {items.length ? <ul className="divide-y divide-ink/10">{items.slice(0, 8).map((n) => (
        <li key={n.id} className="py-3 flex gap-3"><span aria-hidden className={`mt-1.5 size-2.5 rounded-full shrink-0 ${n.readAt ? "bg-ink/15" : "bg-blue"}`} />
          <div><p className="font-extrabold">{n.title}</p>{n.body && <p className="text-sm text-slate font-semibold">{n.body}</p>}<p className="text-xs text-slate/80 mt-0.5">{formatDateFr(n.createdAt)}</p></div></li>))}</ul>
        : <p className="text-slate font-semibold">{t("pl.noNotif")}</p>}
    </section>
  );
}
