"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Toast = { id: number; message: string; tone: "ok" | "error" };
const Ctx = createContext<{ toast: (message: string, tone?: "ok" | "error") => void }>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[90] left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 w-[min(92vw,26rem)] space-y-2" aria-live="polite" role="status">
        {items.map((t) => (
          <div key={t.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold ${t.tone === "ok" ? "bg-ink text-white" : "bg-danger text-white"}`}>
            {t.tone === "ok" ? <CheckCircle2 size={18} className="text-lime shrink-0 mt-0.5" aria-hidden /> : <XCircle size={18} className="shrink-0 mt-0.5" aria-hidden />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
