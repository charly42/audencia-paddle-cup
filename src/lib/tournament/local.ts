import "server-only";
import { repo } from "../repo";
import type { Match, MatchFilter, MatchPatch, TeamStatus, TournamentSlug } from "../types";
import { buildBracket, winnerOf } from "./bracket";
import type { Participant, TournamentInfo, TournamentProvider } from "./provider";

const NAMES: Record<TournamentSlug, string> = { qualifiers: "Ping-pong Qualifiers", "main-event": "Student Padel Cup", "staff-vs-students": "STAFF vs STUDENTS" };
const RANK: Record<TeamStatus, number> = { pending: 0, registered: 1, eliminated: 1, qualified: 2, semi_finalist: 4, finalist: 5, champion: 6 };

async function setStatus(teamId: string | undefined, next: TeamStatus) {
  if (!teamId) return;
  const t = await repo.getTeamById(teamId);
  if (!t) return;
  const ok = next === "eliminated" ? RANK[t.status] <= 2 : RANK[next] >= RANK[t.status];
  if (ok && t.status !== next) await repo.updateTeam(teamId, { status: next });
}

/** Progression automatique des statuts d'équipe quand un match se termine. */
export async function applyProgression(m: Match) {
  const w = winnerOf(m);
  if (!w || !m.teamA || !m.teamB) return;
  const loser = w.id === m.teamA.id ? m.teamB : m.teamA;
  if (m.tournament === "qualifiers") { await setStatus(w.id, "qualified"); await setStatus(loser.id, "eliminated"); }
  else if (m.tournament === "main-event") {
    if (m.round === "quarter") { await setStatus(w.id, "semi_finalist"); await setStatus(loser.id, "eliminated"); }
    if (m.round === "semi") { await setStatus(loser.id, "semi_finalist"); await setStatus(w.id, "finalist"); }
    if (m.round === "final") { await setStatus(loser.id, "finalist"); await setStatus(w.id, "champion"); }
  }
}

export class LocalTournamentProvider implements TournamentProvider {
  readonly name: "local" | "challonge" = "local";

  async getTournament(slug: TournamentSlug): Promise<TournamentInfo> {
    const matches = await repo.listMatches({ tournament: slug });
    const status = !matches.length ? "draft" : matches.every((m) => m.status === "final") ? "finished" : "running";
    return { slug, name: NAMES[slug], provider: this.name, status };
  }
  async getParticipants(slug: TournamentSlug): Promise<Participant[]> {
    const teams = await repo.listTeams();
    const pool = slug === "qualifiers" ? teams.filter((t) => t.kind === "student")
      : slug === "main-event" ? teams.filter((t) => t.kind === "student" && RANK[t.status] >= 2)
      : teams.filter((t) => t.kind === "staff" || RANK[t.status] >= 2);
    return pool.map((t) => ({ id: t.id, name: t.name, teamId: t.id }));
  }
  async getMatches(slug: TournamentSlug, filter: Omit<MatchFilter, "tournament"> = {}) { return repo.listMatches({ ...filter, tournament: slug }); }
  async getBracket(slug: TournamentSlug, filter: Omit<MatchFilter, "tournament"> = {}) { return buildBracket(await this.getMatches(slug, filter)); }
  async createParticipant(slug: TournamentSlug, teamId: string) {
    if (slug === "main-event") await setStatus(teamId, "qualified");
  }
  async updateMatch(matchId: string, patch: MatchPatch) {
    const before = await repo.getMatch(matchId);
    const now = new Date().toISOString();
    const full: MatchPatch = { ...patch };
    if (patch.status === "live" && !before?.startedAt) full.startedAt = now;
    if (patch.status === "final") full.endedAt = now;
    if (patch.status && patch.status !== "live") full.paused = false;
    const after = await repo.updateMatch(matchId, full);
    if (after && patch.status === "final" && before?.status !== "final") await applyProgression(after);
    return after;
  }
  async reportScore(matchId: string, scoreA: number, scoreB: number, final = false) {
    return this.updateMatch(matchId, { scoreA, scoreB, ...(final ? { status: "final" as const } : {}) });
  }
}
