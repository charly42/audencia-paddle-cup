import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { repo } from "@/lib/repo";
import { toCsv } from "@/lib/csv";
import { formatDateFr } from "@/lib/format";

/** Exports CSV — réservés aux rôles ayant accès au module « exports » (jamais aux clés/secrets). */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const profile = await getProfile();
  if (!profile || !canAccess(profile.role, "exports")) return new NextResponse("Forbidden", { status: 403 });
  const kind = (await params).kind;
  let rows: Record<string, unknown>[];
  switch (kind) {
    case "teams": rows = (await repo.listTeams()).map((t) => ({ team_id: t.teamCode, name: t.name, type: t.kind, promotion: t.promotionName, program: t.program, status: t.status, supporters: t.supportersCount, players: t.players.map((p) => `${p.firstName} ${p.lastName}`).join(" / "), created_at: t.createdAt })); break;
    case "players": rows = (await repo.listPlayers()).map((p) => ({ first_name: p.firstName, last_name: p.lastName, email: p.email, phone: p.phone, level: p.skillLevel, team: p.teamName, captain: p.isCaptain ? "yes" : "no" })); break;
    case "tickets": rows = (await repo.listTickets()).map((t) => ({ code: t.code, first_name: t.firstName, last_name: t.lastName, email: t.email, type: t.ticketType, promotion: t.promotionName, checked_in: t.checkedInAt ? formatDateFr(t.checkedInAt) : "", created_at: t.createdAt })); break;
    case "practice": rows = (await repo.listPracticeRegistrations()).map((r) => ({ session: r.sessionLabel, team: r.teamName, status: r.status, created_at: r.createdAt })); break;
    case "matches": rows = (await repo.listMatches()).map((m) => ({ tournament: m.tournament, round: m.round, team_a: m.teamA?.name, team_b: m.teamB?.name, score_a: m.scoreA, score_b: m.scoreB, court: m.courtName, scheduled_at: m.scheduledAt, status: m.status })); break;
    default: return new NextResponse("Unknown export", { status: 404 });
  }
  return new NextResponse(toCsv(rows) || "\uFEFFno data\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="apc-${kind}.csv"`, "Cache-Control": "no-store" } });
}
