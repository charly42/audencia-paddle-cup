"use client";
import { useState, useTransition } from "react";
import { qualifyTeamAction, updateTeamAction, uploadTeamPhotoAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import type { Promotion, Team, TeamStatus } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function TeamEditor({ team, promotions }: { team: Team; promotions: Promotion[] }) {
  const [f, setF] = useState({ name: team.name, slug: team.slug, program: team.program ?? "", description: team.description ?? "", status: team.status as TeamStatus, promotionId: team.promotionId ?? "" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const done = (r: { ok: boolean; error?: string }, msg: string) => toast(r.ok ? msg : r.error ?? t("error.generic"), r.ok ? "ok" : "error");
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr] max-w-5xl">
      <form className="rounded-3xl bg-white border border-ink/10 p-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); start(async () => done(await updateTeamAction(team.id, { ...f, promotionId: f.promotionId || null }), t("a.te.saved"))); }}>
        <Field label={t("a.te.name")} htmlFor="e-name"><Input id="e-name" value={f.name} onChange={set("name")} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("a.te.slug")} htmlFor="e-slug" hint={t("a.te.slugHint")}><Input id="e-slug" value={f.slug} onChange={set("slug")} /></Field>
          <Field label={t("filter.status")} htmlFor="e-status"><Select id="e-status" value={f.status} onChange={set("status")}>{["registered", "pending", "qualified", "semi_finalist", "finalist", "champion", "eliminated"].map((k) => <option key={k} value={k}>{t(`tstatus.${k}`)}</option>)}</Select></Field>
          <Field label={t("reg.promotion")} htmlFor="e-promo"><Select id="e-promo" value={f.promotionId} onChange={set("promotionId")}><option value="">—</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label={t("reg.program")} htmlFor="e-prog"><Input id="e-prog" value={f.program} onChange={set("program")} /></Field>
        </div>
        <Field label={t("a.te.desc")} htmlFor="e-desc"><Textarea id="e-desc" value={f.description} onChange={set("description")} maxLength={300} /></Field>
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={pending}>{t("cta.save")}</Button>
          <Button type="button" variant="lime" disabled={pending} onClick={() => start(async () => done(await qualifyTeamAction(team.id), t("a.te.qualified")))}>{t("a.te.qualify")}</Button></div>
      </form>
      <aside className="space-y-4">
        <form className="rounded-3xl bg-white border border-ink/10 p-6 grid gap-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set("teamId", team.id); start(async () => done(await uploadTeamPhotoAction(fd), t("a.te.photoOk"))); }}>
          <h2 className="display-md text-2xl">{t("a.te.photo")}</h2>
          {team.photoUrl /* eslint-disable-next-line @next/next/no-img-element */ && <img src={team.photoUrl} alt="" className="rounded-2xl aspect-[4/3] object-cover w-full" />}
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required aria-label={t("a.te.photoField")} className="text-sm" />
          <Button type="submit" variant="dark" disabled={pending}>{t("a.te.upload")}</Button>
        </form>
        <div className="rounded-3xl bg-white border border-ink/10 p-6 text-sm font-semibold space-y-1">
          <h2 className="display-md text-2xl mb-1">{t("a.te.details")}</h2>
          <p><span className="text-slate">{t("a.te.teamId")}</span> <b>{team.teamCode}</b></p>
          {team.players.map((p) => <p key={p.id}>{p.isCaptain ? "★ " : ""}{p.firstName} {p.lastName}</p>)}
          <p className="text-slate">{t("a.te.supporters", { n: team.supportersCount })}</p>
        </div>
      </aside>
    </div>
  );
}
