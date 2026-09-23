"use client";
import { useState, useTransition } from "react";
import { createMatchAction, syncChallongeAction, updateMatchScheduleAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import type { Court, Match, Promotion, Team } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

type T = "qualifiers" | "main-event" | "staff-vs-students";
type R = "group" | "r16" | "quarter" | "semi" | "final" | "game";

export function MatchCreator({ teams, courts, promotions, challonge }: { teams: Team[]; courts: Court[]; promotions: Promotion[]; challonge: boolean }) {
  const [f, setF] = useState({ tournament: "main-event" as T, round: "group" as R, teamAId: "", teamBId: "", courtId: "", scheduledAt: "", promotionId: "", gameNo: "", pointsValue: "1" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <form className="rounded-3xl bg-white border border-ink/10 p-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await createMatchAction({ tournament: f.tournament, round: f.tournament === "staff-vs-students" && f.gameNo ? "game" : f.round, teamAId: f.teamAId, teamBId: f.teamBId, courtId: f.courtId || null, scheduledAt: f.scheduledAt || null, promotionId: f.promotionId || null, gameNo: f.gameNo ? Number(f.gameNo) : null, pointsValue: Number(f.pointsValue) || 1 });
      toast(r.ok ? t("a.mc.created") : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); }); }}>
      <h2 className="display-md text-3xl">{t("a.mc.new")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("a.mc.tournament")} htmlFor="m-t"><Select id="m-t" value={f.tournament} onChange={set("tournament")}><option value="qualifiers">{t("a.mc.qualifiers")}</option><option value="main-event">{t("a.mc.studentCup")}</option><option value="staff-vs-students">{t("a.mc.staff")}</option></Select></Field>
        <Field label={t("a.mc.round")} htmlFor="m-r"><Select id="m-r" value={f.round} onChange={set("round")}>{["group", "r16", "quarter", "semi", "final", "game"].map((r) => <option key={r} value={r}>{t(`round.${r}`)}</option>)}</Select></Field>
        <Field label={t("a.mc.teamA")} htmlFor="m-a"><Select id="m-a" value={f.teamAId} onChange={set("teamAId")} required><option value="">{t("reg.select")}</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <Field label={t("a.mc.teamB")} htmlFor="m-b"><Select id="m-b" value={f.teamBId} onChange={set("teamBId")} required><option value="">{t("reg.select")}</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <Field label={t("a.mc.court")} htmlFor="m-c"><Select id="m-c" value={f.courtId} onChange={set("courtId")}><option value="">{t("a.tbc")}</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label={t("a.mc.when")} htmlFor="m-d"><Input id="m-d" type="datetime-local" value={f.scheduledAt} onChange={set("scheduledAt")} /></Field>
        {f.tournament === "qualifiers" && <Field label={t("reg.promotion")} htmlFor="m-p"><Select id="m-p" value={f.promotionId} onChange={set("promotionId")}><option value="">—</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>}
        {f.tournament === "staff-vs-students" && <><Field label={t("a.mc.game")} htmlFor="m-g" hint={t("a.mc.gameHint")}><Input id="m-g" type="number" min={1} value={f.gameNo} onChange={set("gameNo")} /></Field><Field label={t("a.mc.points")} htmlFor="m-pv"><Input id="m-pv" type="number" min={1} value={f.pointsValue} onChange={set("pointsValue")} /></Field></>}
      </div>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={pending}>{t("a.mc.create")}</Button>
        {challonge && <Button type="button" variant="dark" disabled={pending} onClick={() => start(async () => { const r = await syncChallongeAction(); toast(r.ok ? t("a.mc.synced", { n: (r.data as { synced: number }).synced }) : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); })}>{t("a.mc.sync")}</Button>}</div>
    </form>
  );
}

export function ScheduleCell({ match }: { match: Match }) {
  const local = match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16) : "";
  const [v, setV] = useState(local);
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  return (
    <div className="flex gap-2 items-center">
      <input type="datetime-local" aria-label={t("a.mc.schedule")} value={v} onChange={(e) => setV(e.target.value)} className="rounded-xl border-2 border-ink/15 px-2 py-1.5 text-sm font-bold min-h-10" />
      <Button variant="ghost" className="!py-1.5 !min-h-10 !px-4 !text-xs" disabled={pending || v === local} onClick={() => start(async () => { const r = await updateMatchScheduleAction(match.id, v ? new Date(v).toISOString() : null); toast(r.ok ? t("a.mc.scheduleOk") : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); })}>{t("cta.save")}</Button>
    </div>
  );
}
