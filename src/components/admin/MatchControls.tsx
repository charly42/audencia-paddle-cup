"use client";
import { useState, useTransition } from "react";
import { Pause, Play, Square, Timer } from "lucide-react";
import { assignCourtAction, matchControlAction, setMatchStatusAction } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useRoundText } from "@/components/sport/MatchCards";
import { useT } from "@/lib/i18n/provider";
import { formatTime } from "@/lib/format";
import type { Court, Match, MatchStatus } from "@/lib/types";

/** Une ligne de contrôle de match (command center) : statut, court, démarrer / pause / terminer / reporter. */
export function MatchControlRow({ match: m, courts }: { match: Match; courts: Court[] }) {
  const t = useT();
  const roundText = useRoundText();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const { toast } = useToast();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok = t("a.ok")) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); });
  const sel = "rounded-xl border-2 border-ink/15 bg-white px-3 py-2 text-sm font-bold min-h-11";
  const live = m.status === "live", done = m.status === "final";
  return (
    <article className="rounded-3xl bg-white border border-ink/10 p-4 space-y-3">
      <header className="flex items-center justify-between gap-2"><span className="text-xs font-extrabold tracking-widest text-slate">{roundText(m)} · {formatTime(m.scheduledAt)}</span><StatusBadge status={m.status} /></header>
      <div className="flex items-center justify-between gap-3">
        <p className="font-extrabold leading-tight">{m.teamA?.name ?? t("common.tbd")}<br /><span className="text-slate font-bold text-sm">vs</span> {m.teamB?.name ?? t("common.tbd")}</p>
        <p className="num text-5xl text-blue whitespace-nowrap">{m.scoreA}<span className="text-slate/50"> – </span>{m.scoreB}</p>
      </div>
      {!done && (
        <div className="flex flex-wrap gap-2 items-center">
          <select aria-label={t("filter.court")} className={sel} value={m.courtId ?? ""} disabled={pending} onChange={(e) => run(() => assignCourtAction(m.id, e.target.value || null), t("a.courtUpdated"))}>
            <option value="">{t("live.courtTbc")}</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!live && <select aria-label={t("filter.status")} className={sel} value={m.status} disabled={pending} onChange={(e) => run(() => setMatchStatusAction(m.id, e.target.value as MatchStatus), t("a.statusUpdated"))}>
            {["upcoming", "check_in", "warm_up", "postponed", "cancelled"].map((s) => <option key={s} value={s}>{t(`mstatus.${s}`)}</option>)}</select>}
          {!live && <Button className="!py-2.5 !min-h-11" disabled={pending || !m.teamA || !m.teamB} onClick={() => run(() => matchControlAction(m.id, "start"), t("a.matchStarted"))}><Play size={16} aria-hidden />{t("a.start")}</Button>}
          {live && <Button variant="dark" className="!py-2.5 !min-h-11" disabled={pending} onClick={() => run(() => matchControlAction(m.id, m.paused ? "resume" : "pause"))}>{m.paused ? <><Play size={16} aria-hidden />{t("a.resume")}</> : <><Pause size={16} aria-hidden />{t("a.pause")}</>}</Button>}
          {live && <Button variant="lime" className="!py-2.5 !min-h-11" disabled={pending} onClick={() => setConfirm(true)}><Square size={16} aria-hidden />{t("a.end")}</Button>}
          {!live && <Button variant="ghost" className="!py-2.5 !min-h-11" disabled={pending} onClick={() => run(() => matchControlAction(m.id, "delay"), t("a.delayed"))}><Timer size={16} aria-hidden />{t("a.delay")}</Button>}
        </div>
      )}
      <Modal open={confirm} onClose={() => setConfirm(false)} title={t("a.endQ")}>
        <p className="font-semibold">{t("a.endBody", { a: m.scoreA, b: m.scoreB })}</p>
        <div className="mt-5 flex gap-2 justify-end"><Button variant="ghost" onClick={() => setConfirm(false)}>{t("cta.cancel")}</Button><Button variant="primary" disabled={pending} onClick={() => { setConfirm(false); run(() => matchControlAction(m.id, "end", true), t("a.ended")); }}>{t("a.confirmFinal")}</Button></div>
      </Modal>
    </article>
  );
}
