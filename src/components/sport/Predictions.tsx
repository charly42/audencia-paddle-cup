"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { savePredictionAction } from "@/lib/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatTime, ROUND_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLive } from "./LiveProvider";
import type { Match, Prediction, PredictionStanding } from "@/lib/types";

const NAME_KEY = "apc_pred_name";

/**
 * Pronostics : un choix par match, verrouillé au coup d'envoi.
 * Le pseudo est conservé dans le navigateur pour ne pas le ressaisir à chaque match.
 */
export function PredictionBoard({ initialMine, standings, labels }: {
  initialMine: Prediction[]; standings: PredictionStanding[];
  labels: { pick: string; locked: string; saved: string; yourName: string; points: string; empty: string; leaderboard: string; closesAt: string; save: string };
}) {
  const { matches } = useLive();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [mine, setMine] = useState<Record<string, string>>(Object.fromEntries(initialMine.map((p) => [p.matchId, p.teamId])));
  const [pending, start] = useTransition();
  useEffect(() => { try { setName(localStorage.getItem(NAME_KEY) ?? ""); } catch { /* stockage indisponible */ } }, []);

  const open = useMemo(() => matches.filter((m) => m.status === "upcoming" && m.teamA && m.teamB)
    .sort((a, b) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9")), [matches]);
  const closed = useMemo(() => matches.filter((m) => m.status !== "upcoming" && mine[m.id]), [matches, mine]);

  const pick = (m: Match, teamId: string) => {
    if (name.trim().length < 2) { toast(labels.yourName, "error"); return; }
    try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* noop */ }
    start(async () => {
      const r = await savePredictionAction({ matchId: m.id, teamId, displayName: name.trim() });
      if (r.ok) { setMine((s) => ({ ...s, [m.id]: teamId })); toast(labels.saved); }
      else toast(r.error ?? "Erreur", "error");
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr] items-start">
      <div>
        <div className="mb-5 max-w-sm">
          <Input aria-label={labels.yourName} placeholder={labels.yourName} value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
        </div>
        {open.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {open.map((m) => (
              <li key={m.id} className="rounded-3xl bg-white border border-ink/10 p-4">
                <p className="text-xs font-extrabold tracking-widest text-slate mb-1">{ROUND_LABEL[m.round]} · {formatTime(m.scheduledAt)}</p>
                <p className="text-[11px] font-bold text-slate mb-3">{labels.closesAt}</p>
                <div className="grid gap-2">
                  {[m.teamA!, m.teamB!].map((t) => {
                    const chosen = mine[m.id] === t.id;
                    return (
                      <button key={t.id} type="button" disabled={pending} aria-pressed={chosen} onClick={() => pick(m, t.id)}
                        className={cn("flex items-center justify-between gap-3 rounded-2xl px-4 py-3 min-h-14 border-2 text-left font-extrabold",
                          chosen ? "bg-blue border-blue text-white" : "bg-white border-ink/15 hover:border-blue")}>
                        <span className="truncate">{t.name}</span>
                        <span className="text-xs tracking-widest shrink-0">{chosen ? "✓ " + labels.pick : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title={labels.locked} body={labels.empty} />}

        {closed.length > 0 && (
          <section className="mt-8">
            <h2 className="display-md text-2xl mb-3">{labels.locked}</h2>
            <ul className="grid gap-2">
              {closed.map((m) => {
                const picked = [m.teamA, m.teamB].find((t) => t?.id === mine[m.id]);
                const won = m.status === "final" && m.scoreA !== m.scoreB && ((m.scoreA > m.scoreB ? m.teamA : m.teamB)?.id === mine[m.id]);
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-ink/10 px-4 py-3">
                    <span className="font-bold truncate">{m.teamA?.name} — {m.teamB?.name}</span>
                    <span className={cn("text-xs font-extrabold shrink-0", m.status === "final" ? (won ? "text-ok" : "text-slate") : "text-slate")}>
                      {picked?.name} {m.status === "final" ? (won ? "✓ +1" : "✕ 0") : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <aside className="rounded-3xl bg-white border border-ink/10 p-5">
        <h2 className="display-md text-3xl mb-3 flex items-center gap-2"><Trophy size={22} aria-hidden />{labels.leaderboard}</h2>
        {standings.length ? (
          <ol className="divide-y divide-ink/10">
            {standings.slice(0, 20).map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 py-2.5">
                <span className="num text-3xl text-blue w-9">{i + 1}</span>
                <span className="flex-1 font-extrabold truncate">{s.name}</span>
                <span className="num text-3xl">{s.points}</span>
                <span className="text-[11px] font-bold text-slate">{labels.points}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-slate font-semibold">{labels.empty}</p>}
      </aside>
    </div>
  );
}
