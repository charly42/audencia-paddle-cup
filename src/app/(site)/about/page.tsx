import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { DEFAULT_CONTENT } from "@/lib/content";
import { PageHero, Container } from "@/components/site/PageHero";
import { PartnerCard } from "@/components/sport/Cards";
import { i18n, pickBlock, pickLang } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.about") };
}

export default async function AboutPage() {
  const [content, partners, { t, locale }] = await Promise.all([repo.getContent(), repo.listPartners(), i18n()]);
  const title = pickLang(content["about.title"] ?? DEFAULT_CONTENT["about.title"], locale);
  const text = pickLang(content["about.text"] ?? DEFAULT_CONTENT["about.text"], locale);
  const pillars = ((content["about.pillars"] ?? DEFAULT_CONTENT["about.pillars"]) as unknown[]).map((p) => pickBlock(p, locale));
  return (
    <>
      <PageHero eyebrow={t("about.eyebrow")} title={title} subtitle={text} />
      <Container className="py-12 md:py-16 space-y-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => <article key={p.title} className="rounded-3xl bg-white border border-ink/10 p-6"><span className="num text-6xl text-blue/20">0{i + 1}</span><h2 className="display text-4xl text-blue">{p.title}</h2><p className="mt-2 font-semibold text-slate">{p.body}</p></article>)}
        </div>
        <section><h2 className="display text-5xl md:text-6xl mb-5">{t("about.hosts")}</h2><div className="grid gap-4 sm:grid-cols-2">{partners.map((p) => <PartnerCard key={p.id} partner={p} />)}</div></section>
      </Container>
    </>
  );
}
