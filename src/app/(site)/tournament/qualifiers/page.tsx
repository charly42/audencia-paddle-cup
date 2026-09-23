import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { LiveBracket } from "@/components/sport/BracketView";
import { cn } from "@/lib/utils";
import { i18n, pickLang } from "@/lib/i18n";
import { DEFAULT_CONTENT } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.qualifiers"), description: t("q.sub") };
}

export default async function QualifiersPage({ searchParams }: { searchParams: Promise<{ promotion?: string }> }) {
  const { promotion } = await searchParams;
  const [promotions, matches, settings, content, { t, locale }] = await Promise.all([repo.listPromotions(), repo.listMatches(), repo.getSettings(), repo.getContent(), i18n()]);
  const rule = pickLang(((content["rules.pingpong"] ?? DEFAULT_CONTENT["rules.pingpong"]) as { body?: unknown }).body, locale) || t("tbc");
  const chip = (active: boolean) => cn("rounded-full px-4 py-2.5 text-sm font-extrabold tracking-wider border-2 min-h-11 inline-flex items-center", active ? "bg-blue border-blue text-white" : "border-ink/20 bg-white hover:border-blue");
  return (
    <>
      <PageHero eyebrow={t("q.eyebrow")} title={t("nav.qualifiers")} subtitle={t("q.sub")} />
      <Container className="py-10 md:py-14 space-y-8">
        <div className="flex flex-wrap gap-2" role="navigation" aria-label={t("q.promosAria")}>
          <Link href="/tournament/qualifiers" className={chip(!promotion)} aria-current={!promotion ? "page" : undefined}>{t("q.all")}</Link>
          {promotions.map((p) => <Link key={p.id} href={`/tournament/qualifiers?promotion=${p.id}`} className={chip(promotion === p.id)} aria-current={promotion === p.id ? "page" : undefined}>{p.name}</Link>)}
        </div>
        <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
          <LiveBracket tournament="qualifiers" promotionId={promotion} qualifiers />
        </LiveProvider>
        <section className="rounded-3xl bg-white border border-ink/10 p-6"><h2 className="display-md text-3xl">{t("q.format")}</h2><p className="mt-2 text-slate font-semibold">{rule}</p></section>
      </Container>
    </>
  );
}
