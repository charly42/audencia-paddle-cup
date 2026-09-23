"use client";
import { MatchFilters } from "./LiveWidgets";
import { useLive } from "./LiveProvider";
import type { Court, TournamentSlug } from "@/lib/types";

/** Liste filtrable de tous les matchs d'un ou plusieurs tournois, en temps réel. */
export function LiveMatchList({ tournaments, courts }: { tournaments: TournamentSlug[]; courts: Court[] }) {
  const { matches } = useLive();
  return <MatchFilters matches={matches.filter((m) => tournaments.includes(m.tournament))} courts={courts} />;
}
