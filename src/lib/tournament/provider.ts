import type { Match, MatchFilter, MatchPatch, RoundKey, TournamentSlug } from "../types";

export interface TournamentInfo { slug: TournamentSlug; name: string; provider: "local" | "challonge"; status: "draft" | "running" | "finished" }
export interface Participant { id: string; name: string; teamId: string | null }
export interface BracketRound { round: RoundKey; roundOrder: number; matches: Match[] }

/**
 * Abstraction du moteur de tournoi. Les pages front n'appellent QUE cette interface :
 * elles ne savent pas si le moteur est local ou Challonge.
 */
export interface TournamentProvider {
  readonly name: "local" | "challonge";
  getTournament(slug: TournamentSlug): Promise<TournamentInfo>;
  getParticipants(slug: TournamentSlug): Promise<Participant[]>;
  getMatches(slug: TournamentSlug, filter?: Omit<MatchFilter, "tournament">): Promise<Match[]>;
  getBracket(slug: TournamentSlug, filter?: Omit<MatchFilter, "tournament">): Promise<BracketRound[]>;
  createParticipant(slug: TournamentSlug, teamId: string): Promise<void>;
  updateMatch(matchId: string, patch: MatchPatch): Promise<Match | null>;
  reportScore(matchId: string, scoreA: number, scoreB: number, final?: boolean): Promise<Match | null>;
}
