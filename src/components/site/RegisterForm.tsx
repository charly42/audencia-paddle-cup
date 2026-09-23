"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Camera, Check } from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import { registerTeamAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Form";
import { CopyButton } from "@/components/sport/Engagement";
import type { Promotion } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

const STEPS = ["reg.step.team", "reg.step.p1", "reg.step.p2", "reg.step.confirm"] as const;
const STEP_FIELDS: (readonly string[])[] = [
  ["teamName", "promotionId", "program"],
  ["players.0.firstName", "players.0.lastName", "players.0.email", "players.0.phone", "players.0.skillLevel"],
  ["players.1.firstName", "players.1.lastName", "players.1.email", "players.1.phone", "players.1.skillLevel"],
  ["acceptRules", "imageRights", "acceptConditions"],
];
const emptyPlayer = { firstName: "", lastName: "", email: "", phone: "", skillLevel: "intermediate" as const };

function PlayerStep({ i, form }: { i: 0 | 1; form: ReturnType<typeof useForm<RegisterValues>> }) {
  const { register, formState: { errors } } = form;
  const t = useT();
  const e = errors.players?.[i];
  const p = `players.${i}` as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("reg.firstName")} htmlFor={`${p}-fn`} error={e?.firstName?.message && t(e.firstName.message)}><Input id={`${p}-fn`} autoComplete="given-name" aria-invalid={!!e?.firstName} {...register(`${p}.firstName`)} /></Field>
      <Field label={t("reg.lastName")} htmlFor={`${p}-ln`} error={e?.lastName?.message && t(e.lastName.message)}><Input id={`${p}-ln`} autoComplete="family-name" aria-invalid={!!e?.lastName} {...register(`${p}.lastName`)} /></Field>
      <Field label={t("reg.email")} htmlFor={`${p}-em`} error={e?.email?.message && t(e.email.message)} hint={i === 0 ? t("reg.emailHint") : undefined}><Input id={`${p}-em`} type="email" autoComplete="email" inputMode="email" aria-invalid={!!e?.email} {...register(`${p}.email`)} /></Field>
      <Field label={t("reg.phone")} htmlFor={`${p}-ph`} error={e?.phone?.message && t(e.phone.message)}><Input id={`${p}-ph`} type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!e?.phone} {...register(`${p}.phone`)} /></Field>
      <Field label={t("reg.level")} htmlFor={`${p}-sk`} error={e?.skillLevel?.message && t(e.skillLevel.message)}>
        <Select id={`${p}-sk`} {...register(`${p}.skillLevel`)}><option value="beginner">{t("level.beginner")}</option><option value="intermediate">{t("level.intermediate")}</option><option value="advanced">{t("level.advanced")}</option></Select>
      </Field>
    </div>
  );
}

export function RegisterForm({ promotions, closedReason }: { promotions: Promotion[]; closedReason?: string }) {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ teamCode: string; slug: string; teamName: string } | null>(null);
  const [pending, start] = useTransition();
  const t = useT();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema), mode: "onTouched",
    defaultValues: { teamName: "", promotionId: "", program: "", players: [emptyPlayer, emptyPlayer], website: "" } as never,
  });
  const { register, trigger, handleSubmit, setValue, formState: { errors } } = form;

  if (closedReason) return <div className="rounded-3xl bg-ink text-white p-8"><p className="display text-4xl">{t("reg.closed")}</p><p className="mt-2 text-white/80">{closedReason}</p></div>;

  if (done) return (
    <div className="on-dark rounded-[2rem] bg-blue text-white p-8 md:p-12 court-lines text-center">
      <span className="inline-grid place-items-center size-16 rounded-full bg-lime text-ink"><Check size={34} aria-hidden /></span>
      <p className="display text-6xl md:text-8xl mt-4">{t("reg.done")}</p>
      <p className="mt-2 text-white/85">{done.teamName}</p>
      <div className="mt-6 inline-block bg-white text-ink rounded-2xl px-6 py-4">
        <p className="text-xs font-extrabold tracking-widest text-slate">{t("reg.teamId")}</p>
        <p className="num text-5xl tracking-wider">{done.teamCode}</p>
        <CopyButton value={done.teamCode} label={t("reg.copyTeamId")} />
      </div>
      <p className="mt-6 text-white/85 max-w-md mx-auto">{t("reg.doneBody")}</p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link href={`/team/${done.slug}`} className="rounded-full bg-lime text-ink font-extrabold px-6 py-3.5">{t("reg.viewTeam")}</Link>
        <Link href="/login?next=/player" className="rounded-full border-2 border-white font-extrabold px-6 py-3.5">{t("reg.playerLogin")}</Link>
      </div>
    </div>
  );

  const next = async () => { if (await trigger(STEP_FIELDS[step] as never)) setStep((s) => s + 1); };
  const submit = handleSubmit((values) => {
    setServerError(null);
    const fd = new FormData();
    fd.set("payload", JSON.stringify(values));
    if (photo) fd.set("photo", photo);
    start(async () => {
      const r = await registerTeamAction(fd);
      if (r.ok && r.data) setDone(r.data); else setServerError(r.error ?? t("error.generic"));
    });
  });
  const onPhoto = (f: File | null) => { setPhoto(f); setPreview(f ? URL.createObjectURL(f) : null); };

  return (
    <form onSubmit={submit} noValidate className="rounded-[2rem] bg-white border border-ink/10 p-5 md:p-10">
      <ol className="grid grid-cols-4 gap-2 mb-8" aria-label={t("reg.progress")}>
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`rounded-2xl px-2 py-2.5 text-center ${i === step ? "bg-blue text-white" : i < step ? "bg-blue-soft text-blue-deep" : "bg-mist text-slate"}`}>
            <span className="num text-2xl block">{i < step ? "✓" : `0${i + 1}`}</span><span className="text-[10px] md:text-xs font-extrabold tracking-wider">{t(s)}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4">
          <Field label={t("reg.teamName")} htmlFor="teamName" error={errors.teamName?.message && t(errors.teamName.message)}><Input id="teamName" placeholder="TEAM …" aria-invalid={!!errors.teamName} {...register("teamName")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("reg.promotion")} htmlFor="promotionId" error={errors.promotionId?.message && t(errors.promotionId.message)}>
              <Select id="promotionId" aria-invalid={!!errors.promotionId} {...register("promotionId", { onChange: (e) => { const p = promotions.find((x) => x.id === e.target.value); if (p?.program) setValue("program", p.program); } })}>
                <option value="">{t("reg.select")}</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label={t("reg.program")} htmlFor="program" error={errors.program?.message && t(errors.program.message)}><Input id="program" aria-invalid={!!errors.program} {...register("program")} /></Field>
          </div>
          <div>
            <p className="text-sm font-bold mb-1.5">{t("reg.photo")} <span className="font-normal text-slate">({t("reg.photoHint")})</span></p>
            <label htmlFor="photo" className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink/25 p-4 cursor-pointer hover:border-blue">
              {preview /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={preview} alt={t("common.preview")} className="size-20 rounded-xl object-cover" /> : <span className="grid place-items-center size-20 rounded-xl bg-mist"><Camera aria-hidden /></span>}
              <span className="font-bold">{photo ? photo.name : t("reg.choosePhoto")}</span>
              <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      )}
      {step === 1 && <PlayerStep i={0} form={form} />}
      {step === 2 && <PlayerStep i={1} form={form} />}
      {step === 3 && (
        <div className="grid gap-4">
          <div className="rounded-2xl bg-paper p-4 text-sm font-semibold">{t("reg.review")}</div>
          <Checkbox id="acceptRules" label={<Link href="/rules" target="_blank" className="underline">{t("reg.acceptRules")}</Link>} error={errors.acceptRules?.message && t(errors.acceptRules.message)} {...register("acceptRules")} />
          <Checkbox id="imageRights" label={t("reg.imageRights")} error={errors.imageRights?.message && t(errors.imageRights.message)} {...register("imageRights")} />
          <Checkbox id="acceptConditions" label={<Link href="/privacy" target="_blank" className="underline">{t("reg.acceptConditions")}</Link>} error={errors.acceptConditions?.message && t(errors.acceptConditions.message)} {...register("acceptConditions")} />
          <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label></div>
          {serverError && <p role="alert" className="rounded-xl bg-danger text-white font-bold px-4 py-3">⚠ {serverError}</p>}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0 || pending}><ArrowLeft size={18} aria-hidden />{t("cta.back")}</Button>
        {step < 3 ? <Button type="button" onClick={next}>{t("cta.next")}<ArrowRight size={18} aria-hidden /></Button>
          : <Button type="submit" variant="lime" disabled={pending}>{pending ? t("reg.sending") : t("reg.submit")}</Button>}
      </div>
    </form>
  );
}
