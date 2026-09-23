"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, GitBranch, Home, Swords, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomLabels { home: string; match: string; bracket: string; practice: string; profile: string; aria: string }

/** Bottom navigation joueur (mobile) — affichée quand une session est détectée. */
export function BottomNav({ labels }: { labels: BottomLabels }) {
  const path = usePathname();
  const ITEMS = [
    { href: "/player", label: labels.home, icon: Home },
    { href: "/player#next-match", label: labels.match, icon: Swords },
    { href: "/tournament/main-event", label: labels.bracket, icon: GitBranch },
    { href: "/tournament/practice", label: labels.practice, icon: CalendarCheck },
    { href: "/player/profile", label: labels.profile, icon: UserRound },
  ];
  return (
    <nav aria-label={labels.aria} className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-ink text-white pb-safe border-t border-white/10">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const on = path === href.split("#")[0] && !href.includes("#");
          return (
            <li key={label}>
              <Link href={href} aria-current={on ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-extrabold tracking-wider", on ? "text-lime" : "text-white/80")}>
                <Icon size={21} aria-hidden />{label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
