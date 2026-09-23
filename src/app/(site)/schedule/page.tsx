import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { TimelineItem } from "@/components/sport/Cards";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { LiveMatchList } from "@/components/sport/LiveMatchList";
import { EmptyState } from "@/components/ui/Skeleton";
import { hhmm } from "@/lib/format";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.schedule"), description: t("sch.sub") };
}

export default async function SchedulePage() {
  const [items, matches, courts, settings, { t }] = await Promise.all([repo.listSchedule(), repo.listMatches(), repo.listCourts(), repo.getSettings(), i18n()]);
  return (
    <>
      <PageHero eyebrow={t("sch.eyebrow")} title={t("nav.schedule")} subtitle={t("sch.sub")} />
      <Container className="py-10 md:py-14 space-y-16">
        <section aria-label={t("sch.timeline")}>
          {items.length ? <ol>{items.map((i, idx) => <TimelineItem key={i.id} time={hhmm(i.startTime)} title={i.title} description={i.description} highlight={i.title.includes("STAFF vs")} last={idx === items.length - 1} />)}</ol>
            : <EmptyState title={t("sch.soon")} body={t("sch.soonBody")} />}
        </section>
        <section aria-label={t("sch.matches")}>
          <h2 className="display text-5xl md:text-7xl mb-5">{t("sch.matches")}</h2>
          <LiveProvider initialMatches={matches} initialMode={settings.eventMode}><LiveMatchList tournaments={["main-event", "staff-vs-students", "qualifiers"]} courts={courts} /></LiveProvider>
        </section>
      </Container>
    </>
  );
}
