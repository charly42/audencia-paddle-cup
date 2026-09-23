"use client";
import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { sendMagicLinkAction, demoLoginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { useT } from "@/lib/i18n/provider";

export function LoginForm({ next, demo }: { next: string; demo?: { players: { email: string; name: string; team: string; id: string }[]; admins: { id: string; label: string }[] } }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const t = useT();
  if (demo) return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-lime text-ink font-bold px-4 py-3 text-sm">{t("login.demo")}</p>
      <div>
        <h2 className="display-md text-2xl mb-2">{t("login.player")}</h2>
        <div className="grid gap-2">{demo.players.map((p) => (
          <Button key={p.id} variant="ghost" className="justify-between" disabled={pending} onClick={() => start(() => demoLoginAction(p.id, "/player"))}><span>{p.name}</span><span className="text-slate text-xs">{p.team}</span></Button>
        ))}</div>
      </div>
      <div>
        <h2 className="display-md text-2xl mb-2">{t("login.admin")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">{demo.admins.map((a) => <Button key={a.id} variant="dark" disabled={pending} onClick={() => start(() => demoLoginAction(a.id, "/admin"))}>{a.label}</Button>)}</div>
      </div>
    </div>
  );
  if (sent) return (
    <div className="text-center py-6"><MailCheck size={44} className="mx-auto text-blue" aria-hidden />
      <p className="display-md text-3xl mt-3">{t("login.inbox")}</p>
      <p className="text-slate mt-2">{t("login.inboxBody")}</p></div>
  );
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setError(null); start(async () => { const r = await sendMagicLinkAction(email, next); if (r.ok) setSent(true); else setError(r.error ?? t("error.generic")); }); }}>
      <Field label={t("reg.email")} htmlFor="login-email" hint={t("login.emailHint")}><Input id="login-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      {error && <p role="alert" className="text-sm font-bold text-danger">⚠ {error}</p>}
      <Button type="submit" disabled={pending || !email}>{pending ? t("login.sending") : t("login.send")}</Button>
    </form>
  );
}
