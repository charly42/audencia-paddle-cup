"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { EventMode, Match, TournamentSlug } from "@/lib/types";

interface LiveState { matches: Match[]; mode: EventMode; connected: boolean }
const Ctx = createContext<LiveState>({ matches: [], mode: "pre_event", connected: false });
export const useLive = () => useContext(Ctx);
export const useTournamentMatches = (t: TournamentSlug) => useLive().matches.filter((m) => m.tournament === t);

/**
 * Temps réel : Supabase Realtime (postgres_changes) déclenche un rafraîchissement léger via /api/live.
 * Sans Realtime (mode démo, coupure) : polling intelligent — seulement onglet visible, plus lent si Realtime est connecté.
 */
export function LiveProvider({ initialMatches, initialMode, children }: { initialMatches: Match[]; initialMode: EventMode; children: React.ReactNode }) {
  const [matches, setMatches] = useState(initialMatches);
  const [mode, setMode] = useState(initialMode);
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { mode: EventMode; matches: Match[] };
      setMatches(json.matches); setMode(json.mode);
    } catch { /* réseau instable : on réessaie au prochain tick */ }
  }, []);
  const debounced = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(refresh, 250); }, [refresh]);

  useEffect(() => {
    const sb = getBrowserSupabase();
    const channel = sb?.channel("live-tournament")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_settings" }, debounced)
      .subscribe((status: string) => { const ok = status === "SUBSCRIBED"; connectedRef.current = ok; setConnected(ok); if (ok) refresh(); });
    let stop = false;
    const tick = () => {
      if (stop) return;
      if (document.visibilityState === "visible") void refresh();
      setTimeout(tick, connectedRef.current ? 30_000 : 6_000);
    };
    const first = setTimeout(tick, 6_000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop = true; clearTimeout(first); document.removeEventListener("visibilitychange", onVisible); if (channel && sb) sb.removeChannel(channel); };
  }, [debounced, refresh]);

  const value = useMemo(() => ({ matches, mode, connected }), [matches, mode, connected]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
