import "server-only";
import { repo } from "../repo";
import type { Match, MatchPatch, RoundKey, TournamentSlug } from "../types";
import { LocalTournamentProvider } from "./local";
import type { Participant, TournamentInfo } from "./provider";

/**
 * Provider Challonge (API v1). Toutes les requêtes passent par le SERVEUR : la clé n'est jamais envoyée au navigateur.
 * Stratégie : la base locale reste la source d'affichage (temps réel, cartes, etc.) ;
 * Challonge fait office de moteur de bracket, synchronisé via sync() et alimenté par reportScore().
 * ⚠️ Non testé sans clé/tournoi Challonge réels — à valider avant usage en production (voir README).
 */
const BASE = "https://api.challonge.com/v1";

async function call<T>(path: string, init?: RequestInit & { form?: Record<string, string> }): Promise<T> {
  const key = process.env.CHALLONGE_API_KEY;
  if (!key) throw new Error("CHALLONGE_API_KEY manquante.");
  const body = init?.form ? new URLSearchParams({ api_key: key, ...init.form }) : undefined;
  const url = `${BASE}${path}.json${init?.form ? "" : `?api_key=${encodeURIComponent(key)}`}`;
  const res = await fetch(url, { ...init, body, cache: "no-store", headers: body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined });
  if (!res.ok) throw new Error(`Challonge ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface CParticipant { participant: { id: number; name: string } }
interface CMatch { match: { id: number; state: string; round: number; player1_id: number | null; player2_id: number | null; scores_csv: string; winner_id: number | null; suggested_play_order: number } }

export class ChallongeTournamentProvider extends LocalTournamentProvider {
  readonly name: "local" | "challonge" = "challonge";
  private tid = process.env.CHALLONGE_TOURNAMENT_ID!;

  async getTournament(slug: TournamentSlug): Promise<TournamentInfo> { return { ...(await super.getTournament(slug)), provider: "challonge" }; }

  async getParticipants(slug: TournamentSlug): Promise<Participant[]> {
    if (slug !== "main-event") return super.getParticipants(slug);
    const list = await call<CParticipant[]>(`/tournaments/${this.tid}/participants`);
    const teams = await repo.listTeams();
    return list.map(({ participant: p }) => ({ id: String(p.id), name: p.name, teamId: teams.find((t) => t.name.toLowerCase() === p.name.toLowerCase())?.id ?? null }));
  }

  async createParticipant(slug: TournamentSlug, teamId: string) {
    await super.createParticipant(slug, teamId);
    if (slug !== "main-event") return;
    const team = await repo.getTeamById(teamId);
    if (team) await call(`/tournaments/${this.tid}/participants`, { method: "POST", form: { "participant[name]": team.name } });
  }

  /** Challonge → base locale (matchs du Main Event). Retourne le nombre de matchs synchronisés. */
  async sync(): Promise<number> {
    const [participants, matches, local] = await Promise.all([
      call<CParticipant[]>(`/tournaments/${this.tid}/participants`),
      call<CMatch[]>(`/tournaments/${this.tid}/matches`),
      repo.listMatches({ tournament: "main-event" }),
    ]);
    const teams = await repo.listTeams();
    const teamByPid = new Map<number, string>();
    participants.forEach(({ participant: p }) => { const t = teams.find((x) => x.name.toLowerCase() === p.name.toLowerCase()); if (t) teamByPid.set(p.id, t.id); });
    const maxRound = Math.max(...matches.map((m) => m.match.round), 1);
    const roundKey = (r: number): RoundKey => (r === maxRound ? "final" : r === maxRound - 1 ? "semi" : r === maxRound - 2 ? "quarter" : "group");
    let n = 0;
    for (const { match: c } of matches) {
      const [sa, sb] = (c.scores_csv || "0-0").split("-").map((x) => parseInt(x, 10) || 0);
      const state = c.state === "complete" ? "final" : "upcoming";
      const existing = local.find((m: Match) => m.externalId === String(c.id));
      const teamAId = c.player1_id ? teamByPid.get(c.player1_id) ?? null : null;
      const teamBId = c.player2_id ? teamByPid.get(c.player2_id) ?? null : null;
      if (existing) {
        const patch: MatchPatch = { teamAId, teamBId };
        if (existing.status !== "live") Object.assign(patch, { scoreA: sa, scoreB: sb, status: existing.status === "final" ? "final" : state });
        await this.updateMatch(existing.id, patch);
      } else {
        await repo.createMatch({ tournament: "main-event", teamAId, teamBId, courtId: null, scheduledAt: null, round: roundKey(c.round), position: c.suggested_play_order });
      }
      n++;
    }
    return n;
  }

  /** Score local d'abord (temps réel), puis poussé vers Challonge (best effort, jamais bloquant pour l'affichage). */
  async reportScore(matchId: string, scoreA: number, scoreB: number, final = false) {
    const m = await super.reportScore(matchId, scoreA, scoreB, final);
    if (m?.externalId && final && m.teamA && m.teamB) {
      try {
        const parts = await call<CParticipant[]>(`/tournaments/${this.tid}/participants`);
        const pid = (name: string) => parts.find((p) => p.participant.name.toLowerCase() === name.toLowerCase())?.participant.id;
        const winner = scoreA >= scoreB ? m.teamA : m.teamB;
        await call(`/tournaments/${this.tid}/matches/${m.externalId}`, { method: "PUT", form: { "match[scores_csv]": `${scoreA}-${scoreB}`, "match[winner_id]": String(pid(winner.name) ?? "") } });
      } catch (e) { console.error("[challonge] push score failed", e); }
    }
    return m;
  }
}
