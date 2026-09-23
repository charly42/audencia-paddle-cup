import type { Match } from "./types";

export interface GlobalScore {
  students: number; staff: number; games: Match[]; decided: boolean;
}

/** Score global STAFF vs STUDENTS : somme des points des jeux terminés (points_value configurable). */
export function computeGlobalScore(matches: Match[]): GlobalScore {
  const games = matches.filter((m) => m.tournament === "staff-vs-students" && m.gameNo != null).sort((a, b) => (a.gameNo ?? 0) - (b.gameNo ?? 0));
  let students = 0, staff = 0;
  for (const g of games) {
    if (g.status !== "final" || g.scoreA === g.scoreB) continue;
    const winner = g.scoreA > g.scoreB ? g.teamA : g.teamB;
    if (!winner) continue;
    if (winner.kind === "staff") staff += g.pointsValue; else students += g.pointsValue;
  }
  return { students, staff, games, decided: games.length > 0 && games.every((g) => g.status === "final") };
}
