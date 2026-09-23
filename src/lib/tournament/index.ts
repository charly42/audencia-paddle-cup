import "server-only";
import { tournamentProviderName } from "../env";
import { ChallongeTournamentProvider } from "./challonge";
import { LocalTournamentProvider } from "./local";
import type { TournamentProvider } from "./provider";

const challongeReady = Boolean(process.env.CHALLONGE_API_KEY && process.env.CHALLONGE_TOURNAMENT_ID);
/** Si Challonge n'est pas configuré, tout fonctionne en local. */
export const tournament: TournamentProvider =
  tournamentProviderName === "challonge" && challongeReady ? new ChallongeTournamentProvider() : new LocalTournamentProvider();
export { ChallongeTournamentProvider };
export type { TournamentProvider, BracketRound, Participant, TournamentInfo } from "./provider";
