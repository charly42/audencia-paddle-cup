"use client";
import { useState, useTransition } from "react";
import { Megaphone, X } from "lucide-react";
import { clearAnnouncementAction, setAnnouncementAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import type { AnnouncementLevel, EventSettings } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

const toLocal = (iso: string | null) => (iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16) : "");

/**
 * Annonce d'urgence : publiée simultanément sur le site public et sur TOUS les écrans campus.
 * Bilingue : le visiteur voit la version correspondant à sa langue.
 */
export function AnnouncementForm({ settings }: { settings: EventSettings }) {
  const [f, setF] = useState({
    fr: settings.announcementFr ?? "", en: settings.announcementEn ?? "",
    level: settings.announcementLevel as AnnouncementLevel, until: toLocal(settings.announcementUntil),
  });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const active = !!(settings.announcementFr || settings.announcementEn);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); });
  return (
    <section className="rounded-3xl bg-white border border-ink/10 p-6">
      <h2 className="display-md text-3xl flex items-center gap-2"><Megaphone size={24} aria-hidden />{t("a.an.title")}</h2>
      <p className="text-sm text-slate font-semibold mt-1">{t("a.an.help")}</p>
      <form className="mt-4 grid gap-4" onSubmit={(e) => { e.preventDefault(); run(() => setAnnouncementAction({ ...f, until: f.until || null }), t("a.an.published")); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("a.an.fr")} htmlFor="a-fr"><Input id="a-fr" maxLength={200} value={f.fr} onChange={(e) => setF({ ...f, fr: e.target.value })} placeholder={t("a.an.phFr")} /></Field>
          <Field label={t("a.an.en")} htmlFor="a-en"><Input id="a-en" maxLength={200} value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} placeholder={t("a.an.phEn")} /></Field>
          <Field label={t("a.an.level")} htmlFor="a-lvl" hint={t("a.an.levelHint")}>
            <Select id="a-lvl" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as AnnouncementLevel })}>
              <option value="info">{t("announce.info")}</option><option value="warning">{t("announce.warning")}</option><option value="urgent">{t("announce.urgent")}</option>
            </Select>
          </Field>
          <Field label={t("a.an.until")} htmlFor="a-until" hint={t("a.an.untilHint")}><Input id="a-until" type="datetime-local" value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>{t("a.an.publish")}</Button>
          {active && <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => clearAnnouncementAction(), t("a.an.removed"))}><X size={16} aria-hidden />{t("a.an.remove")}</Button>}
        </div>
      </form>
    </section>
  );
}
