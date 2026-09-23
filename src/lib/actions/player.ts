"use server";
import { tr } from "../i18n";
import { revalidatePath } from "next/cache";
import { assertPlayer } from "../auth";
import { repo } from "../repo";
import { rateLimit } from "../rate-limit";
import { notifyProfile } from "../notify";
import { track } from "../analytics";
import { formatDate, hhmm, weekday } from "../format";
import { parisIso } from "../time";
import type { ActionResult } from "../types";

/** Règle d'annulation (à confirmer par l'organisateur) : impossible moins de N heures avant la session. */
const PRACTICE_CANCEL_LIMIT_HOURS = 12;

export async function bookPracticeAction(sessionId: string): Promise<ActionResult<{ status: "booked" | "waitlist" }>> {
  try {
    const { profile, team } = await assertPlayer();
    if (!(await rateLimit("practice", 20, 10 * 60_000))) return { ok: false, error: "Trop de tentatives." };
    const res = await repo.bookPractice(sessionId, team!.id, profile.id.startsWith("demo:") ? null : profile.id);
    const msg = { full: "err.practiceFull", duplicate: "err.practiceDup", closed: "err.practiceClosed" } as const;
    if (res === "booked" || res === "waitlist") {
      const s = (await repo.listPractice()).find((p) => p.id === sessionId);
      await notifyProfile(profile, {
        kind: "practice", title: res === "booked" ? "Practice session confirmed" : "Practice session — waiting list",
        body: s ? `${weekday(s.date)} ${formatDate(s.date + "T12:00:00")} · ${hhmm(s.startTime)} — ${s.location}` : undefined,
      });
      await track("practice_booking", { status: res });
      revalidatePath("/tournament/practice"); revalidatePath("/player");
      return { ok: true, data: { status: res } };
    }
    return { ok: false, error: await tr(msg[res]) };
  } catch (e) { return { ok: false, error: await tr(e instanceof Error ? e.message : "err.unexpected") }; }
}

export async function cancelPracticeAction(registrationId: string): Promise<ActionResult> {
  try {
    const { team } = await assertPlayer();
    const mine = (await repo.listPracticeForTeam(team!.id)).find((r) => r.id === registrationId);
    if (!mine) return { ok: false, error: await tr("err.bookingNotFound") };
    const session = (await repo.listPractice()).find((s) => s.id === mine.sessionId);
    if (session) {
      const start = new Date(parisIso(session.date, session.startTime.slice(0, 5))).getTime();
      if (start - Date.now() < PRACTICE_CANCEL_LIMIT_HOURS * 3600_000) return { ok: false, error: await tr("err.cancelLimit", { h: PRACTICE_CANCEL_LIMIT_HOURS }) };
    }
    await repo.cancelPractice(registrationId);
    revalidatePath("/tournament/practice"); revalidatePath("/player");
    return { ok: true };
  } catch (e) { return { ok: false, error: await tr(e instanceof Error ? e.message : "err.unexpected") }; }
}

export async function markNotificationsReadAction() {
  const { profile } = await assertPlayer();
  await repo.markNotificationsRead(profile.id);
  revalidatePath("/player");
}
