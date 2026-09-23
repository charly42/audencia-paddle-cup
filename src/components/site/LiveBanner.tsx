import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LiveBanner({ label, sub }: { label: string; sub: string }) {
  return (
    <Link href="/tournament/main-event" className="on-dark block bg-lime text-ink" aria-label={`${label} — ${sub}`}>
      <div className="max-w-7xl mx-auto px-5 py-2 flex items-center justify-center gap-3 text-sm font-extrabold tracking-wider">
        <span className="relative flex size-2.5"><span className="absolute inset-0 rounded-full bg-danger animate-live" /><span className="relative rounded-full size-2.5 bg-danger" /></span>
        {label}
        <span className="hidden sm:inline font-bold tracking-normal">— {sub}</span>
        <ArrowRight size={16} aria-hidden />
      </div>
    </Link>
  );
}
