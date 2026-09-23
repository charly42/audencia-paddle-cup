import { QRCodeSVG } from "qrcode.react";
import type { Court, Team } from "@/lib/types";
import { LiveGlobalScore } from "@/components/sport/GlobalScore";
import { LiveNow, NextMatches, CourtsView } from "@/components/sport/LiveWidgets";
import { LiveBracket } from "@/components/sport/BracketView";
import { TeamAvatar } from "@/components/sport/primitives";
import type { PredictionStanding } from "@/lib/types";

export const DISPLAY_SCREENS = ["score", "live", "bracket", "courts", "teams", "predictions", "qr"] as const;
export type DisplayScreen = (typeof DISPLAY_SCREENS)[number];

/** Scènes pour écrans campus / projecteurs : typographie XXL, fond sombre, sans navigation. */
/** Composant serveur : `t` est le translator serveur de la langue active. */
export function DisplayScene({ screen, courts, teams, siteUrl, standings = [], t }: { screen: DisplayScreen; courts: Court[]; teams: Team[]; siteUrl: string; standings?: PredictionStanding[]; t: (k: string) => string }) {
  switch (screen) {
    case "score": return <div className="h-full grid place-items-center p-8"><div className="w-full max-w-7xl"><LiveGlobalScore /></div></div>;
    case "live": return <div className="p-10 space-y-10"><LiveNow /><NextMatches limit={4} /></div>;
    case "bracket": return <div className="p-10"><h2 className="display text-7xl mb-6 text-lime">{t("me.studentPadelCup")}</h2><LiveBracket tournament="main-event" /></div>;
    case "courts": return <div className="p-10"><h2 className="display text-7xl mb-6 text-lime">{t("live.courts")}</h2><CourtsView courts={courts} /></div>;
    case "teams": return (
      <div className="p-10"><h2 className="display text-7xl mb-6 text-lime">{t("display.teams")}</h2>
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">{teams.slice(0, 16).map((tm) => <div key={tm.id} className="rounded-3xl bg-white/10 p-4 flex items-center gap-3"><TeamAvatar name={tm.name} photoUrl={tm.photoUrl} size={56} /><div className="min-w-0"><p className="display-md text-2xl truncate">{tm.name}</p><p className="text-sm font-bold text-lime truncate">{tm.promotionName ?? t("teams.staff")}</p></div></div>)}</div></div>
    );
    case "predictions": return (
      <div className="p-10"><h2 className="display text-7xl mb-6 text-lime">{t("display.predictions")}</h2>
        <ol className="grid grid-cols-2 gap-x-10">{standings.slice(0, 12).map((s, i) => (
          <li key={s.name} className="flex items-center gap-5 py-3 border-b border-white/15">
            <span className="num text-5xl text-lime w-16">{i + 1}</span><span className="flex-1 display-md text-4xl truncate">{s.name}</span><span className="num text-5xl">{s.points}</span>
          </li>))}</ol>
        {!standings.length && <p className="display-md text-4xl text-white/70">—</p>}</div>
    );
    case "qr": return (
      <div className="h-full grid place-items-center text-center p-10">
        <div><p className="display text-[9rem] leading-[.85]">{t("display.follow1")}<br /><span className="text-lime">{t("display.follow2")}</span></p>
          <div className="mt-8 inline-block bg-white rounded-3xl p-6"><QRCodeSVG value={siteUrl} size={280} level="M" marginSize={0} title="QR code — site" /></div>
          <p className="mt-4 display-md text-4xl">{siteUrl.replace(/^https?:\/\//, "")}</p></div>
      </div>
    );
  }
}
