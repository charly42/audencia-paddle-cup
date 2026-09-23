import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { buildIcs } from "@/lib/ics";
import { parisIso } from "@/lib/time";

/** Export .ics des matchs et sessions d'entraînement de l'équipe de l'utilisateur connecté. */
export async function GET() {
  const profile = await getProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });
  const { team } = await repo.getPlayerContext(profile);
  if (!team) return new NextResponse("No team", { status: 404 });
  const [matches, practice, regs, settings] = await Promise.all([repo.listMatches({ teamId: team.id }), repo.listPractice(), repo.listPracticeForTeam(team.id), repo.getSettings()]);
  const events = [
    ...matches.filter((m) => m.scheduledAt && m.status !== "final").map((m) => ({
      uid: `match-${m.id}`, title: `Padel Cup — ${m.teamA?.name ?? "TBD"} vs ${m.teamB?.name ?? "TBD"}`, start: new Date(m.scheduledAt!), end: new Date(new Date(m.scheduledAt!).getTime() + 45 * 60_000),
      location: `${m.courtName ?? ""} ${settings.venue}`.trim(),
    })),
    ...regs.filter((r) => r.status === "booked").flatMap((r) => {
      const s = practice.find((p) => p.id === r.sessionId); if (!s) return [];
      const start = new Date(parisIso(s.date, s.startTime.slice(0, 5)));
      return [{ uid: `practice-${s.id}`, title: "Padel Cup — Practice session", start, end: new Date(start.getTime() + s.durationMin * 60_000), location: s.location }];
    }),
  ];
  return new NextResponse(buildIcs(events), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="padel-cup.ics"', "Cache-Control": "no-store" } });
}
