"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Minus, Pause, Play, Plus, Square } from "lucide-react";
import { assignCourtAction, matchControlAction, setScoreAction } from "@/lib/actions/admin";
import { useLive } from "@/components/sport/LiveProvider";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useRoundText } from "@/components/sport/MatchCards";
import { useT } from "@/lib/i18n/provider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Court } from "@/lib/types";

/**
 * Interface bord de terrain (mobile-first) : gros boutons, mises à jour optimistes,
 * écritures sérialisées (pas de course entre deux taps rapides), confirmation pour terminer.
 */
export function ScoreConsole({ courts }: { courts: Court[] }) {
  const { matches } = useLive();
  const t = useT();
  const roundText = useRoundText();
  const { toast } = useToast();
  const [id, setId] = useState<string | null>(null);
  const [court, setCourt] = useState("");
  const [score, setScore] = useState({ a: 0, b: 0 });
  const [saving, setSaving] = useState<"idle" | "saving" | "error">("idle");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const inflight = useRef(0);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const active = matches.filter((m) => m.status !== "final" && m.status !== "cancelled" && (!court || m.courtId === court))
    .sort((a, b) => (a.status === "live" ? -1 : 1) - (b.status === "live" ? -1 : 1) || (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9"));
  const m = matches.find((x) => x.id === id) ?? null;

  // Synchronise avec le serveur seulement quand aucune écriture n'est en cours
  useEffect(() => { if (m && inflight.current === 0) setScore({ a: m.scoreA, b: m.scoreB }); }, [m?.id, m?.scoreA, m?.scoreB]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = (a: number, b: number) => {
    if (!m) return;
    setScore({ a, b }); setSaving("saving"); inflight.current++;
    const matchId = m.id;
    chain.current = chain.current.then(() => setScoreAction({ matchId, scoreA: a, scoreB: b })).then((r) => {
      inflight.current--; const res = r as { ok: boolean; error?: string };
      if (!res.ok) { setSaving("error"); toast(res.error ?? t("a.saveFail"), "error"); } else if (inflight.current === 0) setSaving("idle");
    }).catch(() => { inflight.current--; setSaving("error"); });
  };
  const bump = (side: "a" | "b", d: number) => { const n = Math.max(0, Math.min(99, score[side] + d)); push(side === "a" ? n : score.a, side === "b" ? n : score.b); if (navigator.vibrate) navigator.vibrate(15); };
  const ctl = (action: "start" | "pause" | "resume" | "end", ok: string) => start(async () => { const r = await matchControlAction(m!.id, action, action === "end"); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); if (r.ok && action === "end") setId(null); });
  const sel = "rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5 text-sm font-bold min-h-12";

  if (!m) return (
    <div className="space-y-4">
      <select aria-label={t("a.courtFilter")} className={sel} value={court} onChange={(e) => setCourt(e.target.value)}><option value="">{t("filter.allCourts")}</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <ul className="grid gap-3 md:grid-cols-2">
        {active.map((x) => (
          <li key={x.id}><button onClick={() => setId(x.id)} className="w-full text-left rounded-3xl bg-white border-2 border-ink/10 hover:border-blue p-4 min-h-24">
            <div className="flex justify-between gap-2 mb-1"><span className="text-xs font-extrabold tracking-widest text-slate">{x.courtName ?? t("live.courtTbc")} · {formatTime(x.scheduledAt)}</span><StatusBadge status={x.status} /></div>
            <p className="font-extrabold text-lg">{x.teamA?.name ?? t("common.tbd")} <span className="text-slate">vs</span> {x.teamB?.name ?? t("common.tbd")}</p><p className="text-xs font-bold text-slate">{roundText(x)}</p></button></li>
        ))}
      </ul>
      {!active.length && <p className="rounded-3xl border-2 border-dashed border-ink/20 p-8 text-center font-semibold text-slate">{t("a.nothingToScore")}</p>}
    </div>
  );

  const live = m.status === "live";
  const Side = ({ side, name }: { side: "a" | "b"; name: string }) => (
    <section className="rounded-3xl bg-ink text-white on-dark p-4 md:p-6 text-center" aria-label={name}>
      <p className="display-md text-2xl md:text-3xl truncate">{name}</p>
      <p className={cn("num text-[9rem] md:text-[12rem] my-2", score[side] > score[side === "a" ? "b" : "a"] ? "text-lime" : "text-white")} aria-live="polite">{score[side]}</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => bump(side, -1)} aria-label={t("a.removePoint", { team: name })} className="rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 transition min-h-20 grid place-items-center"><Minus size={40} /></button>
        <button onClick={() => bump(side, 1)} aria-label={t("a.addPoint", { team: name })} className="rounded-2xl bg-lime text-ink active:scale-95 transition min-h-20 grid place-items-center"><Plus size={44} strokeWidth={3} /></button>
      </div>
    </section>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><Button variant="ghost" onClick={() => setId(null)}>{t("a.backMatches")}</Button>
        <span className={cn("text-xs font-extrabold tracking-widest", saving === "error" ? "text-danger" : "text-slate")} role="status">{saving === "saving" ? t("a.saving") : saving === "error" ? t("a.notSaved") : t("a.saved")}</span></div>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={m.status} /><span className="text-xs font-extrabold tracking-widest text-slate">{roundText(m)} · {formatTime(m.scheduledAt)}</span>
        <select aria-label={t("filter.court")} className={sel} value={m.courtId ?? ""} onChange={(e) => start(async () => { const r = await assignCourtAction(m.id, e.target.value || null); toast(r.ok ? t("a.courtUpdated") : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); })}><option value="">{t("live.courtTbc")}</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="grid gap-3 md:grid-cols-2"><Side side="a" name={m.teamA?.name ?? t("common.tbd")} /><Side side="b" name={m.teamB?.name ?? t("common.tbd")} /></div>
      <div className="grid grid-cols-2 gap-3">
        {!live ? <Button className="col-span-2 !min-h-16 text-lg" disabled={pending || !m.teamA || !m.teamB} onClick={() => ctl("start", t("a.matchLive"))}><Play aria-hidden />{t("a.startMatch")}</Button> : <>
          <Button variant="dark" className="!min-h-16" disabled={pending} onClick={() => ctl(m.paused ? "resume" : "pause", m.paused ? t("a.resumed") : t("a.paused"))}>{m.paused ? <><Play aria-hidden />{t("a.resume")}</> : <><Pause aria-hidden />{t("a.pause")}</>}</Button>
          <Button variant="lime" className="!min-h-16" disabled={pending} onClick={() => setConfirm(true)}><Square aria-hidden />{t("a.endMatch")}</Button></>}
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title={t("a.endQ")}>
        <p className="font-semibold">{t("a.publishFinal", { a: score.a, b: score.b, ta: m.teamA?.name ?? "", tb: m.teamB?.name ?? "" })}</p>
        <div className="mt-5 flex gap-2 justify-end"><Button variant="ghost" onClick={() => setConfirm(false)}>{t("cta.back")}</Button><Button disabled={pending || saving === "saving"} onClick={() => { setConfirm(false); ctl("end", t("a.ended")); }}>{t("a.confirmFinal")}</Button></div>
      </Modal>
    </div>
  );
}
