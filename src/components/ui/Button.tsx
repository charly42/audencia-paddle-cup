import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "lime" | "dark" | "ghost" | "outline-light";
const V: Record<Variant, string> = {
  primary: "bg-blue text-white hover:bg-blue-deep",
  lime: "bg-lime text-ink hover:brightness-95",
  dark: "bg-ink text-white hover:bg-black",
  ghost: "bg-transparent text-ink hover:bg-ink/5 border border-ink/20",
  "outline-light": "bg-transparent text-white border-2 border-white/70 hover:bg-white hover:text-blue",
};
const base = "inline-flex items-center justify-center gap-2 font-extrabold tracking-wide rounded-full px-6 py-3.5 text-sm md:text-base transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-12";

export function Button({ variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={cn(base, V[variant], className)} />;
}
export function LinkButton({ variant = "primary", className, href, ...props }: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link href={href} {...props} className={cn(base, V[variant], className)} />;
}
