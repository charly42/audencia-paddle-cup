import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { TeamAvatar } from "@/components/sport/primitives";
import { EmptyState } from "@/components/ui/Skeleton";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.supporters"), description: t("sup.sub") };
}

export default async function SupportersPage() {
  const [teams, settings, { t }] = await Promise.all([repo.listTeams({ kind: "student" }), repo.getSettings(), i18n()]);
  const ranked = [...teams].sort((a, b) => b.supportersCount - a.supportersCount).filter((t) => t.supportersCount > 0);
  const byPromo = new Map<string, number>();
  teams.forEach((t) => t.promotionName && byPromo.set(t.promotionName, (byPromo.get(t.promotionName) ?? 0) + t.supportersCount));
  const promos = [...byPromo.entries()].sort((a, b) => b[1] - a[1]).filter(([, n]) => n > 0);
  return (
    <>
      <PageHero eyebrow={settings.supportersAwardEnabled ? t("sup.award") : t("sup.eyebrow")} title={t("nav.supporters")} subtitle={t("sup.sub")} />
      <Container className="py-10 md:py-14 grid gap-10 lg:grid-cols-2">
        <section><h2 className="display text-5xl mb-5">{t("sup.byTeam")}</h2>
          {ranked.length ? <ol className="space-y-2">{ranked.map((t, i) => (
            <li key={t.id}><Link href={`/team/${t.slug}`} className="flex items-center gap-4 rounded-2xl bg-white border border-ink/10 px-4 py-3 hover:border-blue min-h-16">
              <span className="num text-4xl w-10 text-blue">{i + 1}</span><TeamAvatar name={t.name} photoUrl={t.photoUrl} size={40} /><span className="flex-1 font-extrabold truncate">{t.name}</span><span className="num text-4xl">{t.supportersCount}</span></Link></li>))}</ol>
            : <EmptyState title={t("sup.none")} body={t("sup.noneBody")} />}
        </section>
        <section><h2 className="display text-5xl mb-5">{t("sup.byPromo")}</h2>
          {promos.length ? <ol className="space-y-2">{promos.map(([name, n], i) => <li key={name} className="flex items-center gap-4 rounded-2xl bg-white border border-ink/10 px-4 py-3 min-h-16"><span className="num text-4xl w-10 text-blue">{i + 1}</span><span className="flex-1 font-extrabold">{name}</span><span className="num text-4xl">{n}</span></li>)}</ol>
            : <EmptyState title={t("sup.noData")} />}
        </section>
      </Container>
    </>
  );
}
