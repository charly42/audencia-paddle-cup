import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, LogOut } from "lucide-react";
import { requirePlayer } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { buildJourney } from "@/lib/journey";
import { logoutAction } from "@/lib/actions/auth";
import { formatTime, hhmm, roundText, shortDay, weekday } from "@/lib/format";
import { i18n } from "@/lib/i18n";
import { isAdminRole } from "@/lib/permissions";
import { Container } from "@/components/site/PageHero";
import { NotificationList } from "@/components/site/NotificationList";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { TeamLiveStrip } from "@/components/sport/LiveWidgets";
import { MatchCard } from "@/components/sport/MatchCards";
import { JourneyTimeline } from "@/components/sport/Journey";
import { ShareTeam } from "@/components/sport/Engagement";
import { CopyButton } from "@/components/sport/Engagement";
import { TeamStatusBadge } from "@/components/ui/Badge";
import { LinkButton, Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Player space", robots: { index: false } };

export default async function PlayerPage() {
  const { profile, player, team } = await requirePlayer();
  const [matches, settings, notifications, practice, { t, locale }] = await Promise.all([
    repo.listMatches(), repo.getSettings(), repo.listNotifications(profile.id), repo.listPractice(), i18n(),
  ]);
  const mine = team ? matches.filter((m) => m.teamA?.id === team.id || m.teamB?.id === team.id) : [];
  const next = mine.filter((m) => ["upcoming", "check_in", "warm_up"].includes(m.status)).sort((a, b) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9"))[0];
  const results = mine.filter((m) => m.status === "final");
  const regs = team ? await repo.listPracticeForTeam(team.id) : [];
  const myPractice = regs.map((r) => ({ r, s: practice.find((p) => p.id === r.sessionId) })).filter((x) => x.s);
  const opponent = next && team ? (next.teamA?.id === team.id ? next.teamB : next.teamA) : null;

  return (
    <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
      <section className="on-dark bg-blue text-white court-lines">
        <Container className="py-10 md:py-14">
          <p className="text-xs font-extrabold tracking-[.3em] text-lime">{t("nav.playerSpace")}</p>
          <h1 className="display text-6xl md:text-9xl mt-2">{t("pl.hello", { name: (player?.firstName ?? profile.firstName ?? "").toUpperCase() })}</h1>
          {team && <p className="mt-3 flex flex-wrap items-center gap-3"><span className="display-md text-3xl">{team.name}</span><TeamStatusBadge status={team.status} /></p>}
        </Container>
      </section>
      <Container className="py-10 md:py-14 space-y-10">
        {isAdminRole(profile.role) && <LinkButton href="/admin" variant="dark">{t("pl.goAdmin")}</LinkButton>}
        {!team ? <EmptyState title={t("pl.noTeam")} body={t("pl.noTeamBody")} action={<LinkButton href="/register">{t("cta.register")}</LinkButton>} /> : (
          <>
            <TeamLiveStrip teamId={team.id} status={team.status} />
            <section id="next-match" className="scroll-mt-24">
              <h2 className="display text-5xl md:text-6xl mb-4">{t("pl.nextMatch")}</h2>
              {next ? (
                <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                  <div className="on-dark rounded-3xl bg-ink text-white p-6 md:p-8">
                    <p className="text-xs font-extrabold tracking-widest text-lime">{roundText(next, t)}</p>
                    <p className="display text-5xl md:text-7xl mt-2">VS {opponent?.name ?? t("common.tbd")}</p>
                    <p className="mt-4 font-bold text-lg"><span className="num text-5xl mr-3 text-lime">{formatTime(next.scheduledAt)}</span>{next.courtName ?? t("live.courtTbc")}</p>
                    <a href="/api/player/calendar" className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime text-ink font-extrabold px-5 py-3 min-h-12"><CalendarPlus size={18} aria-hidden />{t("pl.addCal")}</a>
                  </div>
                  <MatchCard match={next} />
                </div>
              ) : <EmptyState title={t("pl.noMatch")} body={t("pl.noMatchBody")} />}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-white border border-ink/10 p-6" aria-label={t("pl.myTeam")}>
                <h2 className="display-md text-3xl mb-3">{t("pl.myTeam")}</h2>
                <p className="font-extrabold text-xl">{team.name}</p>
                <p className="text-slate font-semibold">{team.players.map((p) => `${p.firstName} ${p.lastName}`).join(" · ")}</p>
                <div className="mt-4 rounded-2xl bg-paper p-4 flex items-center justify-between gap-3 flex-wrap"><div><p className="text-xs font-extrabold tracking-widest text-slate">{t("pl.teamIdCheckin")}</p><p className="num text-4xl tracking-wider">{team.teamCode}</p></div><CopyButton value={team.teamCode} /></div>
                <div className="mt-4 flex flex-wrap gap-2"><LinkButton href={`/team/${team.slug}`} variant="ghost">{t("pl.publicPage")}</LinkButton></div>
                <div className="mt-4"><ShareTeam url={`${siteUrl}/team/${team.slug}`} teamName={team.name} slug={team.slug} /></div>
              </section>
              <section className="rounded-3xl bg-white border border-ink/10 p-6" aria-label={t("pl.myPractice")}>
                <h2 className="display-md text-3xl mb-3">{t("pl.myPractice")}</h2>
                {myPractice.length ? <ul className="space-y-2">{myPractice.map(({ r, s }) => <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3"><span className="font-extrabold">{weekday(s!.date, locale)} {shortDay(s!.date, locale)} · {hhmm(s!.startTime)}</span><span className="text-xs font-extrabold tracking-wider">{r.status === "booked" ? t("pr.booked") : t("pr.onWaitlist")}</span></li>)}</ul>
                  : <p className="text-slate font-semibold">{t("pl.noPractice")}</p>}
                <LinkButton href="/tournament/practice" variant="dark" className="mt-4">{t("pl.book")}</LinkButton>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <section><h2 className="display text-5xl mb-4">{t("team.road1")}<br />{t("team.road2")}</h2><JourneyTimeline steps={buildJourney(team, matches)} /></section>
              <section><h2 className="display text-5xl mb-4">{t("pl.results")}</h2>
                {results.length ? <div className="grid gap-4 sm:grid-cols-2">{results.map((m) => <MatchCard key={m.id} match={m} />)}</div> : <EmptyState title={t("pl.noResult")} />}
                <Link href="/tournament/main-event" className="mt-4 inline-block font-extrabold underline underline-offset-4">{t("pl.fullBracket")}</Link></section>
            </div>
          </>
        )}
        <NotificationList items={notifications} />
        <form action={logoutAction}><Button variant="ghost" type="submit"><LogOut size={18} aria-hidden />{t("cta.logout")}</Button></form>
      </Container>
    </LiveProvider>
  );
}
