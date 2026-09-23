"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema, type TicketValues } from "@/lib/schemas";
import { createTicketAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import type { Promotion } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

export function TicketForm({ promotions, closedReason }: { promotions: Promotion[]; closedReason?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const { register, handleSubmit, formState: { errors } } = useForm<TicketValues>({ resolver: zodResolver(ticketSchema), mode: "onTouched", defaultValues: { ticketType: "spectator", promotionId: "", website: "" } });
  if (closedReason) return <div className="rounded-3xl bg-ink text-white p-8"><p className="display text-4xl">{t("tk.closed")}</p><p className="mt-2 text-white/80">{closedReason}</p></div>;
  const onSubmit = handleSubmit((v) => start(async () => {
    setError(null);
    const r = await createTicketAction(v);
    if (r.ok && r.data) router.push(`/tickets/${r.data.token}`); else setError(r.error ?? t("error.generic"));
  }));
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[2rem] bg-white border border-ink/10 p-6 md:p-8 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("reg.firstName")} htmlFor="t-fn" error={errors.firstName?.message && t(errors.firstName.message)}><Input id="t-fn" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} /></Field>
        <Field label={t("reg.lastName")} htmlFor="t-ln" error={errors.lastName?.message && t(errors.lastName.message)}><Input id="t-ln" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} /></Field>
      </div>
      <Field label={t("reg.email")} htmlFor="t-em" error={errors.email?.message && t(errors.email.message)} hint={t("tk.emailHint")}><Input id="t-em" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register("email")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("tk.type")} htmlFor="t-type" error={errors.ticketType?.message && t(errors.ticketType.message)}>
          <Select id="t-type" {...register("ticketType")}><option value="spectator">{t("tk.spectator")}</option><option value="supporter">{t("tk.supporter")}</option><option value="staff">{t("tk.staff")}</option><option value="player">{t("tk.player")}</option></Select>
        </Field>
        <Field label={t("tk.promoOptional")} htmlFor="t-promo"><Select id="t-promo" {...register("promotionId")}><option value="">—</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      </div>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label></div>
      {error && <p role="alert" className="rounded-xl bg-danger text-white font-bold px-4 py-3">⚠ {error}</p>}
      <Button type="submit" variant="lime" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">{pending ? t("tk.generating") : t("tk.submit")}</Button>
    </form>
  );
}
