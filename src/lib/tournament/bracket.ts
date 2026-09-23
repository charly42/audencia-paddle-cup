import type { Match } from "../types";
import type { BracketRound } from "./provider";

/** Groupe les matchs par round (ordre croissant) ; positions triées dans chaque round. */
export function buildBracket(matches: Match[]): BracketRound[] {
  const map = new Map<string, BracketRound>();
  for (const m of matches) {
    const r = map.get(m.round) ?? { round: m.round, roundOrder: m.roundOrder, matches: [] };
    r.matches.push(m);
    map.set(m.round, r);
  }
  return [...map.values()]
    .map((r) => ({ ...r, matches: r.matches.sort((a, b) => a.position - b.position || (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")) }))
    .sort((a, b) => a.roundOrder - b.roundOrder);
}

export const winnerOf = (m: Match) => (m.status !== "final" || m.scoreA === m.scoreB ? null : m.scoreA > m.scoreB ? m.teamA : m.teamB);
