"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Fait défiler les scènes d'un écran campus (durée configurable). */
export function DisplayRotator({ scenes, seconds = 15 }: { scenes: { id: string; node: React.ReactNode }[]; seconds?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % scenes.length), seconds * 1000); return () => clearInterval(t); }, [scenes.length, seconds]);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={scenes[i].id} className="min-h-dvh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>{scenes[i].node}</motion.div>
    </AnimatePresence>
  );
}
