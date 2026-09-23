"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/provider";

function parts(target: number) {
  const s = Math.max(Math.floor((target - Date.now()) / 1000), 0);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: s === 0 };
}
/** Countdown scoreboard. Sans date configurée : placeholder administrable. */
export function Countdown({ target, placeholder }: { target: string | null; placeholder: string }) {
  const tr = useT();
  const t = target ? new Date(target).getTime() : null;
  const [p, setP] = useState<ReturnType<typeof parts> | null>(null);
  useEffect(() => {
    if (!t) return;
    setP(parts(t));
    const i = setInterval(() => setP(parts(t)), 1000);
    return () => clearInterval(i);
  }, [t]);
  if (!t) return <p className="display-md text-2xl md:text-3xl tracking-wider border-2 border-dashed border-white/50 rounded-2xl px-5 py-4 inline-block">{placeholder}</p>;
  const cells: [string, number | undefined][] = [[tr("countdown.days"), p?.d], [tr("countdown.hours"), p?.h], [tr("countdown.min"), p?.m], [tr("countdown.sec"), p?.s]];
  return (
    <div role="timer" aria-label={tr("countdown.aria")} className="flex gap-2 md:gap-3">
      {cells.map(([label, v]) => (
        <div key={label} className="bg-white/10 border border-white/25 rounded-2xl min-w-[4.2rem] md:min-w-24 px-3 py-3 text-center">
          <div className="num text-4xl md:text-6xl text-lime">{v === undefined ? "--" : String(v).padStart(2, "0")}</div>
          <div className="text-[10px] md:text-xs font-extrabold tracking-widest mt-1 text-white/80">{label}</div>
        </div>
      ))}
    </div>
  );
}
