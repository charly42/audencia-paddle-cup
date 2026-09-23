import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, subtitle, children, tone = "blue" }: { eyebrow?: string; title: React.ReactNode; subtitle?: string; children?: React.ReactNode; tone?: "blue" | "ink" }) {
  return (
    <section className={cn("on-dark text-white court-lines relative overflow-hidden", tone === "blue" ? "bg-blue" : "bg-ink")}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
        {eyebrow && <p className="text-xs md:text-sm font-extrabold tracking-[.3em] text-lime mb-3">{eyebrow}</p>}
        <h1 className="display text-6xl sm:text-8xl md:text-[10rem]">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg md:text-xl font-semibold text-white/85">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
export const Container = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("max-w-7xl mx-auto px-5 md:px-8", className)}>{children}</div>;
