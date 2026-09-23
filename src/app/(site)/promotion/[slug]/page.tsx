import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { TeamCard, StatCard } from "@/components/sport/Cards";
import { MatchCard } from "@/components/sport/MatchCards";
import { EmptyState } from "@/components/ui/Skeleton";
import { LinkButton } from "@/components/ui/Button";
import { i18n } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await repo.listPromotions()).find((x) => x.slug === slug);
  return { title: p ? p.name : "404" };
}

export default async function PromotionPage({ params }: Props) {
  const { slug } = await params;
  const promo = (await repo.listPromotions()).find((x) => x.slug === slug);
  if (!promo) notFound();
  const [teams, matches, { t }] = await Promise.all([repo.listTeams({ promotionId: promo.id }), repo.listMatches({ promotionId: promo.id }), i18n()]);
  const supporters = teams.reduce((a, t) => a + t.supportersCount, 0);
  return (
    <>
      <PageHero eyebrow={t("promo.eyebrow")} title={promo.name} subtitle={promo.program ?? undefined} />
      <Container className="py-10 md:py-14 space-y-12">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3"><StatCard label={t("promo.teams")} value={teams.length} tone="blue" /><StatCard label={t("support.title")} value={supporters} tone="lime" /><StatCard label={t("promo.qualifierMatches")} value={matches.length} /></div>
        <section><h2 className="display text-5xl mb-5">{t("promo.teams")}</h2>{teams.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{teams.map((t) => <TeamCard key={t.id} team={t} />)}</div> : <EmptyState title={t("promo.noTeam")} action={<LinkButton href="/register">{t("cta.register")}</LinkButton>} />}</section>
        {matches.length > 0 && <section><h2 className="display text-5xl mb-5">{t("promo.qualifiers")}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{matches.map((m) => <MatchCard key={m.id} match={m} />)}</div></section>}
      </Container>
    </>
  );
}
