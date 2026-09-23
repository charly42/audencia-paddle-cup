"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { TeamStatusBadge } from "@/components/ui/Badge";
import { TeamAvatar } from "./primitives";
import type { Partner, PublicPlayer, Team } from "@/lib/types";

/** Photo d'équipe (ou visuel typographique de remplacement). */
export function TeamPhoto({ team, className }: { team: Pick<Team, "name" | "photoUrl">; className?: string }) {
  const t = useT();
  if (team.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.photoUrl} alt={`${t("team.photoAlt")} — ${team.name}`} className={cn("object-cover w-full h-full", className)} />;
  }
  return (
    <div aria-hidden className={cn("w-full h-full bg-blue court-lines grid place-items-center", className)}>
      <span className="display text-white/90 text-7xl md:text-9xl">{team.name.replace(/^TEAM\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 3).join("")}</span>
    </div>
  );
}

export function TeamCard({ team }: { team: Team }) {
  const t = useT();
  return (
    <Link href={`/team/${team.slug}`} className="group block rounded-3xl bg-white border border-ink/10 overflow-hidden transition-shadow hover:shadow-xl focus-visible:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105"><TeamPhoto team={team} /></div>
        <div className="absolute top-3 left-3"><TeamStatusBadge status={team.status} /></div>
        {team.kind === "staff" && <span className="absolute top-3 right-3 bg-ink text-lime text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wider">{t("teams.staff")}</span>}
      </div>
      <div className="p-5">
        <h3 className="display-md text-3xl leading-none">{team.name}</h3>
        <p className="mt-1.5 text-sm font-bold text-blue">{team.promotionName ?? team.program ?? "—"}</p>
        {team.program && team.promotionName && <p className="text-xs text-slate font-semibold">{team.program}</p>}
        <p className="mt-3 text-sm font-semibold text-slate">{team.players.map((p) => `${p.firstName} ${p.lastName[0]}.`).join(" · ")}</p>
      </div>
    </Link>
  );
}

export function PlayerCard({ player, index }: { player: PublicPlayer; index: number }) {
  const t = useT();
  return (
    <div className="rounded-3xl bg-white border border-ink/10 overflow-hidden">
      <div className="aspect-[4/5] bg-mist relative">
        {player.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full grid place-items-center bg-ink"><TeamAvatar name={`${player.firstName} ${player.lastName}`} size={96} /></div>}
        <span className="absolute top-3 left-3 num text-5xl text-lime drop-shadow">0{index + 1}</span>
        {player.isCaptain && <span className="absolute top-3 right-3 bg-lime text-ink text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wider">{t("team.captain")}</span>}
      </div>
      <div className="p-4">
        <p className="text-xs font-extrabold tracking-widest text-slate">{t("team.player")} 0{index + 1}</p>
        <p className="display-md text-3xl leading-none mt-1">{player.firstName}<br />{player.lastName}</p>
      </div>
    </div>
  );
}

export function StatCard({ label, value, tone = "light" }: { label: string; value: React.ReactNode; tone?: "light" | "blue" | "lime" | "ink" }) {
  const tones = { light: "bg-white border border-ink/10", blue: "bg-blue text-white", lime: "bg-lime text-ink", ink: "bg-ink text-white" };
  return (
    <div className={cn("rounded-3xl p-5", tones[tone])}>
      <p className="num text-6xl md:text-7xl">{value}</p>
      <p className="mt-2 text-xs font-extrabold tracking-widest opacity-70">{label}</p>
    </div>
  );
}

export function PartnerCard({ partner }: { partner: Partner }) {
  const inner = (
    <div className="rounded-3xl bg-white border border-ink/10 p-6 h-full flex flex-col items-center justify-center text-center min-h-40">
      {partner.logoUrl /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={partner.logoUrl} alt={partner.name} className="max-h-20 max-w-full object-contain" />
        : <p className="display text-4xl">{partner.name}</p>}
      {partner.description && <p className="mt-2 text-xs text-slate font-semibold max-w-xs">{partner.description}</p>}
    </div>
  );
  return partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>{inner}</a> : inner;
}

export function TimelineItem({ time, title, description, highlight, last }: { time: string; title: string; description?: string | null; highlight?: boolean; last?: boolean }) {
  return (
    <li className="flex gap-4 md:gap-6">
      <div className="w-16 md:w-24 shrink-0 text-right"><span className={cn("num text-3xl md:text-5xl", highlight && "text-blue")}>{time}</span></div>
      <div className="relative pb-8 pl-6 md:pl-8">
        {!last && <span aria-hidden className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-ink/15" />}
        <span aria-hidden className={cn("absolute left-0 top-2 size-3 rounded-full", highlight ? "bg-lime ring-4 ring-blue" : "bg-blue")} />
        <p className={cn("display-md text-2xl md:text-4xl", highlight && "text-blue")}>{title}</p>
        {description && <p className="text-sm text-slate font-semibold mt-1">{description}</p>}
      </div>
    </li>
  );
}
