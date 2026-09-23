"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { computeGlobalScore, type GlobalScore as GS } from "@/lib/global-score";
import { LiveIndicator, ScoreNumber } from "./primitives";
import { useTournamentMatches } from "./LiveProvider";
import { useRoundText } from "./MatchCards";
import { useT } from "@/lib/i18n/provider";
import { StatusBadge } from "@/components/ui/Badge";
import type { Match } from "@/lib/types";

/** Module STAFF vs STUDENTS (format Ryder Cup). Fonctionne avec des données fournies ou en temps réel. */
export function GlobalScoreView({ score, dark = true, showGames = true }: { score: GS; dark?: boolean; showGames?: boolean }) {
  const t = useT();
  const lead = score.students === score.staff ? null : score.students > score.staff ? "students" : "staff";
  const side = (label: string, value: number, leading: boolean, align: "left" | "right") => (
    <div className={cn("flex-1", align === "right" ? "text-right" : "text-left")}>
      <p className="display-md text-2xl md:text-5xl">{label}</p>
      <ScoreNumber value={value} className={cn("text-[7rem] md:text-[14rem]", leading ? "text-lime" : dark ? "text-white" : "text-ink")} />
    </div>
  );
  return (
    <div className={cn("rounded-[2rem] p-6 md:p-10", dark ? "on-dark bg-blue text-white court-lines" : "bg-white border border-ink/10")}>
      <p className="text-center text-xs md:text-sm font-extrabold tracking-[.3em] opacity-80">{t("global.title")}</p>
      <div className="flex items-end justify-between gap-2 mt-2">
        {side(t("global.students"), score.students, lead === "students", "left")}
        <span className="display text-3xl md:text-6xl pb-6 md:pb-12 opacity-70">VS</span>
        {side(t("global.staff"), score.staff, lead === "staff", "right")}
      </div>
      {showGames && (
        <ol className="mt-6 grid gap-2 md:grid-cols-3">
          {score.games.map((g) => <GameRow key={g.id} g={g} dark={dark} />)}
        </ol>
      )}
      <p className="mt-4 text-center text-[11px] opacity-60">{t("global.note")}</p>
    </div>
  );
}
function GameRow({ g, dark }: { g: Match; dark: boolean }) {
  const t = useT();
  const roundText = useRoundText();
  return (
    <li className={cn("rounded-2xl px-4 py-3", dark ? "bg-white/10" : "bg-mist")}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-extrabold tracking-widest">{roundText(g)}</span>
        {g.status === "live" ? <LiveIndicator label={t("status.live")} /> : <StatusBadge status={g.status} className="!py-0.5" />}
      </div>
      <p className="text-sm font-bold flex justify-between gap-2"><span className="truncate">{g.teamA?.name ?? t("common.tbd")}</span><span className="num text-xl">{g.scoreA}</span></p>
      <p className="text-sm font-bold flex justify-between gap-2"><span className="truncate">{g.teamB?.name ?? t("common.tbd")}</span><span className="num text-xl">{g.scoreB}</span></p>
      <p className="text-[11px] opacity-70 mt-1">{g.pointsValue} {g.pointsValue > 1 ? t("global.pts") : t("global.pt")}</p>
    </li>
  );
}
export function LiveGlobalScore(props: { dark?: boolean; showGames?: boolean }) {
  const matches = useTournamentMatches("staff-vs-students");
  const score = useMemo(() => computeGlobalScore(matches), [matches]);
  return <GlobalScoreView score={score} {...props} />;
}
