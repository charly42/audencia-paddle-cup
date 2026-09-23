"use client";
import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Download, Link2, Mail, Printer, Share2 } from "lucide-react";
import { supportTeamAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ScoreNumber } from "./primitives";
import { useT } from "@/lib/i18n/provider";

/** SUPPORT THIS TEAM — mécanique d'engagement (aucun impact sportif). */
export function SupportButton({ teamId, initialCount }: { teamId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  useEffect(() => { try { setDone(localStorage.getItem(`apc_support_${teamId}`) === "1"); } catch { /* stockage indisponible */ } }, [teamId]);
  return (
    <div className="rounded-3xl bg-white border border-ink/10 p-5 flex items-center gap-5 flex-wrap">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-slate">{t("support.title")}</p>
        <ScoreNumber value={count} className="text-7xl text-blue" />
      </div>
      <Button variant={done ? "ghost" : "lime"} disabled={pending || done} className="flex-1 min-w-52" onClick={() => start(async () => {
        const r = await supportTeamAction(teamId);
        if (r.ok && r.data) { setCount(r.data.count); setDone(true); try { localStorage.setItem(`apc_support_${teamId}`, "1"); } catch { /* noop */ } toast(r.data.already ? t("support.already") : t("support.thanks")); }
        else toast(r.error ?? t("error.generic"), "error");
      })}>
        {done ? <><Check size={18} aria-hidden /> {t("support.done")}</> : t("support.cta")}
      </Button>
    </div>
  );
}

/** SHARE — Web Share API sur mobile, sinon WhatsApp / LinkedIn / X / Email / copie du lien + téléchargement des cartes. */
export function ShareTeam({ url, teamName, slug }: { url: string; teamName: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const t = useT();
  const text = t("share.text", { team: teamName });
  const enc = encodeURIComponent;
  const native = async () => {
    if (navigator.share) { try { await navigator.share({ title: `${teamName} — Audencia Padel Cup`, text, url }); return; } catch { return; } }
    setOpen(true);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast(t("share.copied")); } catch { toast(t("share.copyFail"), "error"); } };
  const link = "flex items-center gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3 font-extrabold hover:border-blue min-h-12";
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={native}><Share2 size={18} aria-hidden />{t("share.team")}</Button>
        <a href={`/api/card/${slug}?template=auto&format=post&download=1`} className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-6 py-3.5 font-extrabold min-h-12"><Download size={18} aria-hidden />{t("share.card")}</a>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t("share.team")}>
        <div className="grid gap-2.5">
          <a className={link} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${enc(`${text}\n${url}`)}`}>WhatsApp</a>
          <a className={link} target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}>LinkedIn</a>
          <a className={link} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`}>X</a>
          <a className={link} href={`mailto:?subject=${enc(`${teamName} — Audencia Padel Cup`)}&body=${enc(`${text}\n${url}`)}`}><Mail size={18} aria-hidden />Email</a>
          <button className={link} onClick={copy}><Copy size={18} aria-hidden />{t("share.copyLink")}</button>
          <a className={link} href={`/api/card/${slug}?template=auto&format=story&download=1`}><Download size={18} aria-hidden />{t("share.story")} (Instagram)</a>
          <a className={link} href={`/api/card/${slug}?template=auto&format=og&download=1`}><Link2 size={18} aria-hidden />{t("share.og")}</a>
          <a className={link} href={`/api/card/${slug}?template=recap&format=post&download=1`}><Download size={18} aria-hidden />{t("share.recap")}</a>
          <a className={link} href={`/team/${slug}/poster`} target="_blank" rel="noopener noreferrer"><Printer size={18} aria-hidden />{t("share.posterA4")}</a>
        </div>
      </Modal>
    </>
  );
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useT();
  const { toast } = useToast();
  return <button onClick={async () => { try { await navigator.clipboard.writeText(value); toast(t("share.copiedShort")); } catch { toast(t("share.copyFail"), "error"); } }} className="inline-flex items-center gap-2 font-extrabold underline underline-offset-4"><Copy size={16} aria-hidden />{label ?? t("cta.copy")}</button>;
}
