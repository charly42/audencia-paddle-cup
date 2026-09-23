"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export interface AdminNavItem { href: string; label: string }
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const path = usePathname();
  const t = useT();
  return (
    <nav aria-label={t("a11y.adminNav")} className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:overflow-visible">
      {items.map((i) => {
        const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={cn("shrink-0 rounded-xl px-4 py-3 text-sm font-extrabold tracking-wider min-h-11 flex items-center", on ? "bg-lime text-ink" : "text-white/85 hover:bg-white/10")}>{i.label}</Link>;
      })}
    </nav>
  );
}
