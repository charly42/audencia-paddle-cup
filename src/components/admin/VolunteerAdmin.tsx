"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteShiftAction, removeAssignmentAction, saveShiftAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatTime } from "@/lib/format";
import type { Court, VolunteerShift } from "@/lib/types";
import { useT, useLocale } from "@/lib/i18n/provider";

const ROLES = ["ARBITRE", "ACCUEIL", "CHECK-IN", "BUVETTE", "PHOTO", "LOGISTIQUE"];

export function VolunteerAdmin({ shifts, courts }: { shifts: VolunteerShift[]; courts: Court[] }) {
  const [f, setF] = useState({ role: ROLES[0], startsAt: "", endsAt: "", courtId: "", capacity: "2", notes: "" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  /** Rôles stockés en code interne (ARBITRE…), affichés traduits. */
  const roleLabel = (r: string) => { const k = `role.${r}`; const v = t(k); return v === k ? r : v; };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); });
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white border border-ink/10 p-6">
        <h2 className="display-md text-3xl mb-4">{t("a.vol.new")}</h2>
        <form className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 items-end" onSubmit={(e) => {
          e.preventDefault();
          run(() => saveShiftAction({ role: f.role, startsAt: f.startsAt, endsAt: f.endsAt, courtId: f.courtId || null, capacity: Number(f.capacity) || 1, notes: f.notes || null }), t("a.vol.created"));
        }}>
          <Field label={t("a.vol.role")} htmlFor="v-r"><Select id="v-r" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}</Select></Field>
          <Field label={t("a.vol.start")} htmlFor="v-s"><Input id="v-s" type="datetime-local" required value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
          <Field label={t("a.vol.end")} htmlFor="v-e"><Input id="v-e" type="datetime-local" required value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></Field>
          <Field label={t("a.vol.court")} htmlFor="v-c"><Select id="v-c" value={f.courtId} onChange={(e) => setF({ ...f, courtId: e.target.value })}><option value="">—</option>{courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label={t("a.vol.slots")} htmlFor="v-n"><Input id="v-n" type="number" min={1} max={20} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Button type="submit" disabled={pending}>{t("a.vol.create")}</Button>
        </form>
      </section>

      <section>
        <h2 className="display text-4xl mb-3">{t("a.vol.shifts", { n: shifts.length })}</h2>
        <ul className="grid gap-3">
          {shifts.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white border border-ink/10 p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-56">
                <p className="display-md text-2xl">{roleLabel(s.role)} <span className="text-slate text-base">{s.courtName ?? ""}</span></p>
                <p className="font-bold text-sm">{formatDate(s.startsAt, { day: "numeric", month: "short" }, locale)} · {formatTime(s.startsAt)}–{formatTime(s.endsAt)} · {s.assigned.length}/{s.capacity}</p>
                {s.assigned.length > 0 && (
                  <ul className="flex flex-wrap gap-2 mt-2">
                    {s.assigned.map((a) => (
                      <li key={a.id}><button disabled={pending} onClick={() => run(() => removeAssignmentAction(a.id), t("a.vol.removed"))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-extrabold hover:bg-danger hover:text-white min-h-9">{a.name} ✕</button></li>
                    ))}
                  </ul>
                )}
              </div>
              <Button variant="ghost" className="!py-2 !min-h-10 !text-xs" disabled={pending} onClick={() => run(() => deleteShiftAction(s.id), t("a.vol.deleted"))}><Trash2 size={15} aria-hidden />{t("a.vol.delete")}</Button>
            </li>
          ))}
          {!shifts.length && <p className="text-slate font-semibold">{t("a.vol.none")}</p>}
        </ul>
      </section>
    </div>
  );
}
