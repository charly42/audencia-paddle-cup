import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { i18n, pickLang } from "@/lib/i18n";
import { Announcement } from "@/components/site/Announcement";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { DisplayRotator } from "@/components/site/DisplayRotator";
import { DISPLAY_SCREENS, DisplayScene } from "@/components/site/DisplayScene";

/** /display — rotation automatique de toutes les scènes (mode pré-événement inclus). */
export default async function DisplayPage() {
  const [matches, settings, courts, teams, standings, { locale, t }] = await Promise.all([repo.listMatches(), repo.getSettings(), repo.listCourts(), repo.listTeams(), repo.predictionStandings(), i18n()]);
  const announcement = pickLang({ fr: settings.announcementFr, en: settings.announcementEn }, locale);
  const announcementLive = !settings.announcementUntil || new Date(settings.announcementUntil) > new Date();
  return (
    <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
      {announcement && announcementLive && <Announcement message={announcement} level={settings.announcementLevel} label={t(`announce.${settings.announcementLevel}`)} big />}
      <DisplayRotator scenes={DISPLAY_SCREENS.map((s) => ({ id: s, node: <DisplayScene screen={s} courts={courts} teams={teams} siteUrl={siteUrl} standings={standings} t={t} /> }))} />
    </LiveProvider>
  );
}
