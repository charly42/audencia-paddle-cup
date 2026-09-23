"use client";
import { CheckCircle2, Circle, Clock, Flame, Flag, Hourglass, Medal, PauseCircle, Trophy, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchStatusKey, teamStatusKey } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { MatchStatus, TeamStatus } from "@/lib/types";

export function Badge({ children, tone = "ink", className }: { children: React.ReactNode; tone?: "ink" | "blue" | "lime" | "light" | "danger"; className?: string }) {
  const tones = { ink: "bg-ink text-white", blue: "bg-blue text-white", lime: "bg-lime text-ink", light: "bg-mist text-ink", danger: "bg-danger text-white" };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wider whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

// Le statut n'est jamais porté par la couleur seule : icône + libellé.
const MATCH: Record<MatchStatus, { icon: React.ElementType; cls: string }> = {
  upcoming: { icon: Clock, cls: "bg-mist text-ink" },
  check_in: { icon: Flag, cls: "bg-blue-soft text-blue-deep" },
  warm_up: { icon: Flame, cls: "bg-blue-soft text-blue-deep" },
  live: { icon: Zap, cls: "bg-lime text-ink" },
  final: { icon: CheckCircle2, cls: "bg-ink text-white" },
  postponed: { icon: PauseCircle, cls: "bg-white text-ink border border-ink/40" },
  cancelled: { icon: XCircle, cls: "bg-danger text-white" },
};
export function StatusBadge({ status, className }: { status: MatchStatus; className?: string }) {
  const { icon: Icon, cls } = MATCH[status];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wider whitespace-nowrap", cls, className)}><Icon size={13} aria-hidden />{useT()(matchStatusKey(status))}</span>;
}

const TEAM: Record<TeamStatus, { icon: React.ElementType; cls: string }> = {
  registered: { icon: Circle, cls: "bg-mist text-ink" },
  pending: { icon: Hourglass, cls: "bg-white text-ink border border-ink/40" },
  qualified: { icon: CheckCircle2, cls: "bg-lime text-ink" },
  eliminated: { icon: XCircle, cls: "bg-ink/10 text-slate" },
  semi_finalist: { icon: Medal, cls: "bg-blue-soft text-blue-deep" },
  finalist: { icon: Medal, cls: "bg-blue text-white" },
  champion: { icon: Trophy, cls: "bg-lime text-ink ring-2 ring-ink" },
};
export function TeamStatusBadge({ status, className }: { status: TeamStatus; className?: string }) {
  const { icon: Icon, cls } = TEAM[status];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wider whitespace-nowrap", cls, className)}><Icon size={13} aria-hidden />{useT()(teamStatusKey(status))}</span>;
}
