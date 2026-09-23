"use client";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/format";
import { useT, useLocale } from "@/lib/i18n/provider";
import type { Ticket } from "@/lib/types";

/** Billet avec QR code. Le QR encode l'URL /tickets/<token> — jeton non devinable (144 bits). */
export function QRTicket({ ticket, url, eventName, venue, date }: { ticket: Ticket; url: string; eventName: string; venue: string; date: string | null }) {
  const t = useT();
  const locale = useLocale();
  return (
    <article className="on-dark relative rounded-[2rem] bg-blue text-white overflow-hidden max-w-md mx-auto shadow-2xl" aria-label={t("ticket.yourTicket")}>
      <div className="court-lines p-7 pb-9">
        <p className="text-xs font-extrabold tracking-[.3em] text-lime">{t(`tk.${ticket.ticketType}`)} · {t("ticket.yourTicket")}</p>
        <h1 className="display text-5xl mt-2">{eventName}</h1>
        <p className="display-md text-xl mt-1 text-white/80">STAFF vs STUDENTS</p>
        <p className="mt-6 text-xs font-extrabold tracking-widest text-white/60">{t("ticket.name")}</p>
        <p className="display-md text-4xl break-words">{ticket.firstName} {ticket.lastName}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs font-extrabold tracking-widest text-white/60">{t("ticket.date")}</dt><dd className="font-bold">{date ? formatDate(date, undefined, locale) : t("date.tbc")}</dd></div>
          <div><dt className="text-xs font-extrabold tracking-widest text-white/60">{t("ticket.location")}</dt><dd className="font-bold">{venue}</dd></div>
        </dl>
      </div>
      <div aria-hidden className="relative h-0 border-t-2 border-dashed border-white/40"><span className="absolute -left-4 -top-4 size-8 rounded-full bg-paper" /><span className="absolute -right-4 -top-4 size-8 rounded-full bg-paper" /></div>
      <div className="bg-white text-ink p-7 grid place-items-center gap-3">
        <QRCodeSVG value={url} size={200} level="M" marginSize={1} title={`QR code — ${ticket.firstName} ${ticket.lastName}`} />
        <p className="text-xs font-extrabold tracking-widest text-slate">{t("ticket.backup")}</p>
        <p className="num text-4xl tracking-[.15em]">{ticket.code}</p>
        {ticket.checkedInAt && <p className="text-sm font-extrabold text-ok">{t("ticket.checked")}</p>}
      </div>
    </article>
  );
}
