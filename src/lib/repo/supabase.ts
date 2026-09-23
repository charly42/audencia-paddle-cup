/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "../supabase/admin";
import type {
  Cheer, GalleryPhoto, Prediction, PredictionStanding, VolunteerShift,
  AdminStats, AppNotification, CheckInResult, Court, EventSettings, Match, MatchFilter, MatchPatch, Partner, Player, PlayerContext,
  PracticeRegistration, PracticeSession, Profile, Promotion, ScheduleItem, Team, TeamLite, Ticket,
} from "../types";
import type { BookResult, Repo, TeamFilter } from "./types";
import { newTicketCode, newTicketToken } from "../tokens";
import { slugify } from "../utils";

const db = () => createAdminClient() as any;
const check = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

// ── Mapping lignes SQL → domaine ───────────────────────────────────
const liteOf = (t: any): TeamLite | null => t ? { id: t.id, name: t.name, slug: t.slug, kind: t.kind, promotionName: t.promotions?.name ?? null } : null;
const TEAM_SELECT = "*, promotions(name), players(id, first_name, last_name, photo_url, is_captain)";
const toTeam = (t: any): Team => ({
  id: t.id, name: t.name, slug: t.slug, kind: t.kind, promotionName: t.promotions?.name ?? null, teamCode: t.team_code, promotionId: t.promotion_id,
  program: t.program, status: t.status, photoUrl: t.photo_url, description: t.description, supportersCount: t.supporters_count, isDemo: t.is_demo,
  createdAt: t.created_at,
  players: (t.players ?? []).sort((a: any, b: any) => Number(b.is_captain) - Number(a.is_captain))
    .map((p: any) => ({ id: p.id, firstName: p.first_name, lastName: p.last_name, photoUrl: p.photo_url, isCaptain: p.is_captain })),
});
const MATCH_SELECT = `*, tournaments!inner(slug), courts(name),
  team_a:teams!matches_team_a_id_fkey(id,name,slug,kind,promotions(name)), team_b:teams!matches_team_b_id_fkey(id,name,slug,kind,promotions(name))`;
const toMatch = (r: any): Match => ({
  id: r.id, tournament: r.tournaments.slug, teamA: liteOf(r.team_a), teamB: liteOf(r.team_b), scoreA: r.team_a_score, scoreB: r.team_b_score,
  courtId: r.court_id, courtName: r.courts?.name ?? null, scheduledAt: r.scheduled_at, startedAt: r.started_at, endedAt: r.ended_at, status: r.status,
  paused: r.paused, round: r.round, roundOrder: r.round_order, position: r.position, promotionId: r.promotion_id, gameNo: r.game_no,
  pointsValue: r.points_value, externalId: r.external_id, updatedAt: r.updated_at,
});
const toTicket = (t: any): Ticket => ({
  id: t.id, token: t.token, code: t.code, firstName: t.first_name, lastName: t.last_name, email: t.email, ticketType: t.ticket_type,
  promotionId: t.promotion_id, promotionName: t.promotions?.name ?? null, checkedInAt: t.checked_in_at, createdAt: t.created_at,
});
const toPlayer = (p: any): Player => ({
  id: p.id, teamId: p.team_id, profileId: p.profile_id, firstName: p.first_name, lastName: p.last_name, photoUrl: p.photo_url, isCaptain: p.is_captain,
  email: p.email, phone: p.phone, skillLevel: p.skill_level, checkedInAt: p.checked_in_at,
});
const SETTINGS_COLS: Record<keyof EventSettings, string> = {
  eventMode: "event_mode", eventName: "event_name", eventDate: "event_date", venue: "venue", registrationOpen: "registration_open",
  registrationDeadline: "registration_deadline", ticketingOpen: "ticketing_open", ticketCapacity: "ticket_capacity", headline: "headline",
  tagline: "tagline", supportersAwardEnabled: "supporters_award_enabled", sponsorsEnabled: "sponsors_enabled",
  announcementFr: "announcement_fr", announcementEn: "announcement_en", announcementLevel: "announcement_level",
  announcementUntil: "announcement_until", defaultLocale: "default_locale",
  predictionsEnabled: "predictions_enabled", cheersEnabled: "cheers_enabled", galleryEnabled: "gallery_enabled",
  volunteersEnabled: "volunteers_enabled",
};
const toSettings = (r: any): EventSettings => Object.fromEntries(Object.entries(SETTINGS_COLS).map(([k, col]) => [k, r[col]])) as unknown as EventSettings;

async function ids(table: string, col: string, value: string) {
  const { data } = await db().from(table).select("id").eq(col, value).maybeSingle();
  return data?.id as string | undefined;
}

export const supabaseRepo: Repo = {
  kind: "supabase",
  async hasDemoData() {
    const { count } = await db().from("teams").select("id", { count: "exact", head: true }).eq("is_demo", true);
    return (count ?? 0) > 0;
  },
  async getSettings() { const { data, error } = await db().from("event_settings").select("*").eq("id", 1).single(); check(error); return toSettings(data); },
  async updateSettings(patch) {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) row[SETTINGS_COLS[k as keyof EventSettings]] = v;
    check((await db().from("event_settings").update(row).eq("id", 1)).error);
  },
  async getContent() {
    const { data, error } = await db().from("content_blocks").select("key, content"); check(error);
    return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.content?.value ?? r.content]));
  },
  async setContent(key, value) {
    check((await db().from("content_blocks").upsert({ key, content: { value }, updated_at: new Date().toISOString() }, { onConflict: "key" })).error);
  },

  async listPromotions() {
    const { data, error } = await db().from("promotions").select("*").order("name"); check(error);
    return (data ?? []).map((p: any): Promotion => ({ id: p.id, name: p.name, slug: p.slug, program: p.program, active: p.active }));
  },
  async listTeams(f: TeamFilter = {}) {
    let q = db().from("teams").select(TEAM_SELECT).order("name");
    if (f.promotionId) q = q.eq("promotion_id", f.promotionId);
    if (f.status) q = q.eq("status", f.status);
    if (f.kind) q = q.eq("kind", f.kind);
    if (f.q) q = q.ilike("name", `%${f.q.replace(/[%_]/g, "")}%`);
    const { data, error } = await q; check(error);
    return (data ?? []).map(toTeam);
  },
  async getTeamBySlug(slug) { const { data } = await db().from("teams").select(TEAM_SELECT).eq("slug", slug).maybeSingle(); return data ? toTeam(data) : null; },
  async getTeamById(id) { const { data } = await db().from("teams").select(TEAM_SELECT).eq("id", id).maybeSingle(); return data ? toTeam(data) : null; },
  async updateTeam(id, p) {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.slug !== undefined) row.slug = p.slug;
    if (p.promotionId !== undefined) row.promotion_id = p.promotionId;
    if (p.program !== undefined) row.program = p.program;
    if (p.status !== undefined) row.status = p.status;
    if (p.description !== undefined) row.description = p.description;
    if (p.photoUrl !== undefined) row.photo_url = p.photoUrl;
    check((await db().from("teams").update(row).eq("id", id)).error);
  },
  async registerTeam(input) {
    const emails = input.players.map((p) => p.email.toLowerCase());
    if (new Set(emails).size !== emails.length) throw new Error("err.sameEmail");
    const { data: dup } = await db().from("players").select("id").in("email", emails).limit(1);
    if (dup?.length) throw new Error("err.alreadyTeam");
    const base = slugify(input.teamName) || "team"; let slug = base, i = 2;
    while (await ids("teams", "slug", slug)) slug = `${base}-${i++}`;
    const { data: promo } = await db().from("promotions").select("id").eq("id", input.promotionId).maybeSingle();
    const { data: team, error } = await db().from("teams")
      .insert({ name: input.teamName, slug, promotion_id: promo?.id ?? null, program: input.program, photo_url: input.photoUrl ?? null, status: "registered", kind: "student" })
      .select("id, team_code").single();
    check(error);
    const profileIds: (string | null)[] = [];
    try {
      for (const [idx, p] of input.players.entries()) {
        const email = p.email.toLowerCase();
        let profileId: string | null = (await ids("profiles", "email", email)) ?? null;
        if (!profileId) {
          const { data, error: e } = await db().auth.admin.createUser({ email, email_confirm: true, user_metadata: { first_name: p.firstName, last_name: p.lastName } });
          if (e) throw new Error(e.message);
          profileId = data.user?.id ?? null;
        }
        profileIds.push(profileId);
        const { error: pe } = await db().from("players").insert({
          team_id: team.id, profile_id: profileId, first_name: p.firstName, last_name: p.lastName, email, phone: p.phone, skill_level: p.skillLevel, is_captain: idx === 0,
        });
        if (pe) throw new Error(pe.message);
      }
    } catch (e) {
      await db().from("teams").delete().eq("id", team.id); // rollback
      throw e;
    }
    return { team: (await this.getTeamById(team.id))!, teamCode: team.team_code as string, playerProfileIds: profileIds };
  },
  async listPlayers() {
    const { data, error } = await db().from("players").select("*, teams(name)").order("last_name"); check(error);
    return (data ?? []).map((p: any) => ({ ...toPlayer(p), teamName: p.teams?.name ?? "" }));
  },

  async listMatches(f: MatchFilter = {}) {
    let q = db().from("matches").select(MATCH_SELECT).order("round_order").order("position").order("scheduled_at");
    if (f.tournament) q = q.eq("tournaments.slug", f.tournament);
    if (f.round) q = q.eq("round", f.round);
    if (f.courtId) q = q.eq("court_id", f.courtId);
    if (f.status) q = q.eq("status", f.status);
    if (f.promotionId) q = q.eq("promotion_id", f.promotionId);
    if (f.teamId) q = q.or(`team_a_id.eq.${f.teamId},team_b_id.eq.${f.teamId}`);
    const { data, error } = await q; check(error);
    return (data ?? []).map(toMatch);
  },
  async getMatch(id) { const { data } = await db().from("matches").select(MATCH_SELECT).eq("id", id).maybeSingle(); return data ? toMatch(data) : null; },
  async updateMatch(id, p: MatchPatch) {
    const row: Record<string, unknown> = {};
    if (p.scoreA !== undefined) row.team_a_score = p.scoreA;
    if (p.scoreB !== undefined) row.team_b_score = p.scoreB;
    if (p.status !== undefined) row.status = p.status;
    if (p.paused !== undefined) row.paused = p.paused;
    if (p.courtId !== undefined) row.court_id = p.courtId;
    if (p.scheduledAt !== undefined) row.scheduled_at = p.scheduledAt;
    if (p.startedAt !== undefined) row.started_at = p.startedAt;
    if (p.endedAt !== undefined) row.ended_at = p.endedAt;
    if (p.teamAId !== undefined) row.team_a_id = p.teamAId;
    if (p.teamBId !== undefined) row.team_b_id = p.teamBId;
    check((await db().from("matches").update(row).eq("id", id)).error);
    return this.getMatch(id);
  },
  async createMatch(i) {
    const tid = await ids("tournaments", "slug", i.tournament);
    const order = ({ group: 1, r16: 2, quarter: 2, semi: 3, final: 4, game: 9 } as Record<string, number>)[i.round] ?? 1;
    check((await db().from("matches").insert({
      tournament_id: tid, team_a_id: i.teamAId, team_b_id: i.teamBId, court_id: i.courtId, scheduled_at: i.scheduledAt, round: i.round, round_order: order,
      position: i.position, promotion_id: i.promotionId ?? null, game_no: i.gameNo ?? null, points_value: i.pointsValue ?? 1,
    })).error);
  },
  async listCourts() {
    const { data, error } = await db().from("courts").select("*").order("sort_order"); check(error);
    return (data ?? []).map((c: any): Court => ({ id: c.id, name: c.name, sortOrder: c.sort_order, active: c.active }));
  },

  async listPractice() {
    const { data, error } = await db().from("practice_sessions")
      .select("*, practice_registrations(id, team_id, status, teams(id,name,slug,kind))").order("session_date").order("start_time"); check(error);
    return (data ?? []).map((p: any): PracticeSession => {
      const regs = (p.practice_registrations ?? []) as any[];
      const booked = regs.filter((r) => r.status === "booked");
      return {
        id: p.id, date: p.session_date, startTime: p.start_time, durationMin: p.duration_min, courtsCount: p.courts_count, capacity: p.capacity,
        spotsLeft: Math.max(p.capacity - booked.length * 2, 0), coach: p.coach, level: p.level, status: p.status, location: p.location,
        waitlistEnabled: p.waitlist_enabled, bookedTeams: booked.map((r) => liteOf(r.teams)!).filter(Boolean), waitlistCount: regs.filter((r) => r.status === "waitlist").length,
      };
    });
  },
  async listPracticeForTeam(teamId) {
    const { data, error } = await db().from("practice_registrations").select("*").eq("team_id", teamId).neq("status", "cancelled"); check(error);
    return (data ?? []).map((r: any): PracticeRegistration => ({ id: r.id, sessionId: r.practice_session_id, teamId: r.team_id, status: r.status, createdAt: r.created_at }));
  },
  async bookPractice(sessionId, teamId, profileId) {
    const { data, error } = await db().rpc("book_practice", { p_session: sessionId, p_team: teamId, p_profile: profileId });
    if (error) { if (error.code === "23505") return "duplicate"; throw new Error(error.message); }
    return data as BookResult;
  },
  async cancelPractice(registrationId) {
    const { data, error } = await db().rpc("cancel_practice", { p_registration: registrationId }); check(error);
    return (data as string | null) ?? null;
  },
  async createPracticeSession(i) {
    check((await db().from("practice_sessions").insert({ session_date: i.date, start_time: i.startTime, duration_min: i.durationMin, courts_count: i.courtsCount, capacity: i.capacity, coach: i.coach, level: i.level })).error);
  },
  async listPracticeRegistrations() {
    const { data, error } = await db().from("practice_registrations").select("id, status, created_at, teams(name), practice_sessions(session_date, start_time)").order("created_at", { ascending: false }); check(error);
    return (data ?? []).map((r: any) => ({ id: r.id, sessionLabel: `${r.practice_sessions?.session_date} ${String(r.practice_sessions?.start_time).slice(0, 5)}`, teamName: r.teams?.name ?? "", status: r.status, createdAt: r.created_at }));
  },

  async listPartners(all = false) {
    let q = db().from("partners").select("*").order("sort_order"); if (!all) q = q.eq("active", true);
    const { data, error } = await q; check(error);
    return (data ?? []).map((p: any): Partner => ({ id: p.id, name: p.name, logoUrl: p.logo_url, website: p.website, tier: p.tier, description: p.description, sortOrder: p.sort_order, active: p.active }));
  },
  async savePartner(p) {
    const row = { name: p.name, logo_url: p.logoUrl, website: p.website, tier: p.tier, description: p.description, sort_order: p.sortOrder, active: p.active };
    check((p.id ? await db().from("partners").update(row).eq("id", p.id) : await db().from("partners").insert(row)).error);
  },
  async deletePartner(id) { check((await db().from("partners").delete().eq("id", id)).error); },
  async listSchedule() {
    const { data, error } = await db().from("schedule_items").select("*").eq("active", true).order("sort_order"); check(error);
    return (data ?? []).map((i: any): ScheduleItem => ({ id: i.id, startTime: i.start_time, title: i.title, description: i.description, sortOrder: i.sort_order }));
  },
  async saveScheduleItem(i) {
    const row = { start_time: i.startTime, title: i.title, description: i.description, sort_order: i.sortOrder };
    check((i.id ? await db().from("schedule_items").update(row).eq("id", i.id) : await db().from("schedule_items").insert(row)).error);
  },
  async deleteScheduleItem(id) { check((await db().from("schedule_items").delete().eq("id", id)).error); },

  async createTicket(input) {
    const email = input.email.toLowerCase();
    const find = async () => (await db().from("tickets").select("*, promotions(name)").eq("email", email).maybeSingle()).data;
    const existing = await find();
    if (existing) return { ticket: toTicket(existing), existing: true };
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await db().from("tickets").insert({
        token: newTicketToken(), code: newTicketCode(), first_name: input.firstName, last_name: input.lastName, email, ticket_type: input.ticketType, promotion_id: input.promotionId,
      }).select("*, promotions(name)").single();
      if (!error) return { ticket: toTicket(data), existing: false };
      if (error.code === "23505") { const again = await find(); if (again) return { ticket: toTicket(again), existing: true }; continue; } // collision de code : on retente
      throw new Error(error.message);
    }
    throw new Error("err.ticketGen");
  },
  async getTicketByToken(token) { const { data } = await db().from("tickets").select("*, promotions(name)").eq("token", token).maybeSingle(); return data ? toTicket(data) : null; },
  async listTickets() { const { data, error } = await db().from("tickets").select("*, promotions(name)").order("created_at", { ascending: false }); check(error); return (data ?? []).map(toTicket); },
  async checkIn(key, by): Promise<CheckInResult> {
    const { data, error } = await db().rpc("check_in_ticket", { p_key: key.trim(), p_by: by }); check(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.result === "invalid") return { result: "invalid" };
    const { data: t } = await db().from("tickets").select("*, promotions(name)").eq("id", row.ticket_id).single();
    return { result: row.result, ticket: t ? toTicket(t) : undefined };
  },

  async checkInTeam(teamCode, by): Promise<CheckInResult> {
    const { data: t } = await db().from("teams").select("id, name, players(id, first_name, last_name, checked_in_at)").eq("team_code", teamCode.trim().toUpperCase()).maybeSingle();
    if (!t) return { result: "invalid" };
    const info = { name: t.name as string, players: (t.players ?? []).map((p: any) => `${p.first_name} ${p.last_name}`) };
    const { data: updated, error } = await db().from("players").update({ checked_in_at: new Date().toISOString(), checked_in_by: by }).eq("team_id", t.id).is("checked_in_at", null).select("id");
    check(error);
    return { result: (updated?.length ?? 0) > 0 ? "valid" : "already", team: info };
  },

  async supportTeam(teamId, fingerprint) {
    const { error } = await db().from("team_supports").insert({ team_id: teamId, fingerprint });
    const already = error?.code === "23505";
    if (error && !already) throw new Error(error.message);
    const { data } = await db().from("teams").select("supporters_count").eq("id", teamId).single();
    return { count: data?.supporters_count ?? 0, already };
  },

  async getProfile(userId) {
    const { data } = await db().from("profiles").select("*").eq("id", userId).maybeSingle();
    return data ? ({ id: data.id, email: data.email, firstName: data.first_name, lastName: data.last_name, role: data.role } as Profile) : null;
  },
  async getPlayerContext(profile): Promise<PlayerContext> {
    let { data: p } = await db().from("players").select("*").eq("profile_id", profile.id).maybeSingle();
    if (!p) { // lien tardif par email (joueur inscrit avant la création du compte)
      const r = await db().from("players").select("*").eq("email", profile.email.toLowerCase()).maybeSingle();
      p = r.data;
      if (p) await db().from("players").update({ profile_id: profile.id }).eq("id", p.id);
    }
    return { profile, player: p ? toPlayer(p) : null, team: p ? await this.getTeamById(p.team_id) : null };
  },
  async listNotifications(profileId) {
    const { data, error } = await db().from("notifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(30); check(error);
    return (data ?? []).map((n: any): AppNotification => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, readAt: n.read_at, createdAt: n.created_at }));
  },
  async addNotification(profileId, n) { check((await db().from("notifications").insert({ profile_id: profileId, kind: n.kind, title: n.title, body: n.body ?? null })).error); },
  async markNotificationsRead(profileId) { await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", profileId).is("read_at", null); },

  // ── Pronostics ──────────────────────────────────────────────────────────
  async listPredictions(fingerprint) {
    let q = db().from("predictions").select("*");
    if (fingerprint) q = q.eq("fingerprint", fingerprint);
    const { data, error } = await q; check(error);
    return (data ?? []).map((p: any): Prediction => ({ id: p.id, matchId: p.match_id, teamId: p.team_id, displayName: p.display_name, points: p.points, scored: p.scored, createdAt: p.created_at }));
  },
  async savePrediction(matchId, teamId, fingerprint, displayName, profileId) {
    const { data: m } = await db().from("matches").select("status").eq("id", matchId).maybeSingle();
    if (!m || m.status !== "upcoming") return "locked"; // verrouillé au coup d'envoi
    const { error } = await db().from("predictions").upsert(
      { match_id: matchId, team_id: teamId, fingerprint, display_name: displayName, profile_id: profileId },
      { onConflict: "match_id,fingerprint" },
    );
    check(error);
    return "saved";
  },
  async predictionStandings(): Promise<PredictionStanding[]> {
    const { data, error } = await db().from("predictions").select("display_name, points"); check(error);
    const by = new Map<string, PredictionStanding>();
    for (const r of (data ?? []) as any[]) {
      const name = (r.display_name as string | null)?.trim() || "Anonyme";
      const e = by.get(name) ?? { name, points: 0, picks: 0 };
      e.points += r.points ?? 0; e.picks += 1; by.set(name, e);
    }
    return [...by.values()].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  },
  async scorePredictions(matchId) {
    const { data, error } = await db().rpc("score_predictions", { p_match: matchId }); check(error);
    return (data as number) ?? 0;
  },

  // ── Encouragements ──────────────────────────────────────────────────────
  async listCheers(teamId, status) {
    let q = db().from("cheers").select("*, teams(name)").order("created_at", { ascending: false }).limit(200);
    if (teamId) q = q.eq("team_id", teamId);
    if (status) q = q.eq("status", status);
    const { data, error } = await q; check(error);
    return (data ?? []).map((c: any): Cheer => ({ id: c.id, teamId: c.team_id, teamName: c.teams?.name, author: c.author, message: c.message, status: c.status, createdAt: c.created_at }));
  },
  async addCheer(teamId, author, message, fingerprint) {
    check((await db().from("cheers").insert({ team_id: teamId, author, message, fingerprint })).error);
  },
  async moderateCheer(id, status, byProfileId) {
    check((await db().from("cheers").update({ status, moderated_by: byProfileId, moderated_at: new Date().toISOString() }).eq("id", id)).error);
  },

  // ── Galerie ─────────────────────────────────────────────────────────────
  async listPhotos() {
    const { data, error } = await db().from("gallery_photos").select("*").order("sort_order"); check(error);
    return (data ?? []).map((p: any): GalleryPhoto => ({ id: p.id, url: p.url, caption: p.caption, credit: p.credit, teamId: p.team_id, sortOrder: p.sort_order }));
  },
  async addPhoto(p) {
    const { count } = await db().from("gallery_photos").select("id", { count: "exact", head: true });
    check((await db().from("gallery_photos").insert({ url: p.url, caption: p.caption, credit: p.credit, team_id: p.teamId, sort_order: (count ?? 0) + 1 })).error);
  },
  async deletePhoto(id) { check((await db().from("gallery_photos").delete().eq("id", id)).error); },

  // ── Bénévoles ───────────────────────────────────────────────────────────
  async listShifts(): Promise<VolunteerShift[]> {
    const { data, error } = await db().from("volunteer_shifts").select("*, courts(name), volunteer_assignments(id, name)").order("starts_at"); check(error);
    return (data ?? []).map((s: any): VolunteerShift => ({
      id: s.id, role: s.role, startsAt: s.starts_at, endsAt: s.ends_at, courtId: s.court_id, courtName: s.courts?.name ?? null,
      capacity: s.capacity, notes: s.notes, assigned: (s.volunteer_assignments ?? []).map((a: any) => ({ id: a.id, name: a.name })),
    }));
  },
  async saveShift(sh) {
    const row = { role: sh.role, starts_at: sh.startsAt, ends_at: sh.endsAt, court_id: sh.courtId, capacity: sh.capacity, notes: sh.notes };
    check((sh.id ? await db().from("volunteer_shifts").update(row).eq("id", sh.id) : await db().from("volunteer_shifts").insert(row)).error);
  },
  async deleteShift(id) { check((await db().from("volunteer_shifts").delete().eq("id", id)).error); },
  async assignVolunteer(shiftId, name, email, phone) {
    const { data: sh } = await db().from("volunteer_shifts").select("capacity, volunteer_assignments(id)").eq("id", shiftId).maybeSingle();
    if (!sh || (sh.volunteer_assignments?.length ?? 0) >= sh.capacity) return "full";
    check((await db().from("volunteer_assignments").insert({ shift_id: shiftId, name, email, phone })).error);
    return "assigned";
  },
  async removeAssignment(id) { check((await db().from("volunteer_assignments").delete().eq("id", id)).error); },

  // ── Rappels ─────────────────────────────────────────────────────────────
  async matchesNeedingReminder(withinMinutes) {
    const now = new Date();
    const limit = new Date(now.getTime() + withinMinutes * 60_000);
    const { data, error } = await db().from("matches").select(MATCH_SELECT)
      .eq("status", "upcoming").is("reminder_sent_at", null)
      .gt("scheduled_at", now.toISOString()).lte("scheduled_at", limit.toISOString());
    check(error);
    return (data ?? []).map(toMatch);
  },
  async markReminderSent(matchId) {
    check((await db().from("matches").update({ reminder_sent_at: new Date().toISOString() }).eq("id", matchId)).error);
  },

  async adminStats(): Promise<AdminStats> {
    const c = async (table: string, f?: (q: any) => any) => { let q = db().from(table).select("id", { count: "exact", head: true }); if (f) q = f(q); return (await q).count ?? 0; };
    const [totalTeams, qualifiedTeams, players, tickets, checkedIn, practiceBookings, upcomingMatches, liveMatches] = await Promise.all([
      c("teams", (q) => q.eq("kind", "student")), c("teams", (q) => q.in("status", ["qualified", "semi_finalist", "finalist", "champion"])), c("players"), c("tickets"),
      c("tickets", (q) => q.not("checked_in_at", "is", null)), c("practice_registrations", (q) => q.eq("status", "booked")),
      c("matches", (q) => q.in("status", ["upcoming", "check_in", "warm_up"])), c("matches", (q) => q.eq("status", "live")),
    ]);
    return { totalTeams, qualifiedTeams, players, tickets, checkedIn, practiceBookings, upcomingMatches, liveMatches };
  },
};
