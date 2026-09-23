"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./index";

type Dict = Record<string, string>;
const Ctx = createContext<{ locale: Locale; dict: Dict }>({ locale: "fr", dict: {} });

/**
 * Rend le dictionnaire disponible aux composants client. Monté une fois dans le layout racine :
 * le serveur choisit la langue, le client s'en sert sans nouvel aller-retour.
 */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** `const t = useT();  t("cta.save")` — repli sur la clé si la traduction manque. */
export function useT() {
  const { dict } = useContext(Ctx);
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = dict[key] ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : raw;
  };
}
export const useLocale = () => useContext(Ctx).locale;
