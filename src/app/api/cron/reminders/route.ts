import { NextResponse, type NextRequest } from "next/server";
import { repo } from "@/lib/repo";
import { notifyTeam } from "@/lib/notify";
import { formatTime } from "@/lib/format";

/**
 * Rappels automatiques « ton match dans ~30 min ».
 * Déclenché par le cron Vercel (voir vercel.json) toutes les 5 minutes.
 * Protégé par CRON_SECRET : sans secret configuré, la route refuse de s'exécuter en production.
 * Chaque match n'est notifié qu'une fois (colonne reminder_sent_at / mémoire en mode démo).
 */
export const dynamic = "force-dynamic";
const WINDOW_MINUTES = 35;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret) {
    if (process.env.NODE_ENV === "production") return new NextResponse("CRON_SECRET manquant", { status: 503 });
  } else if (auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const settings = await repo.getSettings();
  if (settings.eventMode === "post_event") return NextResponse.json({ sent: 0, skipped: "post_event" });

  const matches = await repo.matchesNeedingReminder(WINDOW_MINUTES);
  let sent = 0;
  for (const m of matches) {
    const minutes = m.scheduledAt ? Math.max(Math.round((new Date(m.scheduledAt).getTime() - Date.now()) / 60_000), 0) : WINDOW_MINUTES;
    const opponentOf = (side: "a" | "b") => (side === "a" ? m.teamB?.name : m.teamA?.name) ?? "TBD";
    for (const [side, team] of [["a", m.teamA], ["b", m.teamB]] as const) {
      if (!team) continue;
      await notifyTeam(team.id, {
        kind: "reminder",
        title: `Votre match dans ${minutes} min / Your match in ${minutes} min`,
        body: `vs ${opponentOf(side)} — ${formatTime(m.scheduledAt)}${m.courtName ? ` · ${m.courtName}` : ""}`,
      });
    }
    await repo.markReminderSent(m.id);
    sent++;
  }
  return NextResponse.json({ sent, checked: matches.length, at: new Date().toISOString() });
}
