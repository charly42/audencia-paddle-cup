"use client";
import { useState, useTransition } from "react";
import { deletePartnerAction, deleteScheduleItemAction, saveContentAction, savePartnerAction, saveScheduleItemAction, updateSettingsAction, createPracticeAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { RULE_KEYS, isTbc, type L, type RuleSection } from "@/lib/content";
import { useT, useLocale } from "@/lib/i18n/provider";
import type { EventSettings, Partner, ScheduleItem } from "@/lib/types";

const toLocal = (iso: string | null) => (iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).replace(" ", "T").slice(0, 16) : "");

/** Normalise une valeur stockée (ancienne chaîne simple ou { fr, en }) en { fr, en }. */
const asL = (v: unknown): L => {
  if (typeof v === "string") return { fr: v, en: "" };
  const o = (v ?? {}) as Record<string, unknown>;
  return { fr: typeof o.fr === "string" ? o.fr : "", en: typeof o.en === "string" ? o.en : "" };
};
type Block = { title: L; body: L };
const asBlock = (v: unknown): Block => { const o = (v ?? {}) as Record<string, unknown>; return { title: asL(o.title), body: asL(o.body) }; };

function useAct() {
  const [pending, start] = useTransition(); const { toast } = useToast(); const t = useT();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok = t("a.saved2")) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error ?? t("error.generic"), r.ok ? "ok" : "error"); });
  return { pending, run, t };
}
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="rounded-3xl bg-white border border-ink/10 p-6"><h2 className="display-md text-3xl mb-4">{title}</h2>{children}</section>;

/** Deux champs côte à côte : version française et version anglaise d'un même texte. */
function BiField({ id, label, value, onChange, multiline = false, placeholder }: { id: string; label: string; value: L; onChange: (v: L) => void; multiline?: boolean; placeholder?: string }) {
  const C = multiline ? Textarea : Input;
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="text-sm font-bold mb-1.5 sm:col-span-2">{label}</legend>
      {(["fr", "en"] as const).map((lang) => (
        <label key={lang} htmlFor={`${id}-${lang}`} className="grid gap-1">
          <span className="text-[11px] font-extrabold tracking-widest text-slate">{lang.toUpperCase()}</span>
          <C id={`${id}-${lang}`} lang={lang} placeholder={lang === "en" ? value.fr || placeholder : placeholder} value={value[lang]}
            onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange({ ...value, [lang]: e.target.value })} />
        </label>
      ))}
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: EventSettings }) {
  const [s, setS] = useState({ ...settings, eventDate: toLocal(settings.eventDate), registrationDeadline: toLocal(settings.registrationDeadline), ticketCapacity: settings.ticketCapacity ? String(settings.ticketCapacity) : "" });
  const { pending, run, t } = useAct();
  const txt = (k: "eventName" | "venue" | "headline" | "tagline" | "eventDate" | "registrationDeadline" | "ticketCapacity") => ({ value: s[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS((x) => ({ ...x, [k]: e.target.value })) });
  const b = (k: "registrationOpen" | "ticketingOpen" | "sponsorsEnabled" | "supportersAwardEnabled" | "predictionsEnabled" | "cheersEnabled" | "galleryEnabled" | "volunteersEnabled") => ({ checked: s[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS((x) => ({ ...x, [k]: e.target.checked })) });
  return (
    <Card title={t("a.ce.settings")}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); run(() => updateSettingsAction({ ...s, eventDate: s.eventDate || null, registrationDeadline: s.registrationDeadline || null, ticketCapacity: s.ticketCapacity ? Number(s.ticketCapacity) : null })); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("a.ce.eventName")} htmlFor="s-name"><Input id="s-name" {...txt("eventName")} /></Field>
          <Field label={t("a.ce.venue")} htmlFor="s-venue"><Input id="s-venue" {...txt("venue")} /></Field>
          <Field label={t("a.ce.headline")} htmlFor="s-head"><Input id="s-head" {...txt("headline")} /></Field>
          <Field label={t("a.ce.tagline")} htmlFor="s-tag"><Input id="s-tag" {...txt("tagline")} /></Field>
          <Field label={t("a.ce.date")} htmlFor="s-date" hint={t("a.ce.dateHint")}><Input id="s-date" type="datetime-local" {...txt("eventDate")} /></Field>
          <Field label={t("a.ce.deadline")} htmlFor="s-dl"><Input id="s-dl" type="datetime-local" {...txt("registrationDeadline")} /></Field>
          <Field label={t("a.ce.capacity")} htmlFor="s-cap" hint={t("a.ce.capacityHint")}><Input id="s-cap" type="number" min={1} {...txt("ticketCapacity")} /></Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox id="s-reg" label={t("a.ce.regOpen")} {...b("registrationOpen")} />
          <Checkbox id="s-tk" label={t("a.ce.tkOpen")} {...b("ticketingOpen")} />
          <Checkbox id="s-sp" label={t("a.ce.sponsors")} {...b("sponsorsEnabled")} />
          <Checkbox id="s-aw" label={t("a.ce.award")} {...b("supportersAwardEnabled")} />
        </div>
        <fieldset className="rounded-2xl bg-paper p-4 grid gap-2 sm:grid-cols-2">
          <legend className="text-xs font-extrabold tracking-widest text-slate px-2">{t("a.ce.modules")}</legend>
          <Checkbox id="s-pred" label={t("a.ce.mPred")} {...b("predictionsEnabled")} />
          <Checkbox id="s-cheer" label={t("a.ce.mCheer")} {...b("cheersEnabled")} />
          <Checkbox id="s-gal" label={t("a.ce.mGal")} {...b("galleryEnabled")} />
          <Checkbox id="s-vol" label={t("a.ce.mVol")} {...b("volunteersEnabled")} />
        </fieldset>
        <Button type="submit" disabled={pending} className="justify-self-start">{t("a.ce.saveSettings")}</Button>
      </form>
    </Card>
  );
}

/** Textes de l'accueil et de la page À propos, saisis en français ET en anglais. */
export function TextBlocksEditor({ content, defaults }: { content: Record<string, unknown>; defaults: Record<string, unknown> }) {
  const val = (k: string) => content[k] ?? defaults[k];
  const [v, setV] = useState({
    date: asL(val("home.date_placeholder")), notice: asL(val("home.important_message")),
    aboutTitle: asL(val("about.title")), aboutText: asL(val("about.text")),
    oneCampus: asBlock(val("home.one_campus")), thanks: asBlock(val("home.thank_you")),
    aftermovie: asBlock(val("home.aftermovie")), nextEd: asBlock(val("home.next_edition")),
  });
  const { pending, run, t } = useAct();
  const saveAll = () => run(async () => {
    const pairs: [string, unknown][] = [["home.date_placeholder", v.date], ["home.important_message", v.notice], ["about.title", v.aboutTitle], ["about.text", v.aboutText],
      ["home.one_campus", v.oneCampus], ["home.thank_you", v.thanks], ["home.aftermovie", v.aftermovie], ["home.next_edition", v.nextEd]];
    for (const [k, value] of pairs) { const r = await saveContentAction(k, value); if (!r.ok) return r; }
    return { ok: true };
  });
  const blk = (label: string, k: "oneCampus" | "thanks" | "aftermovie" | "nextEd") => (
    <div className="grid gap-3 rounded-2xl bg-paper p-4">
      <p className="text-xs font-extrabold tracking-widest text-slate">{label}</p>
      <BiField id={`${k}-t`} label={t("a.ce.title")} value={v[k].title} onChange={(title) => setV((x) => ({ ...x, [k]: { ...x[k], title } }))} />
      <BiField id={`${k}-b`} label={t("a.ce.body")} multiline value={v[k].body} onChange={(body) => setV((x) => ({ ...x, [k]: { ...x[k], body } }))} />
    </div>
  );
  return (
    <Card title={t("a.ce.texts")}>
      <p className="text-sm text-slate font-semibold -mt-2 mb-4">{t("a.ce.bilingual")}</p>
      <div className="grid gap-5">
        <BiField id="c-date" label={t("a.ce.datePh")} value={v.date} onChange={(date) => setV((x) => ({ ...x, date }))} />
        <BiField id="c-notice" label={t("a.ce.notice")} value={v.notice} onChange={(notice) => setV((x) => ({ ...x, notice }))} />
        {blk(t("a.ce.oneCampus"), "oneCampus")}{blk(t("a.ce.thanks"), "thanks")}{blk(t("a.ce.after"), "aftermovie")}{blk(t("a.ce.next"), "nextEd")}
        <BiField id="c-at" label={t("a.ce.aboutTitle")} value={v.aboutTitle} onChange={(aboutTitle) => setV((x) => ({ ...x, aboutTitle }))} />
        <BiField id="c-atx" label={t("a.ce.aboutText")} multiline value={v.aboutText} onChange={(aboutText) => setV((x) => ({ ...x, aboutText }))} />
        <Button onClick={saveAll} disabled={pending} className="justify-self-start">{t("a.ce.saveContent")}</Button>
      </div>
    </Card>
  );
}

/** Règlement : dix sections, chacune en français et en anglais. */
export function RulesEditor({ content, defaults }: { content: Record<string, unknown>; defaults: Record<string, unknown> }) {
  const locale = useLocale();
  const [rules, setRules] = useState<Record<string, { title: L; body: L }>>(Object.fromEntries(RULE_KEYS.map(([k, title]) => {
    const r = (content[`rules.${k}`] ?? defaults[`rules.${k}`]) as RuleSection;
    const tl = asL(r.title);
    return [k, { title: tl.fr ? tl : title, body: asL(r.body) }];
  })));
  const { pending, run, t } = useAct();
  return (
    <Card title={t("a.ce.rules")}>
      <p className="text-sm text-slate font-semibold -mt-2 mb-4">{t("a.ce.tbcHint")}</p>
      <div className="grid gap-4">
        {RULE_KEYS.map(([k, label]) => {
          const name = label[locale];
          return (
            <div key={k} className="rounded-2xl bg-paper p-4 grid gap-3">
              <p className="text-xs font-extrabold tracking-widest text-slate">{name}</p>
              <BiField id={`r-${k}`} label={t("a.ce.body")} multiline value={rules[k].body}
                onChange={(body) => setRules((r) => ({ ...r, [k]: { ...r[k], body } }))} />
              <Button variant="dark" className="justify-self-start !py-2 !min-h-10 !text-xs" disabled={pending}
                onClick={() => run(() => saveContentAction(`rules.${k}`, { ...rules[k], tbc: isTbc(rules[k].body) }), t("a.ce.sectionSaved", { s: name }))}>{t("a.ce.saveSection")}</Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PartnersEditor({ partners }: { partners: Partner[] }) {
  const { pending, run, t } = useAct();
  const [n, setN] = useState({ name: "", website: "", tier: "partner" as Partner["tier"], logoUrl: "", description: "" });
  const tierLabel = { main: t("a.ce.tierMain"), partner: t("a.ce.tierPartner"), supporter: t("a.ce.tierSupporter") };
  return (
    <Card title={t("a.ce.partners")}>
      <ul className="divide-y divide-ink/10 mb-4">{partners.map((p) => (
        <li key={p.id} className="py-3 flex items-center justify-between gap-3"><span className="font-extrabold">{p.name} <span className="text-xs text-slate">({tierLabel[p.tier]})</span></span>
          <Button variant="ghost" className="!py-2 !min-h-10 !text-xs" disabled={pending} onClick={() => run(() => deletePartnerAction(p.id), t("a.ce.partnerDeleted"))}>{t("a.ce.delete")}</Button></li>))}</ul>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => savePartnerAction({ name: n.name, website: n.website || null, tier: n.tier, logoUrl: n.logoUrl || null, description: n.description || null, sortOrder: partners.length + 1, active: true }), t("a.ce.partnerAdded")); setN({ name: "", website: "", tier: "partner", logoUrl: "", description: "" }); }}>
        <Field label={t("a.ce.name")} htmlFor="p-n"><Input id="p-n" required value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></Field>
        <Field label={t("a.ce.tier")} htmlFor="p-t"><Select id="p-t" value={n.tier} onChange={(e) => setN({ ...n, tier: e.target.value as Partner["tier"] })}><option value="main">{tierLabel.main}</option><option value="partner">{tierLabel.partner}</option><option value="supporter">{tierLabel.supporter}</option></Select></Field>
        <Field label={t("a.ce.website")} htmlFor="p-w"><Input id="p-w" value={n.website} onChange={(e) => setN({ ...n, website: e.target.value })} /></Field>
        <Field label={t("a.ce.logo")} htmlFor="p-l"><Input id="p-l" value={n.logoUrl} onChange={(e) => setN({ ...n, logoUrl: e.target.value })} /></Field>
        <Button type="submit" disabled={pending} className="justify-self-start">{t("a.ce.addPartner")}</Button>
      </form>
    </Card>
  );
}

export function ScheduleEditor({ items }: { items: ScheduleItem[] }) {
  const { pending, run, t } = useAct();
  const [n, setN] = useState({ startTime: "", title: "", description: "" });
  return (
    <Card title={t("a.ce.timeline")}>
      <ul className="divide-y divide-ink/10 mb-4">{items.map((i) => (
        <li key={i.id} className="py-2.5 flex items-center justify-between gap-3"><span className="font-extrabold"><span className="num text-2xl mr-3">{i.startTime.slice(0, 5)}</span>{i.title}</span>
          <Button variant="ghost" className="!py-2 !min-h-10 !text-xs" disabled={pending} onClick={() => run(() => deleteScheduleItemAction(i.id), t("a.ce.slotDeleted"))}>{t("a.ce.delete")}</Button></li>))}</ul>
      <form className="grid gap-3 sm:grid-cols-[8rem_1fr_1fr_auto] items-end" onSubmit={(e) => { e.preventDefault(); run(() => saveScheduleItemAction({ startTime: n.startTime, title: n.title, description: n.description || null, sortOrder: items.length + 1 }), t("a.ce.slotAdded")); setN({ startTime: "", title: "", description: "" }); }}>
        <Field label={t("a.ce.time")} htmlFor="sc-t"><Input id="sc-t" type="time" required value={n.startTime} onChange={(e) => setN({ ...n, startTime: e.target.value })} /></Field>
        <Field label={t("a.ce.title")} htmlFor="sc-n"><Input id="sc-n" required value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} /></Field>
        <Field label={t("a.ce.desc")} htmlFor="sc-d"><Input id="sc-d" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} /></Field>
        <Button type="submit" disabled={pending}>{t("a.ce.add")}</Button>
      </form>
    </Card>
  );
}

export function PracticeCreator() {
  const { pending, run, t } = useAct();
  const [f, setF] = useState({ date: "", startTime: "18:00", durationMin: "90", courtsCount: "2", capacity: "8", coach: false, level: "all" });
  return (
    <Card title={t("a.ce.newPractice")}>
      <form className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 items-end" onSubmit={(e) => { e.preventDefault(); run(() => createPracticeAction({ date: f.date, startTime: f.startTime, durationMin: +f.durationMin, courtsCount: +f.courtsCount, capacity: +f.capacity, coach: f.coach, level: f.level }), t("a.ce.practiceCreated")); }}>
        <Field label={t("a.ce.pDate")} htmlFor="pr-d"><Input id="pr-d" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label={t("a.ce.pStart")} htmlFor="pr-s"><Input id="pr-s" type="time" required value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></Field>
        <Field label={t("a.ce.pDuration")} htmlFor="pr-du"><Input id="pr-du" type="number" min={15} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} /></Field>
        <Field label={t("a.ce.pCourts")} htmlFor="pr-c"><Input id="pr-c" type="number" min={1} max={8} value={f.courtsCount} onChange={(e) => setF({ ...f, courtsCount: e.target.value })} /></Field>
        <Field label={t("a.ce.pCapacity")} htmlFor="pr-ca"><Input id="pr-ca" type="number" min={2} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
        <Field label={t("a.ce.pLevel")} htmlFor="pr-l"><Select id="pr-l" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
          <option value="all">{t("levelAll")}</option><option value="beginner">{t("level.beginner")}</option><option value="intermediate">{t("level.intermediate")}</option><option value="advanced">{t("level.advanced")}</option></Select></Field>
        <Checkbox id="pr-co" label={t("a.ce.pCoach")} checked={f.coach} onChange={(e) => setF({ ...f, coach: e.target.checked })} />
        <Button type="submit" disabled={pending}>{t("a.ce.create")}</Button>
      </form>
    </Card>
  );
}
