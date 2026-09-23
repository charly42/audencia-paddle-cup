import { AlertTriangle, Info, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnnouncementLevel = "info" | "warning" | "urgent";

/**
 * Annonce d'urgence : même composant sur le site public et sur les écrans TV.
 * Trois niveaux, jamais signalés par la couleur seule (icône + libellé).
 */
export function Announcement({ message, level = "info", label, big = false }: { message: string; level?: AnnouncementLevel; label: string; big?: boolean }) {
  if (!message.trim()) return null;
  const style = {
    info: { cls: "bg-blue text-white", Icon: Info },
    warning: { cls: "bg-lime text-ink", Icon: Megaphone },
    urgent: { cls: "bg-danger text-white", Icon: AlertTriangle },
  }[level];
  return (
    <div role="status" aria-live="polite" className={cn("w-full", style.cls, level === "urgent" && "animate-live")}>
      <div className={cn("max-w-7xl mx-auto flex items-center gap-3 px-5", big ? "py-6" : "py-2.5")}>
        <style.Icon size={big ? 44 : 18} aria-hidden className="shrink-0" />
        <span className={cn("font-extrabold tracking-widest shrink-0", big ? "text-2xl" : "text-[11px]")}>{label}</span>
        <span className={cn("font-bold", big ? "display-md text-4xl md:text-6xl" : "text-sm")}>{message}</span>
      </div>
    </div>
  );
}
