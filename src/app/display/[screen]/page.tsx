import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { i18n, pickLang } from "@/lib/i18n";
import { Announcement } from "@/components/site/Announcement";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { DISPLAY_SCREENS, DisplayScene, type DisplayScreen } from "@/components/site/DisplayScene";

/** /display/[score|live|bracket|courts|teams|qr] — un écran dédié par TV. */
export default async function DisplayScreenPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!(DISPLAY_SCREENS as readonly string[]).includes(screen)) notFound();
  const [matches, settings, courts, teams, standings, { locale, t }] = await Promise.all([repo.listMatches(), repo.getSettings(), repo.listCourts(), repo.listTeams(), repo.predictionStandings(), i18n()]);
  const announcement = pickLang({ fr: settings.announcementFr, en: settings.announcementEn }, locale);
  const announcementLive = !settings.announcementUntil || new Date(settings.announcementUntil) > new Date();
  return (
    <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
      {announcement && announcementLive && <Announcement message={announcement} level={settings.announcementLevel} label={t(`announce.${settings.announcementLevel}`)} big />}
      <div className="min-h-dvh"><DisplayScene screen={screen as DisplayScreen} courts={courts} teams={teams} siteUrl={siteUrl} standings={standings} t={t} /></div>
    </LiveProvider>
  );
}
