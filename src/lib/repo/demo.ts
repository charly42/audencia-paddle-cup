import type {
  Cheer, GalleryPhoto, Prediction, PredictionStanding, VolunteerShift,
  AdminStats, AppNotification, CheckInResult, Court, EventSettings, Match, MatchFilter, MatchPatch, Partner, Player, PlayerContext,
  PracticeRegistration, PracticeSession, Profile, Promotion, ScheduleItem, Team, TeamLite, Ticket, TournamentSlug, MatchStatus, RoundKey, TeamStatus,
} from "../types";
import type { BookResult, Repo, TeamFilter } from "./types";
import { buildDemoData, did } from "./demo-data";
import { newTicketCode, newTicketToken } from "../tokens";
import { slugify } from "../utils";

type Data = ReturnType<typeof buildDemoData>;
interface Store {
  d: Data; settings: EventSettings; content: Record<string, unknown>; partners: Partner[]; notifications: (AppNotification & { profileId: string })[];
  supports: Set<string>; courts: Court[]; seq: number; checkedTeams: Set<string>; reminded: Set<string>;
  predictions: (Prediction & { fingerprint: string })[]; cheers: Cheer[]; photos: GalleryPhoto[];
  shifts: (Omit<VolunteerShift, "assigned" | "courtName">)[]; assignments: { id: string; shiftId: string; name: string }[];
}
const g = globalThis as unknown as { __apcDemo?: Store };

function store(): Store {
  if (!g.__apcDemo) {
    const d = buildDemoData();
    g.__apcDemo = {
      d, content: {}, seq: 1000, supports: new Set(), notifications: [], checkedTeams: new Set(), reminded: new Set(),
      predictions: [], cheers: [], photos: [], shifts: [], assignments: [],
      courts: ["Court 01", "Court 02", "Court 03", "Court 04", "Court 05", "Court 06", "Court 07", "Center Court"].map((name, i) => ({ id: did("009", i + 1), name, sortOrder: i + 1, active: true })),
      settings: {
        eventMode: "live", eventName: "AUDENCIA PADEL CUP", eventDate: null, venue: "4PADEL Saint-Ouen", registrationOpen: true,
        registrationDeadline: null, ticketingOpen: true, ticketCapacity: null, headline: "STAFF vs STUDENTS",
        tagline: "QUALIFY. REPRESENT. PLAY. CHALLENGE.", supportersAwardEnabled: false, sponsorsEnabled: false,
        announcementFr: null, announcementEn: null, announcementLevel: "info", announcementUntil: null, defaultLocale: "fr",
        predictionsEnabled: true, cheersEnabled: true, galleryEnabled: true, volunteersEnabled: false,
      },
      partners: [
        { id: did("00a", 1), name: "Audencia", logoUrl: null, website: null, tier: "main", description: "Campus Paris Saint-Ouen", sortOrder: 1, active: true },
        { id: did("00a", 2), name: "4PADEL Saint-Ouen", logoUrl: null, website: null, tier: "main", description: "29 rue Émile Cordon, 93400 Saint-Ouen-sur-Seine", sortOrder: 2, active: true },
      ],
    };
  }
  return g.__apcDemo;
}

const nextId = (kind: string) => did(kind, ++store().seq);

// ── Mapping ────────────────────────────────────────────────────────
function promoName(id: string | null) { return store().d.promotions.find((p) => p.id === id)?.name ?? null; }
function lite(id: string | null): TeamLite | null {
  if (!id) return null;
  const t = store().d.teams.find((x) => x.id === id);
  return t ? { id: t.id, name: t.name, slug: t.slug, kind: t.kind, promotionName: promoName(t.promotion_id) } : null;
}
function toTeam(t: Data["teams"][number]): Team {
  const s = store();
  return {
    id: t.id, name: t.name, slug: t.slug, kind: t.kind, promotionName: promoName(t.promotion_id), teamCode: t.team_code,
    promotionId: t.promotion_id, program: t.program, status: t.status as TeamStatus, photoUrl: t.photo_url, description: t.description,
    supportersCount: t.supporters_count, isDemo: t.is_demo, createdAt: t.created_at,
    players: s.d.players.filter((p) => p.team_id === t.id).map((p) => ({ id: p.id, firstName: p.first_name, lastName: p.last_name, photoUrl: p.photo_url, isCaptain: p.is_captain })),
  };
}
function toMatch(r: Record<string, any>): Match { // eslint-disable-line @typescript-eslint/no-explicit-any
  const court = store().courts.find((c) => c.name === r.court_name || c.id === r.court_id);
  return {
    id: r.id, tournament: r.tournament_slug, teamA: lite(r.team_a_id), teamB: lite(r.team_b_id), scoreA: r.team_a_score, scoreB: r.team_b_score,
    courtId: court?.id ?? null, courtName: court?.name ?? null, scheduledAt: r.scheduled_at, startedAt: r.started_at, endedAt: r.ended_at,
    status: r.status, paused: r.paused, round: r.round, roundOrder: r.round_order, position: r.position, promotionId: r.promotion_id,
    gameNo: r.game_no, pointsValue: r.points_value, externalId: null, updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}
function toTicket(t: Data["tickets"][number]): Ticket {
  return {
    id: t.id, token: t.token, code: t.code, firstName: t.first_name, lastName: t.last_name, email: t.email, ticketType: t.ticket_type as Ticket["ticketType"],
    promotionId: t.promotion_id, promotionName: promoName(t.promotion_id), checkedInAt: t.checked_in_at, createdAt: t.created_at,
  };
}
function toPlayer(p: Data["players"][number]): Player {
  return {
    id: p.id, teamId: p.team_id, profileId: `demo:${p.email}`, firstName: p.first_name, lastName: p.last_name, photoUrl: p.photo_url, isCaptain: p.is_captain,
    email: p.email, phone: p.phone, skillLevel: p.skill_level as Player["skillLevel"], checkedInAt: null,
  };
}

const DEMO_ADMINS: Profile[] = [
  { id: "demo:super_admin", email: "super@demo.test", firstName: "Super", lastName: "Admin", role: "super_admin" },
  { id: "demo:event_admin", email: "event@demo.test", firstName: "Event", lastName: "Admin", role: "event_admin" },
  { id: "demo:score_manager", email: "score@demo.test", firstName: "Score", lastName: "Manager", role: "score_manager" },
  { id: "demo:checkin_staff", email: "checkin@demo.test", firstName: "Check-in", lastName: "Staff", role: "checkin_staff" },
];

export const demoRepo: Repo = {
  kind: "demo",
  async hasDemoData() { return true; },
  async getSettings() { return { ...store().settings }; },
  async updateSettings(patch) { store().settings = { ...store().settings, ...patch }; },
  async getContent() { return { ...store().content }; },
  async setContent(key, value) { store().content[key] = value; },

  async listPromotions() { return store().d.promotions.map((p): Promotion => ({ id: p.id, name: p.name, slug: p.slug, program: p.program, active: p.active })); },
  async listTeams(f: TeamFilter = {}) {
    let list = store().d.teams.map(toTeam);
    if (f.promotionId) list = list.filter((t) => t.promotionId === f.promotionId);
    if (f.status) list = list.filter((t) => t.status === f.status);
    if (f.kind) list = list.filter((t) => t.kind === f.kind);
    if (f.q) list = list.filter((t) => t.name.toLowerCase().includes(f.q!.toLowerCase()));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },
  async getTeamBySlug(slug) { const t = store().d.teams.find((x) => x.slug === slug); return t ? toTeam(t) : null; },
  async getTeamById(id) { const t = store().d.teams.find((x) => x.id === id); return t ? toTeam(t) : null; },
  async updateTeam(id, patch) {
    const t = store().d.teams.find((x) => x.id === id); if (!t) return;
    if (patch.name !== undefined) t.name = patch.name;
    if (patch.slug !== undefined) t.slug = patch.slug;
    if (patch.promotionId !== undefined) t.promotion_id = patch.promotionId;
    if (patch.program !== undefined) t.program = patch.program;
    if (patch.status !== undefined) t.status = patch.status;
    if (patch.description !== undefined) t.description = patch.description;
    if (patch.photoUrl !== undefined) t.photo_url = patch.photoUrl;
  },
  async registerTeam(input) {
    const s = store(); const id = nextId("002");
    const base = slugify(input.teamName) || "team"; let slug = base, i = 2;
    while (s.d.teams.some((t) => t.slug === slug)) slug = `${base}-${i++}`;
    const promo = s.d.promotions.find((p) => p.id === input.promotionId);
    const row = {
      id, team_code: `APC-${newTicketCode(6)}`, name: input.teamName, slug, promotion_id: promo?.id ?? null, program: input.program, kind: "student" as const,
      status: "registered", photo_url: input.photoUrl ?? null, description: null, supporters_count: 0, is_demo: true as const, created_at: new Date().toISOString(),
    };
    s.d.teams.push(row);
    input.players.forEach((p, idx) =>
      s.d.players.push({ id: nextId("003"), team_id: id, first_name: p.firstName, last_name: p.lastName, email: p.email.toLowerCase(), phone: p.phone, skill_level: p.skillLevel, is_captain: idx === 0, photo_url: null, is_demo: true }),
    );
    return { team: toTeam(row), teamCode: row.team_code, playerProfileIds: input.players.map((p) => `demo:${p.email.toLowerCase()}`) };
  },
  async listPlayers() { return store().d.players.map((p) => ({ ...toPlayer(p), teamName: store().d.teams.find((t) => t.id === p.team_id)?.name ?? "" })); },

  async listMatches(f: MatchFilter = {}) {
    let list = store().d.matches.map(toMatch);
    if (f.tournament) list = list.filter((m) => m.tournament === f.tournament);
    if (f.round) list = list.filter((m) => m.round === f.round);
    if (f.courtId) list = list.filter((m) => m.courtId === f.courtId);
    if (f.teamId) list = list.filter((m) => m.teamA?.id === f.teamId || m.teamB?.id === f.teamId);
    if (f.status) list = list.filter((m) => m.status === f.status);
    if (f.promotionId) list = list.filter((m) => m.promotionId === f.promotionId);
    return list.sort((a, b) => a.roundOrder - b.roundOrder || a.position - b.position || (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  },
  async getMatch(id) { const r = store().d.matches.find((m) => m.id === id); return r ? toMatch(r) : null; },
  async updateMatch(id, patch: MatchPatch) {
    const r = store().d.matches.find((m) => m.id === id) as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!r) return null;
    if (patch.scoreA !== undefined) r.team_a_score = patch.scoreA;
    if (patch.scoreB !== undefined) r.team_b_score = patch.scoreB;
    if (patch.status !== undefined) r.status = patch.status as MatchStatus;
    if (patch.paused !== undefined) r.paused = patch.paused;
    if (patch.courtId !== undefined) r.court_name = store().courts.find((c) => c.id === patch.courtId)?.name ?? null;
    if (patch.scheduledAt !== undefined) r.scheduled_at = patch.scheduledAt;
    if (patch.startedAt !== undefined) r.started_at = patch.startedAt;
    if (patch.endedAt !== undefined) r.ended_at = patch.endedAt;
    if (patch.teamAId !== undefined) r.team_a_id = patch.teamAId;
    if (patch.teamBId !== undefined) r.team_b_id = patch.teamBId;
    r.updated_at = new Date().toISOString();
    return toMatch(r);
  },
  async createMatch(i) {
    store().d.matches.push({
      id: nextId("004"), tournament_slug: i.tournament, team_a_id: i.teamAId, team_b_id: i.teamBId, team_a_score: 0, team_b_score: 0,
      court_name: store().courts.find((c) => c.id === i.courtId)?.name ?? null, scheduled_at: i.scheduledAt, status: "upcoming", paused: false,
      round: i.round as RoundKey, round_order: ({ group: 1, r16: 2, quarter: 2, semi: 3, final: 4, game: 9 } as Record<string, number>)[i.round] ?? 1, position: i.position,
      promotion_id: i.promotionId ?? null, game_no: i.gameNo ?? null, points_value: i.pointsValue ?? 1, is_demo: true, started_at: null, ended_at: null,
    } as never);
  },
  async listCourts() { return [...store().courts]; },

  async listPractice() {
    const s = store();
    return s.d.practice_sessions.map((p): PracticeSession => {
      const regs = s.d.practice_registrations.filter((r) => r.practice_session_id === p.id);
      const booked = regs.filter((r) => r.status === "booked");
      return {
        id: p.id, date: p.session_date as string, startTime: p.start_time as string, durationMin: p.duration_min as number, courtsCount: p.courts_count as number,
        capacity: p.capacity as number, spotsLeft: Math.max((p.capacity as number) - booked.length * 2, 0), coach: p.coach as boolean, level: p.level as string,
        status: p.status as string, location: p.location as string, waitlistEnabled: p.waitlist_enabled as boolean,
        bookedTeams: booked.map((r) => lite(r.team_id)).filter(Boolean) as TeamLite[], waitlistCount: regs.filter((r) => r.status === "waitlist").length,
      };
    }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  },
  async listPracticeForTeam(teamId) {
    return store().d.practice_registrations.filter((r) => r.team_id === teamId && r.status !== "cancelled")
      .map((r): PracticeRegistration => ({ id: r.id, sessionId: r.practice_session_id, teamId: r.team_id, status: r.status as PracticeRegistration["status"], createdAt: r.created_at }));
  },
  async bookPractice(sessionId, teamId, profileId): Promise<BookResult> {
    const s = store(); const p = s.d.practice_sessions.find((x) => x.id === sessionId);
    if (!p || p.status !== "open") return "closed";
    if (s.d.practice_registrations.some((r) => r.practice_session_id === sessionId && r.team_id === teamId && r.status !== "cancelled")) return "duplicate";
    const taken = s.d.practice_registrations.filter((r) => r.practice_session_id === sessionId && r.status === "booked").length * 2;
    const status = taken + 2 <= (p.capacity as number) ? "booked" : p.waitlist_enabled ? "waitlist" : null;
    if (!status) return "full";
    s.d.practice_registrations.push({ id: nextId("006"), practice_session_id: sessionId, team_id: teamId, profile_id: profileId, status, created_at: new Date().toISOString() });
    return status as BookResult;
  },
  async cancelPractice(registrationId) {
    const s = store(); const r = s.d.practice_registrations.find((x) => x.id === registrationId);
    if (!r || r.status === "cancelled") return null;
    const wasBooked = r.status === "booked"; r.status = "cancelled";
    if (!wasBooked) return null;
    const p = s.d.practice_sessions.find((x) => x.id === r.practice_session_id)!;
    const next = s.d.practice_registrations.filter((x) => x.practice_session_id === r.practice_session_id && x.status === "waitlist")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    const taken = s.d.practice_registrations.filter((x) => x.practice_session_id === r.practice_session_id && x.status === "booked").length * 2;
    if (next && taken + 2 <= (p.capacity as number)) { next.status = "booked"; return next.team_id; }
    return null;
  },
  async createPracticeSession(i) {
    store().d.practice_sessions.push({ id: nextId("005"), session_date: i.date, start_time: i.startTime + ":00", duration_min: i.durationMin, courts_count: i.courtsCount, capacity: i.capacity, coach: i.coach, level: i.level, status: "open", location: "4PADEL Saint-Ouen", waitlist_enabled: true, is_demo: true });
  },
  async listPracticeRegistrations() {
    const s = store();
    return s.d.practice_registrations.map((r) => {
      const p = s.d.practice_sessions.find((x) => x.id === r.practice_session_id)!;
      return { id: r.id, sessionLabel: `${p.session_date} ${(p.start_time as string).slice(0, 5)}`, teamName: s.d.teams.find((t) => t.id === r.team_id)?.name ?? "", status: r.status, createdAt: r.created_at };
    });
  },

  async listPartners(all = false) { return store().partners.filter((p) => all || p.active).sort((a, b) => a.sortOrder - b.sortOrder); },
  async savePartner(p) {
    const s = store(); const i = s.partners.findIndex((x) => x.id === p.id);
    if (i >= 0) s.partners[i] = { ...s.partners[i], ...p, id: p.id! }; else s.partners.push({ ...p, id: nextId("00a") });
  },
  async deletePartner(id) { store().partners = store().partners.filter((p) => p.id !== id); },
  async listSchedule() {
    return store().d.schedule_items.filter((i) => i.active).map((i): ScheduleItem => ({ id: i.id, startTime: i.start_time, title: i.title, description: i.description, sortOrder: i.sort_order }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async saveScheduleItem(i) {
    const s = store(); const idx = s.d.schedule_items.findIndex((x) => x.id === i.id);
    const row = { id: i.id ?? nextId("007"), start_time: i.startTime, title: i.title, description: i.description, sort_order: i.sortOrder, active: true, is_demo: true as const };
    if (idx >= 0) s.d.schedule_items[idx] = row; else s.d.schedule_items.push(row);
  },
  async deleteScheduleItem(id) { const s = store(); s.d.schedule_items = s.d.schedule_items.filter((i) => i.id !== id); },

  async createTicket(input) {
    const s = store(); const email = input.email.toLowerCase();
    const found = s.d.tickets.find((t) => t.email.toLowerCase() === email);
    if (found) return { ticket: toTicket(found), existing: true };
    const row = { id: nextId("008"), token: newTicketToken(), code: newTicketCode(), first_name: input.firstName, last_name: input.lastName, email, ticket_type: input.ticketType, promotion_id: input.promotionId, checked_in_at: null as string | null, checked_in_by: null as string | null, created_at: new Date().toISOString(), is_demo: true as const };
    s.d.tickets.push(row);
    return { ticket: toTicket(row), existing: false };
  },
  async getTicketByToken(token) { const t = store().d.tickets.find((x) => x.token === token); return t ? toTicket(t) : null; },
  async listTickets() { return store().d.tickets.map(toTicket).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async checkIn(key, by): Promise<CheckInResult> {
    const t = store().d.tickets.find((x) => x.token === key || x.code === key.trim().toUpperCase());
    if (!t) return { result: "invalid" };
    if (t.checked_in_at) return { result: "already", ticket: toTicket(t) };
    t.checked_in_at = new Date().toISOString(); t.checked_in_by = by;
    return { result: "valid", ticket: toTicket(t) };
  },

  async checkInTeam(teamCode, _by): Promise<CheckInResult> {
    const s = store(); const t = s.d.teams.find((x) => x.team_code === teamCode.trim().toUpperCase());
    if (!t) return { result: "invalid" };
    const info = { name: t.name, players: s.d.players.filter((p) => p.team_id === t.id).map((p) => `${p.first_name} ${p.last_name}`) };
    if (s.checkedTeams.has(t.id)) return { result: "already", team: info };
    s.checkedTeams.add(t.id);
    return { result: "valid", team: info };
  },

  async supportTeam(teamId, fp) {
    const s = store(); const t = s.d.teams.find((x) => x.id === teamId);
    if (!t) return { count: 0, already: false };
    const k = `${teamId}:${fp}`;
    if (s.supports.has(k)) return { count: t.supporters_count, already: true };
    s.supports.add(k); t.supporters_count += 1;
    return { count: t.supporters_count, already: false };
  },

  async getProfile(userId) {
    const admin = DEMO_ADMINS.find((a) => a.id === userId); if (admin) return admin;
    const email = userId.replace(/^demo:/, "");
    const p = store().d.players.find((x) => x.email === email);
    return p ? { id: userId, email, firstName: p.first_name, lastName: p.last_name, role: "player" } : null;
  },
  async getPlayerContext(profile): Promise<PlayerContext> {
    const p = store().d.players.find((x) => x.email === profile.email);
    const team = p ? store().d.teams.find((t) => t.id === p.team_id) : null;
    return { profile, player: p ? toPlayer(p) : null, team: team ? toTeam(team) : null };
  },
  async listNotifications(profileId) { return store().notifications.filter((n) => n.profileId === profileId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async addNotification(profileId, n) { store().notifications.push({ id: nextId("00b"), profileId, kind: n.kind, title: n.title, body: n.body ?? null, readAt: null, createdAt: new Date().toISOString() }); },
  async markNotificationsRead(profileId) { store().notifications.forEach((n) => { if (n.profileId === profileId) n.readAt = new Date().toISOString(); }); },

  // ── Pronostics ──────────────────────────────────────────────────────────
  async listPredictions(fingerprint) {
    return store().predictions.filter((p) => !fingerprint || p.fingerprint === fingerprint)
      .map(({ fingerprint: _f, ...p }) => p);
  },
  async savePrediction(matchId, teamId, fingerprint, displayName, _profileId) {
    const s = store();
    const m = s.d.matches.find((x) => x.id === matchId);
    if (!m || m.status !== "upcoming") return "locked"; // fermé dès le coup d'envoi
    const found = s.predictions.find((p) => p.matchId === matchId && p.fingerprint === fingerprint);
    if (found) { found.teamId = teamId; found.displayName = displayName; return "saved"; }
    s.predictions.push({ id: nextId("00c"), matchId, teamId, fingerprint, displayName, points: 0, scored: false, createdAt: new Date().toISOString() });
    return "saved";
  },
  async predictionStandings(): Promise<PredictionStanding[]> {
    const by = new Map<string, PredictionStanding>();
    for (const p of store().predictions) {
      const name = p.displayName?.trim() || "Anonyme";
      const e = by.get(name) ?? { name, points: 0, picks: 0 };
      e.points += p.points; e.picks += 1; by.set(name, e);
    }
    return [...by.values()].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  },
  async scorePredictions(matchId) {
    const s = store();
    const m = s.d.matches.find((x) => x.id === matchId);
    if (!m || m.status !== "final" || m.team_a_score === m.team_b_score) return 0;
    const winner = m.team_a_score > m.team_b_score ? m.team_a_id : m.team_b_id;
    let n = 0;
    for (const p of s.predictions) {
      if (p.matchId !== matchId || p.scored) continue;
      p.points = p.teamId === winner ? 1 : 0; p.scored = true; n++;
    }
    return n;
  },

  // ── Encouragements ──────────────────────────────────────────────────────
  async listCheers(teamId, status) {
    return store().cheers.filter((c) => (!teamId || c.teamId === teamId) && (!status || c.status === status))
      .map((c) => ({ ...c, teamName: store().d.teams.find((t) => t.id === c.teamId)?.name }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addCheer(teamId, author, message, _fingerprint) {
    store().cheers.push({ id: nextId("00d"), teamId, author, message, status: "pending", createdAt: new Date().toISOString() });
  },
  async moderateCheer(id, status, _by) {
    const c = store().cheers.find((x) => x.id === id); if (c) c.status = status;
  },

  // ── Galerie ─────────────────────────────────────────────────────────────
  async listPhotos() { return [...store().photos].sort((a, b) => a.sortOrder - b.sortOrder); },
  async addPhoto(p) { const s = store(); s.photos.push({ id: nextId("00e"), ...p, sortOrder: s.photos.length + 1 }); },
  async deletePhoto(id) { store().photos = store().photos.filter((p) => p.id !== id); },

  // ── Bénévoles ───────────────────────────────────────────────────────────
  async listShifts(): Promise<VolunteerShift[]> {
    const s = store();
    return s.shifts.map((sh) => ({
      ...sh, courtName: s.courts.find((c) => c.id === sh.courtId)?.name ?? null,
      assigned: s.assignments.filter((a) => a.shiftId === sh.id).map((a) => ({ id: a.id, name: a.name })),
    })).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
  async saveShift(sh) {
    const s = store(); const i = s.shifts.findIndex((x) => x.id === sh.id);
    const row = { id: sh.id ?? nextId("00f"), role: sh.role, startsAt: sh.startsAt, endsAt: sh.endsAt, courtId: sh.courtId, capacity: sh.capacity, notes: sh.notes };
    if (i >= 0) s.shifts[i] = row; else s.shifts.push(row);
  },
  async deleteShift(id) { const s = store(); s.shifts = s.shifts.filter((x) => x.id !== id); s.assignments = s.assignments.filter((a) => a.shiftId !== id); },
  async assignVolunteer(shiftId, name, _email, _phone) {
    const s = store(); const sh = s.shifts.find((x) => x.id === shiftId); if (!sh) return "full";
    if (s.assignments.filter((a) => a.shiftId === shiftId).length >= sh.capacity) return "full";
    s.assignments.push({ id: nextId("010"), shiftId, name }); return "assigned";
  },
  async removeAssignment(id) { const s = store(); s.assignments = s.assignments.filter((a) => a.id !== id); },

  // ── Rappels ─────────────────────────────────────────────────────────────
  async matchesNeedingReminder(withinMinutes) {
    const now = Date.now(), limit = now + withinMinutes * 60_000;
    return (await this.listMatches()).filter((m) => m.scheduledAt && m.status === "upcoming"
      && new Date(m.scheduledAt).getTime() > now && new Date(m.scheduledAt).getTime() <= limit
      && !store().reminded.has(m.id));
  },
  async markReminderSent(matchId) { store().reminded.add(matchId); },

  async adminStats(): Promise<AdminStats> {
    const s = store();
    return {
      totalTeams: s.d.teams.filter((t) => t.kind === "student").length,
      qualifiedTeams: s.d.teams.filter((t) => ["qualified", "semi_finalist", "finalist", "champion"].includes(t.status)).length,
      players: s.d.players.length, tickets: s.d.tickets.length, checkedIn: s.d.tickets.filter((t) => t.checked_in_at).length,
      practiceBookings: s.d.practice_registrations.filter((r) => r.status === "booked").length,
      upcomingMatches: s.d.matches.filter((m) => ["upcoming", "check_in", "warm_up"].includes(m.status as string)).length,
      liveMatches: s.d.matches.filter((m) => m.status === "live").length,
    };
  },
};

export const DEMO_PROFILES = DEMO_ADMINS;
export function demoPlayerChoices() { return store().d.players.filter((p) => p.is_captain).slice(0, 6).map((p) => ({ email: p.email, name: `${p.first_name} ${p.last_name}`, team: store().d.teams.find((t) => t.id === p.team_id)?.name ?? "" })); }
void (null as unknown as TournamentSlug);
