"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addPhotoAction, deletePhotoAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import type { GalleryPhoto, Team } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

/** Galerie : les images sont référencées par URL (Supabase Storage, Drive public, CDN du photographe). */
export function GalleryAdmin({ photos, teams }: { photos: GalleryPhoto[]; teams: Team[] }) {
  const [f, setF] = useState({ url: "", caption: "", credit: "", teamId: "" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); });
  return (
    <div className="space-y-8">
      <form className="rounded-3xl bg-white border border-ink/10 p-6 grid gap-4 sm:grid-cols-4 items-end" onSubmit={(e) => {
        e.preventDefault();
        run(() => addPhotoAction({ url: f.url, caption: f.caption || null, credit: f.credit || null, teamId: f.teamId || null }), t("a.gal.added"));
        setF({ url: "", caption: "", credit: "", teamId: "" });
      }}>
        <Field label={t("a.gal.url")} htmlFor="g-u"><Input id="g-u" required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
        <Field label={t("a.gal.caption")} htmlFor="g-c"><Input id="g-c" maxLength={140} value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></Field>
        <Field label={t("a.gal.credit")} htmlFor="g-cr"><Input id="g-cr" maxLength={80} value={f.credit} onChange={(e) => setF({ ...f, credit: e.target.value })} /></Field>
        <div className="grid gap-2">
          <Select aria-label={t("a.gal.team")} value={f.teamId} onChange={(e) => setF({ ...f, teamId: e.target.value })}><option value="">{t("a.gal.allTeams")}</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          <Button type="submit" disabled={pending}>{t("a.gal.add")}</Button>
        </div>
      </form>
      <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="rounded-2xl overflow-hidden bg-white border border-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? ""} className="w-full aspect-[4/3] object-cover" />
            <div className="p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold truncate">{p.caption ?? "—"}</span>
              <button disabled={pending} aria-label={t("a.gal.delete")} onClick={() => run(() => deletePhotoAction(p.id), t("a.gal.deleted"))} className="p-2 rounded-full hover:bg-danger hover:text-white"><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
        {!photos.length && <p className="text-slate font-semibold">{t("a.gal.none")}</p>}
      </ul>
    </div>
  );
}
