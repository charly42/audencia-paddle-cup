"use client";
import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { moderateCheerAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateFr } from "@/lib/format";
import type { Cheer } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function ModerationList({ pending: waiting, approved }: { pending: Cheer[]; approved: Cheer[] }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  const act = (id: string, status: "approved" | "rejected") => start(async () => {
    const r = await moderateCheerAction(id, status);
    toast(r.ok ? (status === "approved" ? t("a.mod.published") : t("a.mod.rejected")) : r.error ?? t("error.generic"), r.ok ? "ok" : "error");
  });
  const Row = ({ c, actions }: { c: Cheer; actions: boolean }) => (
    <li className="rounded-2xl bg-white border border-ink/10 p-4 flex flex-wrap items-start gap-4">
      <div className="flex-1 min-w-56">
        <p className="font-semibold">“{c.message}”</p>
        <p className="text-xs font-extrabold tracking-wider text-slate mt-1">{c.author} → {c.teamName ?? "—"} · {formatDateFr(c.createdAt)}</p>
      </div>
      {actions && (
        <div className="flex gap-2">
          <Button variant="lime" className="!py-2 !min-h-10 !text-xs" disabled={pending} onClick={() => act(c.id, "approved")}><Check size={15} aria-hidden />{t("a.mod.publish")}</Button>
          <Button variant="ghost" className="!py-2 !min-h-10 !text-xs" disabled={pending} onClick={() => act(c.id, "rejected")}><X size={15} aria-hidden />{t("a.mod.reject")}</Button>
        </div>
      )}
    </li>
  );
  return (
    <div className="space-y-8">
      <section><h2 className="display text-4xl mb-3">{t("a.mod.pending", { n: waiting.length })}</h2>
        {waiting.length ? <ul className="grid gap-3">{waiting.map((c) => <Row key={c.id} c={c} actions />)}</ul> : <p className="text-slate font-semibold">{t("a.mod.none")}</p>}</section>
      <section><h2 className="display text-4xl mb-3">{t("a.mod.approved", { n: approved.length })}</h2>
        {approved.length ? <ul className="grid gap-3">{approved.slice(0, 30).map((c) => <Row key={c.id} c={c} actions={false} />)}</ul> : <p className="text-slate font-semibold">{t("a.mod.noneApproved")}</p>}</section>
    </div>
  );
}
