import type { Match, Team } from "./types";

export type StepState = "done" | "current" | "todo";
export interface JourneyStep { key: string; label: string; state: StepState }

/** Parcours personnel d'une équipe, déduit de son statut et de ses matchs. */
export function buildJourney(team: Team, matches: Match[]): JourneyStep[] {
  const mine = matches.filter((m) => m.teamA?.id === team.id || m.teamB?.id === team.id);
  const played = (t: Match["tournament"], round?: Match["round"]) =>
    mine.some((m) => m.tournament === t && (!round || m.round === round) && m.status === "final");
  const has = (t: Match["tournament"], round?: Match["round"]) => mine.some((m) => m.tournament === t && (!round || m.round === round));
  const rank: Record<Team["status"], number> = { pending: 0, registered: 1, qualified: 2, eliminated: 2, semi_finalist: 4, finalist: 5, champion: 6 };
  const r = rank[team.status];
  const steps: { key: string; label: string; done: boolean }[] = [
    { key: "registered", label: "REGISTERED", done: true },
    { key: "qualifiers", label: "PING-PONG QUALIFIERS", done: r >= 2 || played("qualifiers") },
    { key: "qualified", label: "QUALIFIED FOR PADEL CUP", done: r >= 2 },
    { key: "group", label: "GROUP STAGE", done: r >= 3 || played("main-event", "group") },
    { key: "quarter", label: "QUARTER FINALS", done: r >= 4 || played("main-event", "quarter") },
    { key: "semi", label: "SEMI FINALS", done: r >= 5 || played("main-event", "semi") },
    { key: "final", label: "FINAL", done: r >= 6 || played("main-event", "final") },
    { key: "champion", label: "CHAMPIONS", done: team.status === "champion" },
  ];
  void has;
  let currentSet = false;
  return steps.map((s) => {
    if (s.done) return { key: s.key, label: s.label, state: "done" as StepState };
    if (!currentSet && team.status !== "eliminated") { currentSet = true; return { key: s.key, label: s.label, state: "current" as StepState }; }
    return { key: s.key, label: s.label, state: "todo" as StepState };
  });
}
