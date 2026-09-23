"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, UserRound } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n";

export interface NavLabels {
  home: string; tournament: string; teams: string; schedule: string; tickets: string; rules: string; about: string;
  qualifiers: string; mainEvent: string; practice: string; playerSpace: string; register: string; getTickets: string;
  registerShort: string; getTicketsShort: string;
  menu: string; openMenu: string; live: string; langSwitch: string;
}

export function SiteHeader({ eventName, live, labels, locale }: { eventName: string; live: boolean; labels: NavLabels; locale: Locale }) {
  const SUB = [
    { href: "/tournament/qualifiers", label: labels.qualifiers },
    { href: "/tournament/main-event", label: labels.mainEvent },
    { href: "/tournament/practice", label: labels.practice },
  ];
  const LINKS = [{ href: "/", label: labels.home }, { href: "/teams", label: labels.teams }, { href: "/schedule", label: labels.schedule }, { href: "/tickets", label: labels.tickets }, { href: "/rules", label: labels.rules }, { href: "/about", label: labels.about }];
  const path = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const item = (href: string, label: string) => (
    <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
      className={cn("px-2.5 py-2 text-[13px] font-extrabold tracking-wide whitespace-nowrap rounded-full hover:bg-blue/10", active(href) && "bg-blue text-white hover:bg-blue")}>{label}</Link>
  );
  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-ink/10">
      {/* Conteneur un peu plus large que le reste du site : les libellés français sont plus longs. */}
      <div className="max-w-[88rem] mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 mr-1 shrink-0" aria-label={`${eventName} — home`}>
          <span className="grid place-items-center size-9 rounded-lg bg-blue text-lime display text-2xl pb-0.5">A</span>
          <span className="display text-[1.35rem] leading-none hidden sm:block">Audencia<br /><span className="text-blue">Padel Cup</span></span>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 min-w-0" aria-label={t("a11y.mainNav")}>
          {item("/", labels.home)}
          <div className="relative group">
            <Link href="/tournament" aria-haspopup="true" className={cn("px-2.5 py-2 text-[13px] font-extrabold tracking-wide whitespace-nowrap rounded-full hover:bg-blue/10 inline-flex items-center gap-1", active("/tournament") && "bg-blue text-white hover:bg-blue")}>
              {labels.tournament} <ChevronDown size={14} aria-hidden />
            </Link>
            <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
              <div className="bg-white rounded-2xl shadow-2xl border border-ink/10 p-2 min-w-56">
                {SUB.map((s) => <Link key={s.href} href={s.href} className="block px-4 py-3 rounded-xl text-sm font-extrabold tracking-wider whitespace-nowrap hover:bg-blue-soft">{s.label}</Link>)}
              </div>
            </div>
          </div>
          {/* « Billets » n'apparaît pas ici : le bouton « Réserver » y mène déjà (le lien reste dans le menu mobile). */}
          {LINKS.slice(1).filter((l) => l.href !== "/tickets").map((l) => item(l.href, l.label))}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {live && <span className="hidden 2xl:inline-flex items-center gap-1.5 text-xs font-extrabold text-danger whitespace-nowrap"><span className="size-2 rounded-full bg-danger animate-live" />{labels.live}</span>}
          <LanguageSwitcher locale={locale} label={labels.langSwitch} />
          <Link href="/player" aria-label={labels.playerSpace} className="p-2.5 rounded-full hover:bg-blue/10"><UserRound size={20} /></Link>
          <LinkButton href="/register" variant="dark" className="hidden 2xl:inline-flex !px-4 !py-2.5 !min-h-0 !text-[13px] whitespace-nowrap">{labels.registerShort}</LinkButton>
          <LinkButton href="/tickets" variant="lime" className="!px-4 !py-2.5 !min-h-0 !text-[13px] whitespace-nowrap">{labels.getTicketsShort}</LinkButton>
          <button onClick={() => setOpen(true)} className="xl:hidden p-2.5 rounded-full hover:bg-blue/10" aria-label={labels.openMenu} aria-expanded={open}><Menu size={24} /></button>
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={labels.menu}>
        <nav className="mt-12 flex flex-col" aria-label={t("a11y.mobileNav")} onClick={() => setOpen(false)}>
          {[{ href: "/", label: labels.home }, ...SUB, ...LINKS.slice(1)].map((l) => (
            <Link key={l.href} href={l.href} className={cn("display text-4xl py-2.5 border-b border-white/15", SUB.some((s) => s.href === l.href) && "text-2xl pl-4 py-2 text-white/85")}>{l.label}</Link>
          ))}
          <Link href="/player" className="display text-4xl py-2.5 text-lime">{labels.playerSpace}</Link>
        </nav>
        <div className="mt-8 grid gap-3" onClick={() => setOpen(false)}>
          <LinkButton href="/register" variant="lime">{labels.register}</LinkButton>
          <LinkButton href="/tickets" variant="outline-light">{labels.getTickets}</LinkButton>
        </div>
      </Drawer>
    </header>
  );
}
