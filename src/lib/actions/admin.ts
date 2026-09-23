"use server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "../auth";
import { repo } from "../repo";
import { tournament, ChallongeTournamentProvider } from "../tournament";
import { notifyTeam } from "../notify";
import { announcementSchema, matchStatusSchema, photoSchema, practiceSchema, scoreSchema, settingsSchema, shiftSchema } from "../schemas";
import { uploadPhoto } from "../storage";
import { slugify } from "../utils";
import type { ActionResult, EventMode, Match, MatchStatus, TeamStatus } from "../types";

const wrap = async <T>(fn: () => Promise<T>): Promise<ActionResult<T>> => {
  try { return { ok: true, data: await fn() }; } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." }; }
};
const refreshLive = () => { revalidatePath("/"); revalidatePath("/tournament/main-event"); revalidatePath("/tournament/qualifiers"); revalidatePath("/schedule"); revalidatePath("/admin/live"); revalidatePath("/admin/scores"); };

// ── Événement ──────────────────────────────────────────────────────
export async function setEventModeAction(mode: EventMode) {
  return wrap(async () => { await assertAdmin("live"); await repo.updateSettings({ eventMode: mode }); revalidatePath("/", "layout"); });
}
export async function updateSettingsAction(input: unknown) {
  return wrap(async () => {
    await assertAdmin("content");
    const v = settingsSchema.parse(input);
    await repo.updateSettings({ ...v, eventDate: v.eventDate ? new Date(v.eventDate).toISOString() : null, registrationDeadline: v.registrationDeadline ? new Date(v.registrationDeadline).toISOString() : null });
    revalidatePath("/", "layout");
  });
}
export async function saveContentAction(key: string, value: unknown) {
  return wrap(async () => {
    await assertAdmin("content");
    if (!/^[a-z0-9_.-]{2,60}$/.test(key)) throw new Error("Clé invalide.");
    await repo.setContent(key, value);
    revalidatePath("/", "layout");
  });
}

// ── Notifications de match ─────────────────────────────────────────
async function notifyMatchChange(before: Match | null, after: Match | null) {
  if (!before || !after) return;
  const ids = [after.teamA?.id, after.teamB?.id].filter(Boolean) as string[];
  const vs = `${after.teamA?.name ?? "TBD"} vs ${after.teamB?.name ?? "TBD"}`;
  if (after.status === "live" && before.status !== "live")
    await Promise.all(ids.map((id) => notifyTeam(id, { kind: "match", title: "Your match is LIVE", body: `${vs}${after.courtName ? ` — ${after.courtName}` : ""}`, email: false })));
  if (after.courtId !== before.courtId && after.courtName && after.status !== "final")
    await Promise.all(ids.map((id) => notifyTeam(id, { kind: "court", title: "Court change", body: `Your match is now on ${after.courtName}.` })));
  if (after.status === "final" && before.status !== "final" && after.tournament !== "staff-vs-students") {
    for (const id of ids) {
      const t = await repo.getTeamById(id);
      const body: Partial<Record<TeamStatus, string>> = { qualified: "You qualified for the Audencia Padel Cup.", semi_finalist: "You qualified for the semi-finals.", finalist: "You are in the FINAL.", champion: "CHAMPIONS — Audencia Padel Cup." };
      if (t && body[t.status]) await notifyTeam(id, { kind: "result", title: body[t.status]!, body: `${vs} — ${after.scoreA}-${after.scoreB}` });
    }
  }
}

// ── Matchs & scores (SCORE MANAGER autorisé) ───────────────────────
// ── Annonce d'urgence (site + écrans TV) ───────────────────────────────────
export async function setAnnouncementAction(input: unknown) {
  return wrap(async () => {
    await assertAdmin("live");
    const v = announcementSchema.parse(input);
    await repo.updateSettings({
      announcementFr: v.fr.trim() || null, announcementEn: v.en.trim() || null,
      announcementLevel: v.level, announcementUntil: v.until ? new Date(v.until).toISOString() : null,
    });
    revalidatePath("/", "layout"); revalidatePath("/display");
  });
}
export async function clearAnnouncementAction() {
  return wrap(async () => {
    await assertAdmin("live");
    await repo.updateSettings({ announcementFr: null, announcementEn: null, announcementUntil: null });
    revalidatePath("/", "layout"); revalidatePath("/display");
  });
}

// ── Modération des encouragements ──────────────────────────────────────────
export async function moderateCheerAction(id: string, status: "approved" | "rejected") {
  return wrap(async () => {
    const profile = await assertAdmin("content");
    await repo.moderateCheer(id, status, profile.id.startsWith("demo:") ? null : profile.id);
    revalidatePath("/", "layout");
  });
}

// ── Galerie photos ─────────────────────────────────────────────────────────
export async function addPhotoAction(input: unknown) {
  return wrap(async () => { await assertAdmin("content"); await repo.addPhoto(photoSchema.parse(input)); revalidatePath("/gallery"); });
}
export async function deletePhotoAction(id: string) {
  return wrap(async () => { await assertAdmin("content"); await repo.deletePhoto(id); revalidatePath("/gallery"); });
}

// ── Bénévoles et arbitres ──────────────────────────────────────────────────
export async function saveShiftAction(input: { id?: string; role: string; startsAt: string; endsAt: string; courtId: string | null; capacity: number; notes: string | null }) {
  return wrap(async () => {
    await assertAdmin("content");
    const v = shiftSchema.parse(input);
    if (new Date(v.endsAt) <= new Date(v.startsAt)) throw new Error("La fin doit être après le début.");
    await repo.saveShift({ ...v, id: input.id, startsAt: new Date(v.startsAt).toISOString(), endsAt: new Date(v.endsAt).toISOString() });
    revalidatePath("/volunteers");
  });
}
export async function deleteShiftAction(id: string) {
  return wrap(async () => { await assertAdmin("content"); await repo.deleteShift(id); revalidatePath("/volunteers"); });
}
export async function removeAssignmentAction(id: string) {
  return wrap(async () => { await assertAdmin("content"); await repo.removeAssignment(id); revalidatePath("/volunteers"); });
}

export async function setScoreAction(input: unknown) {
  return wrap(async () => {
    await assertAdmin("scores");
    const v = scoreSchema.parse(input);
    const m = await tournament.reportScore(v.matchId, v.scoreA, v.scoreB, false);
    refreshLive();
    return m;
  });
}

export async function matchControlAction(matchId: string, action: "start" | "pause" | "resume" | "end" | "delay", confirmed = false) {
  return wrap(async () => {
    await assertAdmin(action === "delay" ? "live" : "scores");
    const before = await repo.getMatch(matchId);
    if (!before) throw new Error("Match introuvable.");
    if (action === "end" && !confirmed) throw new Error("Confirmation requise pour terminer le match.");
    if (before.status === "final" && action !== "end") throw new Error("Match déjà terminé.");
    const patch = { start: { status: "live" as const, paused: false }, pause: { paused: true }, resume: { paused: false }, end: { status: "final" as const }, delay: { status: "postponed" as const } }[action];
    const after = await tournament.updateMatch(matchId, patch);
    await notifyMatchChange(before, after);
    refreshLive();
    return after;
  });
}

export async function setMatchStatusAction(matchId: string, status: MatchStatus) {
  return wrap(async () => {
    await assertAdmin("live");
    const s = matchStatusSchema.parse(status);
    const before = await repo.getMatch(matchId);
    const after = await tournament.updateMatch(matchId, { status: s });
    await notifyMatchChange(before, after);
    refreshLive();
  });
}

export async function assignCourtAction(matchId: string, courtId: string | null) {
  return wrap(async () => {
    await assertAdmin("scores");
    const before = await repo.getMatch(matchId);
    const after = await tournament.updateMatch(matchId, { courtId });
    await notifyMatchChange(before, after);
    refreshLive();
  });
}

export async function updateMatchScheduleAction(matchId: string, scheduledAt: string | null, teamAId?: string | null, teamBId?: string | null) {
  return wrap(async () => {
    await assertAdmin("matches");
    await tournament.updateMatch(matchId, { scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, ...(teamAId !== undefined ? { teamAId } : {}), ...(teamBId !== undefined ? { teamBId } : {}) });
    refreshLive();
  });
}

export async function createMatchAction(input: { tournament: "qualifiers" | "main-event" | "staff-vs-students"; teamAId: string; teamBId: string; courtId: string | null; scheduledAt: string | null; round: "group" | "r16" | "quarter" | "semi" | "final" | "game"; gameNo?: number | null; pointsValue?: number; promotionId?: string | null }) {
  return wrap(async () => {
    await assertAdmin("matches");
    if (input.teamAId === input.teamBId) throw new Error("Deux équipes différentes requises.");
    const existing = await repo.listMatches({ tournament: input.tournament, round: input.round });
    await repo.createMatch({ ...input, teamAId: input.teamAId || null, teamBId: input.teamBId || null, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : null, position: existing.length + 1 });
    refreshLive();
  });
}

// ── Équipes ────────────────────────────────────────────────────────
export async function updateTeamAction(id: string, input: { name: string; slug: string; program: string; description: string; status: TeamStatus; promotionId: string | null }) {
  return wrap(async () => {
    await assertAdmin("teams");
    const slug = slugify(input.slug || input.name);
    if (!input.name.trim() || !slug) throw new Error("Nom et slug requis.");
    await repo.updateTeam(id, { name: input.name.trim(), slug, program: input.program, description: input.description || null, status: input.status, promotionId: input.promotionId || null });
    revalidatePath("/teams"); revalidatePath(`/team/${slug}`);
    return { slug };
  });
}
export async function uploadTeamPhotoAction(formData: FormData) {
  return wrap(async () => {
    await assertAdmin("teams");
    const id = String(formData.get("teamId") ?? ""); const file = formData.get("photo");
    if (!(file instanceof File) || !file.size) throw new Error("Aucun fichier.");
    const url = await uploadPhoto(file, "teams");
    await repo.updateTeam(id, { photoUrl: url });
    revalidatePath("/teams");
    return { url };
  });
}
/** Qualifie une équipe pour le Main Event (et l'ajoute côté Challonge si ce provider est actif). */
export async function qualifyTeamAction(teamId: string) {
  return wrap(async () => {
    await assertAdmin("teams");
    await tournament.createParticipant("main-event", teamId);
    revalidatePath("/teams");
  });
}
export async function syncChallongeAction() {
  return wrap(async () => {
    await assertAdmin("matches");
    if (!(tournament instanceof ChallongeTournamentProvider)) throw new Error("Le provider Challonge n'est pas actif (TOURNAMENT_PROVIDER=challonge + clés).");
    const n = await tournament.sync();
    refreshLive();
    return { synced: n };
  });
}

// ── Practice, tickets, contenus ────────────────────────────────────
export async function createPracticeAction(input: unknown) {
  return wrap(async () => { await assertAdmin("practice"); await repo.createPracticeSession(practiceSchema.parse(input)); revalidatePath("/tournament/practice"); });
}
export async function checkInAction(key: string): Promise<ActionResult<{ result: string; label?: string; sub?: string; already?: string }>> {
  return wrap(async () => {
    const profile = await assertAdmin("check-in");
    let k = key.trim();
    const fromUrl = k.match(/\/tickets\/([\w-]{16,64})/); // QR = URL /tickets/<token>
    if (fromUrl) k = fromUrl[1];
    if (!k || k.length > 200) return { result: "invalid" };
    const by = profile.id.startsWith("demo:") ? null : profile.id;
    if (/^APC-/i.test(k)) {
      const r = await repo.checkInTeam(k, by);
      return { result: r.result, label: r.team?.name, sub: r.team?.players.join(" · ") };
    }
    const r = await repo.checkIn(k, by);
    return { result: r.result, label: r.ticket ? `${r.ticket.firstName} ${r.ticket.lastName}` : undefined, sub: r.ticket ? r.ticket.ticketType.toUpperCase() : undefined, already: r.ticket?.checkedInAt ?? undefined };
  });
}
export async function savePartnerAction(p: { id?: string; name: string; logoUrl: string | null; website: string | null; tier: "main" | "partner" | "supporter"; description: string | null; sortOrder: number; active: boolean }) {
  return wrap(async () => {
    await assertAdmin("content");
    if (!p.name.trim()) throw new Error("Nom requis.");
    if (p.website && !/^https?:\/\//.test(p.website)) throw new Error("URL invalide (http/https).");
    await repo.savePartner(p); revalidatePath("/", "layout");
  });
}
export async function deletePartnerAction(id: string) { return wrap(async () => { await assertAdmin("content"); await repo.deletePartner(id); revalidatePath("/", "layout"); }); }
export async function saveScheduleItemAction(i: { id?: string; startTime: string; title: string; description: string | null; sortOrder: number }) {
  return wrap(async () => {
    await assertAdmin("content");
    if (!/^\d{2}:\d{2}$/.test(i.startTime) || !i.title.trim()) throw new Error("Heure (HH:MM) et titre requis.");
    await repo.saveScheduleItem(i); revalidatePath("/schedule");
  });
}
export async function deleteScheduleItemAction(id: string) { return wrap(async () => { await assertAdmin("content"); await repo.deleteScheduleItem(id); revalidatePath("/schedule"); }); }
