import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { formatTime } from "@/lib/format";
import { renderCard, type CardFormat } from "@/lib/cards/render";
import type { TeamStatus } from "@/lib/types";
import { i18n } from "@/lib/i18n";

/** Clés de traduction par statut. La carte est générée dans la langue de la personne qui la télécharge. */
const BY_STATUS: Record<TeamStatus, { headline: string; sub: string }> = {
  pending: { headline: "card.in", sub: "card.registered" },
  registered: { headline: "card.in", sub: "card.registered" },
  qualified: { headline: "card.qualified", sub: "card.toCup" },
  semi_finalist: { headline: "card.semi", sub: "card.standing" },
  finalist: { headline: "card.finalists", sub: "card.oneToGo" },
  champion: { headline: "card.champions", sub: "nav.mainEvent" },
  eliminated: { headline: "card.thanks", sub: "card.ride" },
};
const TEMPLATES = ["auto", "registered", "qualified", "match", "champion", "recap"] as const;

/** Cartes sociales dynamiques d'une équipe : post 1080×1350, story 1080×1920, og 1200×630. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await repo.getTeamBySlug(slug);
  if (!team) return new NextResponse("Not found", { status: 404 });
  const sp = req.nextUrl.searchParams;
  const { t } = await i18n();
  const format = (["post", "story", "og"].includes(sp.get("format") ?? "") ? sp.get("format") : "post") as CardFormat;
  const tpl = (TEMPLATES as readonly string[]).includes(sp.get("template") ?? "") ? sp.get("template")! : "auto";

  let { headline, sub } = BY_STATUS[team.status];
  let extra: string | null = null;
  if (tpl === "registered") ({ headline, sub } = BY_STATUS.registered);
  if (tpl === "qualified") ({ headline, sub } = BY_STATUS.qualified);
  if (tpl === "champion") ({ headline, sub } = BY_STATUS.champion);
  if (tpl === "recap") {
    // Récap de fin d'événement : parcours résumé en une image partageable.
    const played = (await repo.listMatches({ teamId: team.id })).filter((m) => m.status === "final");
    const wins = played.filter((m) => (m.teamA?.id === team.id ? m.scoreA > m.scoreB : m.scoreB > m.scoreA)).length;
    headline = "card.journey"; sub = "nav.mainEvent";
    extra = t("card.recap", { m: played.length, w: wins, s: team.supportersCount });
  }
  if (tpl === "match") {
    const next = (await repo.listMatches({ teamId: team.id })).filter((m) => ["upcoming", "check_in", "warm_up", "live"].includes(m.status)).sort((a, b) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9"))[0];
    headline = "card.gameDay"; sub = "card.followLive";
    if (next) { const opp = next.teamA?.id === team.id ? next.teamB : next.teamA; extra = `VS ${opp?.name ?? "TBD"} · ${formatTime(next.scheduledAt)}${next.courtName ? ` · ${next.courtName}` : ""}`; }
  }
  return renderCard(
    { format, headline: t(headline), sub: t(sub), teamName: team.name, promo: team.promotionName ?? team.program, players: team.players.map((p) => `${p.firstName} ${p.lastName}`), photoUrl: team.photoUrl, extra, url: `${siteUrl}/team/${team.slug}` },
    { download: sp.get("download") === "1", filename: team.slug },
  );
}
