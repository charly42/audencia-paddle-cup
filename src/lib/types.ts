export type EventMode = "pre_event" | "live" | "post_event";
export type MatchStatus = "upcoming" | "check_in" | "warm_up" | "live" | "final" | "postponed" | "cancelled";
export type TeamStatus = "registered" | "pending" | "qualified" | "eliminated" | "semi_finalist" | "finalist" | "champion";
export type TeamKind = "student" | "staff";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Role = "player" | "super_admin" | "event_admin" | "score_manager" | "checkin_staff";
export type TicketType = "spectator" | "supporter" | "staff" | "player";
export type TournamentSlug = "qualifiers" | "main-event" | "staff-vs-students";
export type RoundKey = "group" | "r16" | "quarter" | "semi" | "final" | "game";

export interface Promotion { id: string; name: string; slug: string; program: string | null; active: boolean }

export interface PublicPlayer {
  id: string; firstName: string; lastName: string; photoUrl: string | null; isCaptain: boolean;
}
export interface Player extends PublicPlayer {
  teamId: string; profileId: string | null; email: string | null; phone: string | null; skillLevel: SkillLevel;
  checkedInAt: string | null;
}
export interface TeamLite { id: string; name: string; slug: string; kind: TeamKind; promotionName: string | null }
export interface Team extends TeamLite {
  teamCode: string; promotionId: string | null; program: string | null; status: TeamStatus;
  photoUrl: string | null; description: string | null; supportersCount: number; isDemo: boolean;
  createdAt: string; players: PublicPlayer[];
}

export interface Court { id: string; name: string; sortOrder: number; active: boolean }

export interface Match {
  id: string; tournament: TournamentSlug;
  teamA: TeamLite | null; teamB: TeamLite | null;
  scoreA: number; scoreB: number;
  courtId: string | null; courtName: string | null;
  scheduledAt: string | null; startedAt: string | null; endedAt: string | null;
  status: MatchStatus; paused: boolean;
  round: RoundKey; roundOrder: number; position: number;
  promotionId: string | null; gameNo: number | null; pointsValue: number;
  externalId: string | null; updatedAt: string;
}
export interface MatchPatch {
  scoreA?: number; scoreB?: number; status?: MatchStatus; paused?: boolean;
  courtId?: string | null; scheduledAt?: string | null; startedAt?: string | null; endedAt?: string | null;
  teamAId?: string | null; teamBId?: string | null;
}
export interface MatchFilter {
  tournament?: TournamentSlug; round?: RoundKey; courtId?: string; teamId?: string;
  status?: MatchStatus; promotionId?: string;
}

export interface PracticeSession {
  id: string; date: string; startTime: string; durationMin: number; courtsCount: number;
  capacity: number; spotsLeft: number; coach: boolean; level: string; status: string;
  location: string; waitlistEnabled: boolean; bookedTeams: TeamLite[]; waitlistCount: number;
}
export interface PracticeRegistration {
  id: string; sessionId: string; teamId: string; status: "booked" | "waitlist" | "cancelled"; createdAt: string;
}

export interface Ticket {
  id: string; token: string; code: string; firstName: string; lastName: string; email: string;
  ticketType: TicketType; promotionId: string | null; promotionName: string | null;
  checkedInAt: string | null; createdAt: string;
}
export type CheckInResult = { result: "valid" | "already" | "invalid"; ticket?: Ticket; team?: { name: string; players: string[] } };

export type AnnouncementLevel = "info" | "warning" | "urgent";
export type Locale = "fr" | "en";

export interface EventSettings {
  eventMode: EventMode; eventName: string; eventDate: string | null; venue: string;
  registrationOpen: boolean; registrationDeadline: string | null; ticketingOpen: boolean;
  ticketCapacity: number | null; headline: string; tagline: string;
  supportersAwardEnabled: boolean; sponsorsEnabled: boolean;
  /** Annonce d'urgence diffusée sur le site ET sur les écrans campus. */
  announcementFr: string | null; announcementEn: string | null;
  announcementLevel: AnnouncementLevel; announcementUntil: string | null;
  defaultLocale: Locale;
  /** Modules activables par l'organisation. */
  predictionsEnabled: boolean; cheersEnabled: boolean; galleryEnabled: boolean; volunteersEnabled: boolean;
}

export interface Prediction { id: string; matchId: string; teamId: string; displayName: string | null; points: number; scored: boolean; createdAt: string }
export interface PredictionStanding { name: string; points: number; picks: number }
export interface Cheer { id: string; teamId: string; teamName?: string; author: string; message: string; status: "pending" | "approved" | "rejected"; createdAt: string }
export interface GalleryPhoto { id: string; url: string; caption: string | null; credit: string | null; teamId: string | null; sortOrder: number }
export interface VolunteerShift {
  id: string; role: string; startsAt: string; endsAt: string; courtId: string | null; courtName: string | null;
  capacity: number; notes: string | null; assigned: { id: string; name: string }[];
}

export interface Partner { id: string; name: string; logoUrl: string | null; website: string | null; tier: "main" | "partner" | "supporter"; description: string | null; sortOrder: number; active: boolean }
export interface ScheduleItem { id: string; startTime: string; title: string; description: string | null; sortOrder: number }
export interface AppNotification { id: string; kind: string; title: string; body: string | null; readAt: string | null; createdAt: string }

export interface Profile { id: string; email: string; firstName: string | null; lastName: string | null; role: Role }
export interface PlayerContext { profile: Profile; player: Player | null; team: Team | null }

export interface AdminStats {
  totalTeams: number; qualifiedTeams: number; players: number; tickets: number; checkedIn: number;
  practiceBookings: number; upcomingMatches: number; liveMatches: number;
}

export interface RegisterTeamInput {
  teamName: string; promotionId: string; program: string; photoUrl?: string | null;
  players: { firstName: string; lastName: string; email: string; phone: string; skillLevel: SkillLevel }[];
}
export type ContentMap = Record<string, unknown>;

export interface ActionResult<T = unknown> { ok: boolean; error?: string; data?: T }
