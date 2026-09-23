import type {
  Cheer, GalleryPhoto, Prediction, PredictionStanding, VolunteerShift,
  AdminStats, AppNotification, CheckInResult, ContentMap, Court, EventSettings, Match, MatchFilter, MatchPatch, Partner, Player,
  PlayerContext, PracticeRegistration, PracticeSession, Profile, Promotion, RegisterTeamInput, ScheduleItem, Team, TeamKind, TeamStatus,
  Ticket, TicketType, TournamentSlug, RoundKey,
} from "../types";

export type BookResult = "booked" | "waitlist" | "full" | "duplicate" | "closed";

export interface TeamFilter { promotionId?: string; status?: TeamStatus; kind?: TeamKind; q?: string }
export interface TeamPatch { name?: string; slug?: string; promotionId?: string | null; program?: string | null; status?: TeamStatus; description?: string | null; photoUrl?: string | null }
export interface NewMatch {
  tournament: TournamentSlug; teamAId: string | null; teamBId: string | null; courtId: string | null; scheduledAt: string | null;
  round: RoundKey; position: number; promotionId?: string | null; gameNo?: number | null; pointsValue?: number;
}
export interface NewPractice { date: string; startTime: string; durationMin: number; courtsCount: number; capacity: number; coach: boolean; level: string }
export interface NewTicket { firstName: string; lastName: string; email: string; ticketType: TicketType; promotionId: string | null }
export interface PracticeRegistrationRow { id: string; sessionLabel: string; teamName: string; status: string; createdAt: string }

/** Contrat unique de la couche de données. Deux implémentations : demo (mémoire) et supabase. */
export interface Repo {
  readonly kind: "demo" | "supabase";
  hasDemoData(): Promise<boolean>;
  getSettings(): Promise<EventSettings>;
  updateSettings(patch: Partial<EventSettings>): Promise<void>;
  getContent(): Promise<ContentMap>;
  setContent(key: string, value: unknown): Promise<void>;

  listPromotions(): Promise<Promotion[]>;
  listTeams(filter?: TeamFilter): Promise<Team[]>;
  getTeamBySlug(slug: string): Promise<Team | null>;
  getTeamById(id: string): Promise<Team | null>;
  updateTeam(id: string, patch: TeamPatch): Promise<void>;
  registerTeam(input: RegisterTeamInput): Promise<{ team: Team; teamCode: string; playerProfileIds: (string | null)[] }>;
  listPlayers(): Promise<(Player & { teamName: string })[]>;

  listMatches(filter?: MatchFilter): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  updateMatch(id: string, patch: MatchPatch): Promise<Match | null>;
  createMatch(input: NewMatch): Promise<void>;
  listCourts(): Promise<Court[]>;

  listPractice(): Promise<PracticeSession[]>;
  listPracticeForTeam(teamId: string): Promise<PracticeRegistration[]>;
  bookPractice(sessionId: string, teamId: string, profileId: string | null): Promise<BookResult>;
  cancelPractice(registrationId: string): Promise<string | null>;
  createPracticeSession(input: NewPractice): Promise<void>;
  listPracticeRegistrations(): Promise<PracticeRegistrationRow[]>;

  listPartners(includeInactive?: boolean): Promise<Partner[]>;
  savePartner(p: Omit<Partner, "id"> & { id?: string }): Promise<void>;
  deletePartner(id: string): Promise<void>;
  listSchedule(): Promise<ScheduleItem[]>;
  saveScheduleItem(i: Omit<ScheduleItem, "id"> & { id?: string }): Promise<void>;
  deleteScheduleItem(id: string): Promise<void>;

  createTicket(input: NewTicket): Promise<{ ticket: Ticket; existing: boolean }>;
  getTicketByToken(token: string): Promise<Ticket | null>;
  listTickets(): Promise<Ticket[]>;
  checkIn(key: string, byProfileId: string | null): Promise<CheckInResult>;
  /** Arrivée d'une équipe complète via son Team ID (APC-XXXXXX). */
  checkInTeam(teamCode: string, byProfileId: string | null): Promise<CheckInResult>;

  supportTeam(teamId: string, fingerprint: string): Promise<{ count: number; already: boolean }>;

  getProfile(userId: string): Promise<Profile | null>;
  getPlayerContext(profile: Profile): Promise<PlayerContext>;
  listNotifications(profileId: string): Promise<AppNotification[]>;
  addNotification(profileId: string, n: { kind: string; title: string; body?: string }): Promise<void>;
  markNotificationsRead(profileId: string): Promise<void>;
  adminStats(): Promise<AdminStats>;

  // ── Pronostics ────────────────────────────────────────────────────────────
  listPredictions(fingerprint?: string): Promise<Prediction[]>;
  savePrediction(matchId: string, teamId: string, fingerprint: string, displayName: string, profileId: string | null): Promise<"saved" | "locked">;
  predictionStandings(): Promise<PredictionStanding[]>;
  /** Attribue les points d'un match terminé. Retourne le nombre de pronostics notés. */
  scorePredictions(matchId: string): Promise<number>;

  // ── Mur d'encouragements ──────────────────────────────────────────────────
  listCheers(teamId?: string, status?: Cheer["status"]): Promise<Cheer[]>;
  addCheer(teamId: string, author: string, message: string, fingerprint: string): Promise<void>;
  moderateCheer(id: string, status: "approved" | "rejected", byProfileId: string | null): Promise<void>;

  // ── Galerie ───────────────────────────────────────────────────────────────
  listPhotos(): Promise<GalleryPhoto[]>;
  addPhoto(p: { url: string; caption: string | null; credit: string | null; teamId: string | null }): Promise<void>;
  deletePhoto(id: string): Promise<void>;

  // ── Bénévoles ─────────────────────────────────────────────────────────────
  listShifts(): Promise<VolunteerShift[]>;
  saveShift(s: { id?: string; role: string; startsAt: string; endsAt: string; courtId: string | null; capacity: number; notes: string | null }): Promise<void>;
  deleteShift(id: string): Promise<void>;
  assignVolunteer(shiftId: string, name: string, email: string | null, phone: string | null): Promise<"assigned" | "full">;
  removeAssignment(id: string): Promise<void>;

  // ── Rappels automatiques ──────────────────────────────────────────────────
  /** Matchs démarrant dans la fenêtre donnée et dont le rappel n'a pas encore été envoyé. */
  matchesNeedingReminder(withinMinutes: number): Promise<Match[]>;
  markReminderSent(matchId: string): Promise<void>;
}
