import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { buildJourney } from "@/lib/journey";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { TeamLiveStrip } from "@/components/sport/LiveWidgets";
import { PlayerCard, TeamPhoto } from "@/components/sport/Cards";
import { JourneyTimeline } from "@/components/sport/Journey";
import { ShareTeam, SupportButton } from "@/components/sport/Engagement";
import { QRBlock } from "@/components/sport/QRBlock";
import { MatchCard } from "@/components/sport/MatchCards";
import { TeamStatusBadge } from "@/components/ui/Badge";
import { Container } from "@/components/site/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { CheerWall } from "@/components/sport/CheerWall";
import { i18n } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

/** Open Graph dynamique : chaque page équipe a sa propre carte de partage. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await repo.getTeamBySlug((await params).slug);
  if (!team) return { title: "404" };
  const { t } = await i18n();
  const desc = t("share.text", { team: team.name }).replace(/\s+/g, " ");
  const img = `/api/card/${team.slug}?template=auto&format=og`;
  return {
    title: team.name, description: desc, alternates: { canonical: `/team/${team.slug}` },
    openGraph: { title: `${team.name} — Audencia Padel Cup`, description: desc, url: `/team/${team.slug}`, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: `${team.name} — Audencia Padel Cup`, description: desc, images: [img] },
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = await repo.getTeamBySlug(slug);
  if (!team) notFound();
  const [matches, settings, { t }] = await Promise.all([repo.listMatches(), repo.getSettings(), i18n()]);
  const cheers = settings.cheersEnabled ? await repo.listCheers(team.id, "approved") : [];
  const mine = matches.filter((m) => m.teamA?.id === team.id || m.teamB?.id === team.id);
  const journey = buildJourney(team, matches);
  const url = `${siteUrl}/team/${team.slug}`;
  return (
    <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
      <section className="on-dark relative bg-blue text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40"><TeamPhoto team={team} className="!bg-transparent" /></div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-blue-deep via-blue/70 to-blue/30" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-10 md:pt-28 md:pb-14">
          <div className="flex flex-wrap items-center gap-2"><TeamStatusBadge status={team.status} />{team.kind === "staff" && <span className="bg-ink text-lime text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wider">{t("team.staffTeam")}</span>}</div>
          <h1 className="display text-6xl sm:text-8xl md:text-[10rem] mt-3">{team.name}</h1>
          <p className="display-md text-2xl md:text-4xl mt-3 text-lime">{team.promotionName ?? team.program}</p>
          {team.description && <p className="mt-3 max-w-2xl text-lg font-semibold text-white/90">{team.description}</p>}
          <div className="mt-6"><ShareTeam url={url} teamName={team.name} slug={team.slug} /></div>
        </div>
      </section>

      <Container className="py-10 md:py-14 space-y-12">
        <TeamLiveStrip teamId={team.id} status={team.status} />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section aria-label={t("team.players")}>
            <h2 className="display text-5xl md:text-6xl mb-4">{t("team.players")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">{team.players.map((p, i) => <PlayerCard key={p.id} player={p} index={i} />)}</div>
          </section>
          <aside className="space-y-4">
            <SupportButton teamId={team.id} initialCount={team.supportersCount} />
            <QRBlock url={url} label={`QR — ${team.name}`} />
          </aside>
        </div>

        <section aria-label={t("journey.aria")} className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div><h2 className="display text-5xl md:text-6xl mb-4">{t("team.road1")}<br />{t("team.road2")}</h2><JourneyTimeline steps={journey} /></div>
          <div>
            <h2 className="display text-5xl md:text-6xl mb-4">{t("team.matches")}</h2>
            {mine.length ? <div className="grid gap-4 sm:grid-cols-2">{mine.map((m) => <MatchCard key={m.id} match={m} />)}</div>
              : <p className="rounded-3xl border-2 border-dashed border-ink/20 p-8 text-slate font-semibold">{t("team.noMatch")}</p>}
          </div>
        </section>
        {settings.cheersEnabled && (
          <CheerWall teamId={team.id} cheers={cheers} labels={{
            title: t("cheer.title"), cta: t("cheer.cta"), name: t("cheer.name"), message: t("cheer.message"),
            sent: t("cheer.sent"), empty: t("cheer.empty"), moderated: t("cheer.moderated"),
          }} />
        )}
        <div className="text-center"><LinkButton href="/teams" variant="ghost">← {t("nav.teams")}</LinkButton></div>
      </Container>
    </LiveProvider>
  );
}
