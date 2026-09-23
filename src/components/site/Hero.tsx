"use client";
import { MapPin } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/provider";
import { LinkButton } from "@/components/ui/Button";
import { Countdown } from "@/components/sport/Countdown";
import { formatDate } from "@/lib/format";
import type { EventSettings } from "@/lib/types";

/** Hero principal — deux camps face à face séparés par le filet. */
export function Hero({ settings, datePlaceholder }: { settings: EventSettings; datePlaceholder: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <section className="on-dark relative isolate overflow-hidden bg-blue text-white">
      <div aria-hidden className="absolute inset-0 court-lines opacity-70 -z-10" />
      <div aria-hidden className="absolute -right-24 top-1/3 size-[28rem] rounded-full bg-lime/90 blur-[2px] -z-10 hidden md:block" />
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 pb-14 md:pt-16 md:pb-20 min-h-[calc(100dvh-4rem)] flex flex-col">
        <p className="text-xs md:text-sm font-extrabold tracking-[.3em] text-lime">{settings.eventName} · 4PADEL SAINT-OUEN</p>
        <h1 className="mt-4 md:mt-8">
          <span className="display block text-[5.2rem] sm:text-[8rem] md:text-[13rem] lg:text-[17rem] leading-[.8]">STAFF</span>
          <span className="flex items-center gap-4 my-2 md:my-4" aria-hidden><span className="net-line flex-1" /><span className="display text-4xl md:text-7xl text-lime">VS</span><span className="net-line flex-1" /></span>
          <span className="display outline-text block text-[3.9rem] sm:text-[6.5rem] md:text-[10.5rem] lg:text-[13.5rem] leading-[.8]">STUDENTS</span>
        </h1>
        <p className="mt-6 md:mt-8 display-md text-xl md:text-3xl tracking-wider">{settings.tagline}</p>
        <div className="mt-auto pt-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-extrabold tracking-wider">
              <span className="text-lg md:text-2xl">{settings.eventDate ? formatDate(settings.eventDate, undefined, locale).toUpperCase() : datePlaceholder}</span>
              <span className="inline-flex items-center gap-1.5 text-white/85"><MapPin size={18} aria-hidden />{settings.venue}</span>
            </div>
            <Countdown target={settings.eventDate} placeholder={datePlaceholder} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <LinkButton href="/register" variant="lime" className="!text-base md:!text-lg !px-8">{t("cta.register")}</LinkButton>
            <LinkButton href="/tickets" variant="outline-light" className="!text-base md:!text-lg !px-8">{t("cta.tickets")}</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
