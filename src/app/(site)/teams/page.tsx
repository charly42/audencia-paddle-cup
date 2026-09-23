import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { TeamCard } from "@/components/sport/Cards";
import { EmptyState } from "@/components/ui/Skeleton";
import { Button, LinkButton } from "@/components/ui/Button";
import type { TeamStatus } from "@/lib/types";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.teams"), description: t("teams.sub") };
}
const sel = "rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5 text-sm font-bold min-h-11";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ promotion?: string; status?: string; kind?: string; q?: string }> }) {
  const sp = await searchParams;
  const { t } = await i18n();
  const [promotions, teams] = await Promise.all([
    repo.listPromotions(),
    repo.listTeams({ promotionId: sp.promotion || undefined, status: (sp.status as TeamStatus) || undefined, kind: sp.kind === "staff" ? "staff" : sp.kind === "student" ? "student" : undefined, q: sp.q || undefined }),
  ]);
  return (
    <>
      <PageHero eyebrow={t("teams.eyebrow")} title={t("nav.teams")} subtitle={t("teams.sub")} />
      <Container className="py-10">
        <form method="get" className="flex flex-wrap gap-2 mb-8" role="search" aria-label={t("teams.filterAria")}>
          <input name="q" defaultValue={sp.q} placeholder={t("teams.search")} aria-label={t("teams.search")} className={`${sel} min-w-48 flex-1 sm:flex-none`} />
          <select name="promotion" defaultValue={sp.promotion ?? ""} aria-label={t("reg.promotion")} className={sel}><option value="">{t("teams.allPromos")}</option>{promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select name="status" defaultValue={sp.status ?? ""} aria-label={t("filter.status")} className={sel}><option value="">{t("teams.allStatus")}</option>{["registered", "qualified", "semi_finalist", "finalist", "champion", "eliminated"].map((k) => <option key={k} value={k}>{t(`tstatus.${k}`)}</option>)}</select>
          <select name="kind" defaultValue={sp.kind ?? ""} aria-label={t("teams.allKinds")} className={sel}><option value="">{t("teams.allKinds")}</option><option value="student">{t("teams.students")}</option><option value="staff">{t("teams.staff")}</option></select>
          <Button type="submit" variant="dark" className="!py-2.5 !min-h-11">{t("teams.filter")}</Button>
        </form>
        {teams.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{teams.map((t) => <TeamCard key={t.id} team={t} />)}</div>
          : <EmptyState title={t("teams.none")} body={t("teams.noneBody")} action={<LinkButton href="/register">{t("cta.register")}</LinkButton>} />}
      </Container>
    </>
  );
}
