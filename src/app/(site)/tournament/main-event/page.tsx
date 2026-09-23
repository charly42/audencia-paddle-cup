import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { LiveBracket } from "@/components/sport/BracketView";
import { LiveGlobalScore } from "@/components/sport/GlobalScore";
import { CourtsView, LiveNow } from "@/components/sport/LiveWidgets";
import { LiveMatchList } from "@/components/sport/LiveMatchList";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.mainEvent"), description: t("me.sub") };
}

export default async function MainEventPage() {
  const [matches, settings, courts, { t }] = await Promise.all([repo.listMatches(), repo.getSettings(), repo.listCourts(), i18n()]);
  const NAV = [["global", t("me.global")], ["live", t("me.live")], ["student-cup", t("me.studentCup")], ["staff-cup", t("me.staffCup")], ["courts", t("live.courts")], ["matches", t("me.allMatches")]];
  const h2 = "display text-5xl md:text-7xl mb-5 scroll-mt-32";
  return (
    <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
      <PageHero eyebrow={t("me.eyebrow")} title={t("nav.mainEvent")} subtitle={t("me.sub")} />
      <nav aria-label={t("me.sections")} className="sticky top-16 z-40 bg-paper/95 backdrop-blur border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-5 flex gap-2 overflow-x-auto no-scrollbar py-2.5">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-4 py-2 text-xs font-extrabold tracking-wider bg-white border border-ink/15 hover:border-blue min-h-10 inline-flex items-center">{label}</a>)}
        </div>
      </nav>
      <Container className="py-10 md:py-14 space-y-16">
        <section id="global" className="scroll-mt-32"><LiveGlobalScore /></section>
        <section id="live" className="scroll-mt-32"><LiveNow compact /></section>
        <section id="student-cup" className="scroll-mt-32"><h2 className={h2}>{t("me.studentPadelCup")}</h2><LiveBracket tournament="main-event" /></section>
        <section id="staff-cup" className="scroll-mt-32"><h2 className={h2}>{t("me.staffCup")}</h2><LiveBracket tournament="staff-vs-students" kind="staff" /></section>
        <section id="courts" className="scroll-mt-32"><h2 className={h2}>{t("live.courts")}</h2><CourtsView courts={courts} /></section>
        <section id="matches" className="scroll-mt-32"><h2 className={h2}>{t("me.allMatches")}</h2><LiveMatchList tournaments={["main-event", "staff-vs-students"]} courts={courts} /></section>
      </Container>
    </LiveProvider>
  );
}
