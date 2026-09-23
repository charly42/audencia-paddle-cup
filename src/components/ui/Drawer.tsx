"use client";
import { useT } from "@/lib/i18n/provider";
import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/** Drawer latéral (navigation mobile). Échap pour fermer, scroll verrouillé. */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] on-dark" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="absolute right-0 top-0 bottom-0 w-[min(90vw,24rem)] bg-blue text-white p-6 overflow-y-auto" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.22 }}>
            <button onClick={onClose} aria-label={t("nav.closeMenu")} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"><X size={26} /></button>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
