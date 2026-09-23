import { cookies } from "next/headers";
import { repo } from "@/lib/repo";
import { i18n, pickLang } from "@/lib/i18n";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LiveBanner } from "@/components/site/LiveBanner";
import { BottomNav } from "@/components/site/BottomNav";
import { Announcement } from "@/components/site/Announcement";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, demo, partners, jar, { locale, t }] = await Promise.all([
    repo.getSettings(), repo.hasDemoData(), repo.listPartners(), cookies(), i18n(),
  ]);
  // Présence d'une session (cookie Supabase ou démo) → bottom navigation joueur. L'accès réel reste contrôlé côté serveur.
  const hasSession = jar.getAll().some((c) => (c.name.startsWith("sb-") && c.name.includes("auth-token")) || c.name === "apc_demo");
  const announcement = pickLang({ fr: settings.announcementFr, en: settings.announcementEn }, locale);
  const announcementLive = !settings.announcementUntil || new Date(settings.announcementUntil) > new Date();

  return (
    <div className="flex-1 flex flex-col">
      {demo && (
        <div role="note" className="bg-ink text-lime text-center text-xs font-bold py-1.5 px-3">
          {t("demo.banner")} <code>npm run seed:clear</code>
        </div>
      )}
      <SiteHeader
        eventName={settings.eventName} live={settings.eventMode === "live"} locale={locale}
        labels={{
          home: t("nav.home"), tournament: t("nav.tournament"), teams: t("nav.teams"), schedule: t("nav.schedule"),
          tickets: t("nav.tickets"), rules: t("nav.rules"), about: t("nav.about"), qualifiers: t("nav.qualifiers"),
          mainEvent: t("nav.mainEvent"), practice: t("nav.practice"), playerSpace: t("nav.playerSpace"),
          register: t("cta.register"), getTickets: t("cta.tickets"), registerShort: t("cta.registerShort"), getTicketsShort: t("cta.ticketsShort"), menu: t("nav.menu"), openMenu: t("nav.openMenu"),
          live: t("status.live"), langSwitch: t("lang.switch"),
        }}
      />
      {announcement && announcementLive && (
        <Announcement message={announcement} level={settings.announcementLevel} label={t(`announce.${settings.announcementLevel}`)} />
      )}
      {settings.eventMode === "live" && <LiveBanner label={t("live.banner")} sub={t("live.bannerSub")} />}
      <main id="main" className={`flex-1 ${hasSession ? "pb-20 md:pb-0" : ""}`}>{children}</main>
      <SiteFooter
        venue={settings.venue} partners={partners.filter((p) => p.tier === "main")}
        labels={{
          mainEvent: t("nav.mainEvent"), qualifiers: t("nav.qualifiers"), practice: t("nav.practice"), teams: t("nav.teams"),
          supporters: t("nav.supporters"), predictions: t("nav.predictions"), gallery: t("nav.gallery"),
          rules: t("nav.rules"), privacy: t("nav.privacy"), footer: t("a11y.footer"),
        }}
      />
      {hasSession && (
        <BottomNav labels={{ home: t("nav.home"), match: t("nav.match"), bracket: t("nav.bracket"), practice: t("nav.practice"), profile: t("nav.profile"), aria: t("nav.playerNav") }} />
      )}
    </div>
  );
}
