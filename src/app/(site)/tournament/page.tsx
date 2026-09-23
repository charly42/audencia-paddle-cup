import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero, Container } from "@/components/site/PageHero";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.tournament"), description: t("tour.sub") };
}
export default async function TournamentHub() {
  const { t } = await i18n();
  const CARDS = [
    { href: "/tournament/qualifiers", n: "01", title: t("nav.qualifiers"), body: t("tour.q.body"), tone: "bg-white" },
    { href: "/tournament/main-event", n: "02", title: t("nav.mainEvent"), body: t("tour.m.body"), tone: "bg-blue text-white on-dark" },
    { href: "/tournament/practice", n: "03", title: t("pr.title"), body: t("tour.p.body"), tone: "bg-lime" },
  ];
  return (
    <>
      <PageHero eyebrow={t("tour.eyebrow")} title={t("nav.tournament")} subtitle={t("tour.sub")} />
      <Container className="py-12 grid gap-5 md:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className={`group rounded-[2rem] border border-ink/10 p-7 min-h-72 flex flex-col justify-between transition-transform hover:-translate-y-1 ${c.tone}`}>
            <span className="num text-7xl opacity-30">{c.n}</span>
            <div><h2 className="display text-5xl md:text-6xl">{c.title}</h2><p className="mt-2 font-semibold opacity-80">{c.body}</p><ArrowUpRight className="mt-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" aria-hidden /></div>
          </Link>
        ))}
      </Container>
    </>
  );
}
