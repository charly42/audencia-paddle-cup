import type { Role } from "./types";

export type AdminArea = "dashboard" | "teams" | "matches" | "scores" | "live" | "check-in" | "tickets" | "practice" | "content" | "exports";

/** Matrice rôles → modules admin. SCORE MANAGER : scores uniquement. CHECK-IN : scan uniquement. */
const ACCESS: Record<Role, AdminArea[]> = {
  super_admin: ["dashboard", "teams", "matches", "scores", "live", "check-in", "tickets", "practice", "content", "exports"],
  event_admin: ["dashboard", "teams", "matches", "scores", "live", "check-in", "tickets", "practice", "content", "exports"],
  score_manager: ["dashboard", "scores"],
  checkin_staff: ["dashboard", "check-in"],
  player: [],
};
export const canAccess = (role: Role, area: AdminArea) => ACCESS[role]?.includes(area) ?? false;
export const isAdminRole = (role: Role) => role !== "player";
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "SUPER ADMIN", event_admin: "EVENT ADMIN", score_manager: "SCORE MANAGER", checkin_staff: "CHECK-IN STAFF", player: "PLAYER",
};
