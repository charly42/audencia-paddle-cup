"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

/** Modal accessible basé sur <dialog> (focus trap + Échap natifs). */
export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-label={title}
      className={cn("m-auto w-[min(92vw,32rem)] rounded-3xl p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm", className)}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="display-md text-3xl">{title}</h2>
          <button onClick={onClose} aria-label={t("common.close")} className="p-2 -m-2 rounded-full hover:bg-ink/5"><X size={22} /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
