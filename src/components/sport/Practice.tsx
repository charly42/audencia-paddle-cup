"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CalendarClock, Dumbbell, MapPin, Users } from "lucide-react";
import { bookPracticeAction, cancelPracticeAction } from "@/lib/actions/player";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { hhmm, shortDay, weekday } from "@/lib/format";
import { useT, useLocale } from "@/lib/i18n/provider";
import type { PracticeSession } from "@/lib/types";

export function PracticeCard({ session: s, myReg, loggedIn }: { session: PracticeSession; myReg?: { id: string; status: "booked" | "waitlist" } | null; loggedIn: boolean }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const full = s.spotsLeft < 2;
  const levelLabel = (l: string) => (l === "all" ? t("levelAll") : t(`level.${l}`));
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    const r = await fn(); toast(r.ok ? ok : r.error ?? "Erreur", r.ok ? "ok" : "error");
  });
  return (
    <article className="rounded-3xl bg-white border border-ink/10 overflow-hidden flex flex-col">
      <div className="bg-blue on-dark text-white p-5 court-lines">
        <p className="text-xs font-extrabold tracking-widest text-lime">{shortDay(s.date, locale)}</p>
        <p className="display text-5xl">{weekday(s.date, locale)}</p>
        <p className="num text-6xl text-lime mt-1">{hhmm(s.startTime)}</p>
      </div>
      <div className="p-5 flex-1 space-y-3">
        <p className="display-md text-2xl flex items-center gap-2"><MapPin size={18} aria-hidden />{s.location}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="light"><Users size={12} aria-hidden />{s.courtsCount} {s.courtsCount > 1 ? t("pr.courts") : t("pr.court")}</Badge>
          <Badge tone={full ? "danger" : "lime"}>{full ? t("pr.full") : t("pr.spots", { n: s.spotsLeft })}</Badge>
          <Badge tone="light">{levelLabel(s.level)}</Badge>
          {s.coach && <Badge tone="blue"><Dumbbell size={12} aria-hidden />{t("pr.coach")}</Badge>}
        </div>
        <p className="text-sm text-slate font-semibold flex items-center gap-1.5"><CalendarClock size={14} aria-hidden />{s.durationMin} {t("pr.min")} · {t("pr.registered", { n: s.bookedTeams.length })}{s.waitlistCount ? ` · ${t("pr.waiting", { n: s.waitlistCount })}` : ""}</p>
        {s.bookedTeams.length > 0 && <p className="text-xs font-bold text-slate">{s.bookedTeams.map((t) => t.name).join(" · ")}</p>}
      </div>
      <div className="p-5 pt-0">
        {s.status !== "open" ? <Button disabled className="w-full" variant="ghost">{t("pr.closed")}</Button>
          : myReg ? (
            <div className="grid gap-2">
              <Badge tone={myReg.status === "booked" ? "lime" : "light"} className="justify-center !py-2">{myReg.status === "booked" ? t("pr.booked") : t("pr.onWaitlist")}</Badge>
              <Button variant="ghost" disabled={pending} onClick={() => run(() => cancelPracticeAction(myReg.id), t("pr.okCancel"))}>{t("pr.cancel")}</Button>
            </div>
          ) : !loggedIn ? <Link href="/login?next=/tournament/practice" className="inline-flex w-full justify-center items-center rounded-full bg-ink text-white font-extrabold px-6 py-3.5 min-h-12">{t("pr.loginToBook")}</Link>
          : <Button className="w-full" disabled={pending || (full && !s.waitlistEnabled)} onClick={() => run(() => bookPracticeAction(s.id), full ? t("pr.okWaitlist") : t("pr.okBooked"))}>{full ? t("pr.joinWaitlist") : t("pr.book")}</Button>}
      </div>
    </article>
  );
}

/** Liste filtrable : date / niveau / disponibilité. */
export function PracticeBoard({ sessions, myRegs, loggedIn }: { sessions: PracticeSession[]; myRegs: Record<string, { id: string; status: "booked" | "waitlist" }>; loggedIn: boolean }) {
  const [date, setDate] = useState(""), [level, setLevel] = useState(""), [avail, setAvail] = useState(false);
  const t = useT();
  const locale = useLocale();
  const dates = useMemo(() => [...new Set(sessions.map((s) => s.date))], [sessions]);
  const list = sessions.filter((s) => (!date || s.date === date) && (!level || s.level === level) && (!avail || s.spotsLeft >= 2));
  const sel = "rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5 text-sm font-bold min-h-11";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6" role="search" aria-label={t("pr.filterAria")}>
        <select aria-label={t("pr.date")} className={sel} value={date} onChange={(e) => setDate(e.target.value)}><option value="">{t("pr.allDates")}</option>{dates.map((d) => <option key={d} value={d}>{weekday(d, locale)} {shortDay(d, locale)}</option>)}</select>
        <select aria-label={t("pr.level")} className={sel} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">{t("levelAll")}</option>{["beginner", "intermediate", "advanced"].map((k) => <option key={k} value={k}>{t(`level.${k}`)}</option>)}</select>
        <label className="inline-flex items-center gap-2 text-sm font-bold px-2 min-h-11"><input type="checkbox" className="size-5 accent-blue" checked={avail} onChange={(e) => setAvail(e.target.checked)} />{t("pr.availableOnly")}</label>
      </div>
      {list.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map((s) => <PracticeCard key={s.id} session={s} myReg={myRegs[s.id]} loggedIn={loggedIn} />)}</div>
        : <EmptyState title={t("pr.none")} body={t("pr.noneBody")} />}
    </div>
  );
}
