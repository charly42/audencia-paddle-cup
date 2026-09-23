import { cookies, headers } from "next/headers";
import { fr } from "./fr";
import { en } from "./en";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "apc_lang";
export const DEFAULT_LOCALE: Locale = "fr";

export type Dict = Record<string, string>;
/** Les deux dictionnaires ont exactement les mêmes clés (vérifié à la construction de en.ts). */
const DICTS: Record<Locale, Dict> = { fr, en };

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);

/** Langue courante : cookie choisi par le visiteur, sinon en-tête Accept-Language, sinon français. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const best = accept.split(",").map((p) => p.trim().split(";")[0]?.slice(0, 2).toLowerCase()).find(isLocale);
  return best ?? DEFAULT_LOCALE;
}

/**
 * Traductions. `t("nav.teams")` avec repli sur le français si une clé manque en anglais,
 * puis sur la clé elle-même : une traduction oubliée n'affiche jamais une page vide.
 */
/** Dictionnaire complet de la langue, avec repli sur le français clé par clé (envoyé au client). */
export const dictionary = (locale: Locale): Dict => ({ ...fr, ...(DICTS[locale] ?? {}) });

/**
 * Traductions. `t("nav.teams")` avec repli sur le français si une clé manque en anglais,
 * puis sur la clé elle-même : une traduction oubliée n'affiche jamais une page vide.
 */
export function translator(locale: Locale) {
  const dict = DICTS[locale] ?? fr;
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = (dict as Record<string, string>)[key] ?? (fr as Record<string, string>)[key] ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : raw;
  };
}
export type T = ReturnType<typeof translator>;

/** Raccourci pour un composant serveur : `const { t, locale } = await i18n();` */
export async function i18n() {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}

/**
 * Contenu éditorial bilingue stocké en base : { fr: "...", en: "..." }.
 * Accepte aussi une chaîne simple (contenus saisis avant le passage au bilingue).
 */
export function pickLang(value: unknown, locale: Locale): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const v = o[locale] ?? o[DEFAULT_LOCALE] ?? o.fr ?? o.en;
    if (typeof v === "string") return v;
  }
  return "";
}
/** Idem pour un bloc { title, body } dont chaque champ peut être bilingue. */
export function pickBlock(value: unknown, locale: Locale): { title: string; body: string } {
  const o = (value ?? {}) as Record<string, unknown>;
  return { title: pickLang(o.title, locale), body: pickLang(o.body, locale) };
}

/**
 * Traduction côté serveur dans la langue du visiteur (Server Actions, route handlers).
 * Accepte une clé ou un texte brut : un message déjà rédigé est renvoyé tel quel.
 */
export async function tr(keyOrText: string, vars?: Record<string, string | number>): Promise<string> {
  return translator(await getLocale())(keyOrText, vars);
}
