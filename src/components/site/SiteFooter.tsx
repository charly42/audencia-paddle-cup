import Link from "next/link";
import type { Partner } from "@/lib/types";

export interface FooterLabels { mainEvent: string; qualifiers: string; practice: string; teams: string; supporters: string; predictions: string; gallery: string; rules: string; privacy: string; footer: string }

export function SiteFooter({ venue, partners, labels }: { venue: string; partners: Partner[]; labels: FooterLabels }) {
  return (
    <footer className="on-dark bg-ink text-white mt-16">
      <div className="max-w-7xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-5xl md:text-7xl">Audencia<br />Padel Cup</p>
          <p className="mt-4 text-lime font-extrabold tracking-wider text-sm">QUALIFY. REPRESENT. PLAY. CHALLENGE.</p>
        </div>
        <nav aria-label={labels.footer} className="grid gap-2 text-sm font-bold content-start">
          <Link href="/tournament/main-event" className="hover:text-lime">{labels.mainEvent}</Link><Link href="/tournament/qualifiers" className="hover:text-lime">{labels.qualifiers}</Link>
          <Link href="/tournament/practice" className="hover:text-lime">{labels.practice}</Link><Link href="/teams" className="hover:text-lime">{labels.teams}</Link>
          <Link href="/supporters" className="hover:text-lime">{labels.supporters}</Link><Link href="/predictions" className="hover:text-lime">{labels.predictions}</Link>
          <Link href="/gallery" className="hover:text-lime">{labels.gallery}</Link><Link href="/rules" className="hover:text-lime">{labels.rules}</Link><Link href="/privacy" className="hover:text-lime">{labels.privacy}</Link>
        </nav>
        <div className="text-sm text-white/80 space-y-4">
          {partners.map((p) => (
            <div key={p.id}>
              <p className="font-extrabold text-white">{p.name}</p>
              {p.description && <p>{p.description}</p>}
            </div>
          ))}
          {!partners.length && <p>{venue}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© Audencia Padel Cup — ONE CAMPUS. ONE CUP.</div>
    </footer>
  );
}
