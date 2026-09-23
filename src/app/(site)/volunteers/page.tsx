import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { i18n } from "@/lib/i18n";
import { PageHero, Container } from "@/components/site/PageHero";
import { EmptyState } from "@/components/ui/Skeleton";
import { VolunteerSignup } from "@/components/site/VolunteerSignup";
import { formatDate, formatTime } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("volunteers.title"), description: t("volunteers.sub"), robots: { index: false } };
}

export default async function VolunteersPage() {
  const [settings, { t, locale }] = await Promise.all([repo.getSettings(), i18n()]);
  if (!settings.volunteersEnabled) notFound();
  const shifts = await repo.listShifts();
  return (
    <>
      <PageHero eyebrow={t("volunteers.eyebrow")} title={t("volunteers.title")} subtitle={t("volunteers.sub")} />
      <Container className="py-10 md:py-14">
        {shifts.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shifts.map((s) => {
              const full = s.assigned.length >= s.capacity;
              return (
                <li key={s.id} className="rounded-3xl bg-white border border-ink/10 p-5">
                  <p className="display-md text-2xl">{t(`role.${s.role}`) === `role.${s.role}` ? s.role : t(`role.${s.role}`)}</p>
                  <p className="mt-1 font-bold"><span className="num text-2xl mr-2">{formatTime(s.startsAt)}–{formatTime(s.endsAt)}</span>{formatDate(s.startsAt, { day: "numeric", month: "short" }, locale)}</p>
                  {s.courtName && <p className="text-sm text-slate font-semibold">◉ {s.courtName}</p>}
                  {s.notes && <p className="text-sm text-slate mt-1">{s.notes}</p>}
                  <p className="mt-3 text-xs font-extrabold tracking-wider">{s.assigned.length}/{s.capacity} {t("volunteers.slots")}</p>
                  {s.assigned.length > 0 && <p className="text-xs text-slate font-semibold mt-1">{s.assigned.map((a) => a.name).join(" · ")}</p>}
                  <div className="mt-4">
                    {full ? <p className="font-extrabold text-danger">{t("volunteers.full")}</p> : <VolunteerSignup shiftId={s.id} label={t("cta.save")} />}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title={t("volunteers.title")} body={t("volunteers.empty")} />}
      </Container>
    </>
  );
}
