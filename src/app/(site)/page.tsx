import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { repo } from "@/lib/repo";
import { DEFAULT_CONTENT } from "@/lib/content";
import { computeGlobalScore } from "@/lib/global-score";
import { Hero } from "@/components/site/Hero";
import { LinkButton } from "@/components/ui/Button";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { CourtsView, LatestResults, LiveNow, NextMatches } from "@/components/sport/LiveWidgets";
import { GlobalScoreView, LiveGlobalScore } from "@/components/sport/GlobalScore";
import { PartnerCard, StatCard, TeamCard } from "@/components/sport/Cards";
import { PracticeCard } from "@/components/sport/Practice";
import { Confetti } from "@/components/sport/Confetti";
import { MatchCard } from "@/components/sport/MatchCards";
import { EmptyState } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";
import { i18n, pickBlock, pickLang } from "@/lib/i18n";


export default async function HomePage() {
  const [settings, content, teams, matches, courts, practice, partners, { t, locale }] = await Promise.all([
    repo.getSettings(), repo.getContent(), repo.listTeams(), repo.listMatches(), repo.listCourts(), repo.listPractice(), repo.listPartners(), i18n(),
  ]);
  // Contenus éditoriaux bilingues : valeur saisie en admin, sinon défaut de lib/content.
  const block = (k: string) => pickBlock(content[k] ?? DEFAULT_CONTENT[k], locale);
  const datePlaceholder = pickLang(content["home.date_placeholder"] ?? DEFAULT_CONTENT["home.date_placeholder"], locale) || t("date.tbc");
  const notice = pickLang(content["home.important_message"], locale);
  const oneCampus = block("home.one_campus");
  const students = teams.filter((t) => t.kind === "student");
  const qualified = students.filter((t) => ["qualified", "semi_finalist", "finalist", "champion"].includes(t.status));

  const NoticeBar = notice ? <div className="bg-ink text-white text-center text-sm font-bold px-4 py-3"><span className="text-lime">{t("home.important")} · </span>{notice}</div> : null;

  // ────────── LIVE ──────────
  if (settings.eventMode === "live") {
    return (
      <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
        {NoticeBar}
        <section className="on-dark bg-blue text-white court-lines">
          <div className="max-w-7xl mx-auto px-5 py-8 md:py-12">
            <LiveGlobalScore />
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-14 space-y-14">
          <LiveNow />
          <NextMatches />
          <LatestResults />
          <section>
            <div className="flex items-end justify-between gap-4 mb-4"><h2 className="display text-4xl md:text-6xl">{t("live.courts")}</h2><Link href="/tournament/main-event" className="font-extrabold underline underline-offset-4 inline-flex items-center gap-1">{t("live.fullBracket")} <ArrowRight size={16} aria-hidden /></Link></div>
            <CourtsView courts={courts} />
          </section>
        </div>
      </LiveProvider>
    );
  }

  // ────────── POST-EVENT ──────────
  if (settings.eventMode === "post_event") {
    const score = computeGlobalScore(matches);
    const champion = students.find((t) => t.status === "champion");
    const verdict = score.students === score.staff ? t("home.draw") : score.students > score.staff ? t("home.studentsWin") : t("home.staffWin");
    const thanks = block("home.thank_you"), after = block("home.aftermovie"), nextEd = block("home.next_edition");
    return (
      <>
        <Confetti />
        <section className="on-dark bg-blue text-white court-lines">
          <div className="max-w-7xl mx-auto px-5 py-14 md:py-20">
            <p className="text-xs md:text-sm font-extrabold tracking-[.3em] text-lime">{settings.eventName} · {t("home.finalResult")}</p>
            <h1 className="display text-[5rem] sm:text-[8rem] md:text-[13rem] mt-3">{verdict}</h1>
            {champion && <p className="display-md text-3xl md:text-5xl mt-4 text-lime">{t("home.champions")} — {champion.name}</p>}
            <div className="mt-8"><GlobalScoreView score={score} dark={false} /></div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-5 py-14 space-y-14">
          <section><h2 className="display text-5xl md:text-7xl mb-4">{t("home.finalResults")}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{matches.filter((m) => m.status === "final").slice(-8).map((m) => <MatchCard key={m.id} match={m} />)}</div></section>
          <div className="grid gap-5 md:grid-cols-3">
            {[thanks, after, nextEd].map((b) => <article key={b.title} className="rounded-3xl bg-white border border-ink/10 p-7"><h2 className="display text-5xl">{b.title}</h2><p className="mt-3 text-slate font-semibold">{b.body}</p></article>)}
          </div>
        </div>
      </>
    );
  }

  // ────────── PRE-EVENT ──────────
  const nextPractice = practice.filter((s) => s.status === "open").slice(0, 3);
  const steps = [1, 2, 3, 4].map((n) => [`0${n}`, t(`home.step${n}.t`), t(`home.step${n}.d`)]);
  return (
    <>
      {NoticeBar}
      <Hero settings={settings} datePlaceholder={datePlaceholder} />

      <section className="bg-lime text-ink overflow-hidden" aria-hidden>
        <div className="flex whitespace-nowrap animate-ticker w-max py-3">
          {Array.from({ length: 2 }).map((_, k) => <span key={k} className="display text-3xl md:text-5xl px-6">{"QUALIFY · REPRESENT · PLAY · CHALLENGE · ".repeat(4)}</span>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-16 md:py-24">
        <h2 className="display text-6xl md:text-9xl">{t("home.roadTitle1")}<br />{t("home.roadTitle2")}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <li key={n} className="rounded-3xl bg-white border border-ink/10 p-6 relative overflow-hidden">
              <span className="num text-8xl text-blue/15 absolute -right-1 -top-1" aria-hidden>{n}</span>
              <h3 className="display text-5xl text-blue relative">{t}</h3>
              <p className="mt-3 font-semibold text-slate relative">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="on-dark bg-ink text-white">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div><h2 className="display text-6xl md:text-8xl text-lime">{oneCampus.title}</h2></div>
          <div><p className="text-lg md:text-xl font-semibold text-white/85">{oneCampus.body}</p><LinkButton href="/about" variant="outline-light" className="mt-6">{t("home.aboutCta")}</LinkButton></div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-16 md:py-24">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard label={t("home.stat.teams")} value={students.length} tone="blue" />
          <StatCard label={t("home.stat.qualified")} value={qualified.length} tone="lime" />
          <StatCard label={t("home.stat.promos")} value={new Set(students.map((t) => t.promotionName).filter(Boolean)).size} />
          <StatCard label={t("home.stat.practice")} value={nextPractice.length} tone="ink" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-16 md:pb-24">
        <div className="flex items-end justify-between gap-4 mb-6"><h2 className="display text-5xl md:text-7xl">{qualified.length ? t("home.qualifiedTeams") : t("nav.teams")}</h2><Link href="/teams" className="font-extrabold underline underline-offset-4 inline-flex items-center gap-1 shrink-0">{t("cta.viewAll")} <ArrowRight size={16} aria-hidden /></Link></div>
        {(qualified.length ? qualified : students).length
          ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(qualified.length ? qualified : students).slice(0, 6).map((t) => <TeamCard key={t.id} team={t} />)}</div>
          : <EmptyState title={t("home.firstTeam")} body={t("home.firstTeamBody")} action={<LinkButton href="/register">{t("cta.register")}</LinkButton>} />}
      </section>

      {nextPractice.length > 0 && (
        <section className="bg-blue-soft">
          <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
            <div className="flex items-end justify-between gap-4 mb-6"><h2 className="display text-5xl md:text-7xl">{t("pr.title")}</h2><Link href="/tournament/practice" className="font-extrabold underline underline-offset-4 inline-flex items-center gap-1 shrink-0">{t("cta.viewAll")} <ArrowRight size={16} aria-hidden /></Link></div>
            <div className="grid gap-5 md:grid-cols-3">{nextPractice.map((s) => <PracticeCard key={s.id} session={s} loggedIn={false} />)}</div>
            <p className="mt-4 text-sm font-semibold text-slate">{t("home.practiceNote", { date: formatDate(nextPractice[0].date + "T12:00:00", undefined, locale) })}</p>
          </div>
        </section>
      )}

      {settings.sponsorsEnabled && partners.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-16"><h2 className="display text-4xl md:text-6xl mb-6">{t("home.partners")}</h2><div className="grid gap-4 grid-cols-2 md:grid-cols-4">{partners.map((p) => <PartnerCard key={p.id} partner={p} />)}</div></section>
      )}

      <section className="on-dark bg-blue text-white court-lines">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 text-center">
          <p className="display text-6xl md:text-9xl">{t("home.cta1")}<br /><span className="text-lime">{t("home.cta2")}</span></p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center"><LinkButton href="/register" variant="lime">{t("cta.register")}</LinkButton><LinkButton href="/tickets" variant="outline-light">{t("cta.tickets")}</LinkButton></div>
        </div>
      </section>
    </>
  );
}
