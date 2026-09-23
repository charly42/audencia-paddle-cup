import type { EventMode, MatchStatus, RoundKey, SkillLevel, TeamStatus, TicketType } from "./types";

export const TZ = "Europe/Paris";

/** Clés de traduction (voir lib/i18n). Les libellés bruts ci-dessous ne servent que de repli. */
export const matchStatusKey = (s: MatchStatus) => `mstatus.${s}`;
export const teamStatusKey = (s: TeamStatus) => `tstatus.${s}`;
export const roundKey = (r: RoundKey) => `round.${r}`;

/**
 * Libellé de tour traduit, utilisable côté serveur comme côté client :
 * passez `t` (translator serveur ou useT client).
 */
export function roundText(m: { round: RoundKey; gameNo: number | null }, t: (k: string, v?: Record<string, string | number>) => string) {
  if (m.round !== "game") return t(roundKey(m.round));
  return m.gameNo === 3 ? t("round.decider") : t("round.gameNo", { n: String(m.gameNo ?? "").padStart(2, "0") });
}
export const roundShortKey = (r: RoundKey) => `round.${r}Short`;
export const modeKey = (m: EventMode) => `mode.${m}`;
export const skillKey = (s: SkillLevel) => `level.${s}`;
export const ticketKey = (t: TicketType) => `ticket.${t}`;
export const levelKey = (l: string) => `level.${l}`;

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  upcoming: "UPCOMING", check_in: "CHECK-IN", warm_up: "WARM-UP", live: "LIVE",
  final: "FINAL", postponed: "POSTPONED", cancelled: "CANCELLED",
};
export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  registered: "REGISTERED", pending: "PENDING", qualified: "QUALIFIED", eliminated: "ELIMINATED",
  semi_finalist: "SEMI-FINALIST", finalist: "FINALIST", champion: "CHAMPION",
};
export const ROUND_LABEL: Record<RoundKey, string> = {
  group: "GROUP STAGE", r16: "ROUND OF 16", quarter: "QUARTER FINALS", semi: "SEMI FINALS", final: "FINAL", game: "GAME",
};
export const ROUND_SHORT: Record<RoundKey, string> = {
  group: "GROUP", r16: "R16", quarter: "QUARTERS", semi: "SEMIS", final: "FINAL", game: "GAME",
};
export const MODE_LABEL: Record<EventMode, string> = { pre_event: "PRE-EVENT", live: "LIVE", post_event: "POST-EVENT" };
export const SKILL_LABEL: Record<SkillLevel, string> = { beginner: "BEGINNER", intermediate: "INTERMEDIATE", advanced: "ADVANCED" };
export const TICKET_LABEL: Record<TicketType, string> = { spectator: "SPECTATOR", supporter: "SUPPORTER", staff: "STAFF", player: "PLAYER" };
export const LEVEL_LABEL: Record<string, string> = { all: "ALL LEVELS", beginner: "BEGINNER", intermediate: "INTERMEDIATE", advanced: "ADVANCED" };

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "TBC";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}
/** Date formatée dans la langue du visiteur (fr-FR / en-GB), fuseau Europe/Paris. */
export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }, locale: "fr" | "en" = "en") {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { ...opts, timeZone: TZ }).format(new Date(iso));
}
export function formatDateFr(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(iso));
}
export function weekday(dateStr: string, locale: "fr" | "en" = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { weekday: "long", timeZone: TZ }).format(new Date(dateStr + "T12:00:00")).toUpperCase();
}
export function shortDay(dateStr: string, locale: "fr" | "en" = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(dateStr + "T12:00:00")).toUpperCase();
}
export const hhmm = (t: string) => t.slice(0, 5);
