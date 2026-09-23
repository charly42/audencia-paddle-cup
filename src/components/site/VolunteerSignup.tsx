"use client";
import { useState, useTransition } from "react";
import { assignVolunteerAction } from "@/lib/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/provider";

/** Inscription d'un bénévole sur un créneau. Les coordonnées ne sont jamais affichées publiquement. */
export function VolunteerSignup({ shiftId, label }: { shiftId: string; label: string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const t = useT();
  return (
    <form className="grid gap-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await assignVolunteerAction(shiftId, f.name, f.email, f.phone);
        if (r.ok) { setF({ name: "", email: "", phone: "" }); toast(t("vol.ok")); } else toast(r.error ?? t("error.generic"), "error");
      });
    }}>
      <Input aria-label={t("vol.name")} placeholder={t("vol.name")} required maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input aria-label={t("reg.email")} type="email" placeholder={t("reg.email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Button type="submit" disabled={pending || f.name.trim().length < 2}>{label}</Button>
    </form>
  );
}
