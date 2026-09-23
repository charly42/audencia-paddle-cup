import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-bold">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="text-xs font-bold text-danger">⚠ {error}</p>}
    </div>
  );
}
const ctl = "w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-base min-h-12 focus:border-blue aria-[invalid=true]:border-danger";
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cn(ctl, className)} />;
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} {...p} className={cn(ctl, className)} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} {...p} className={cn(ctl, "min-h-28", className)} />;
});
export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string }>(function Checkbox({ label, error, id, ...p }, ref) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
        <input ref={ref} id={id} type="checkbox" {...p} className="mt-1 size-5 accent-blue shrink-0" />
        <span className="text-sm leading-snug">{label}</span>
      </label>
      {error && <p role="alert" className="text-xs font-bold text-danger mt-1 ml-8">⚠ {error}</p>}
    </div>
  );
});
