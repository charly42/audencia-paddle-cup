/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CHARTE — SOURCE UNIQUE DE VÉRITÉ
 * Déclinaison événementielle de la charte Audencia pour l'Audencia Padel Cup.
 *
 * ⚠️  VALEURS À VALIDER : les codes ci-dessous sont des APPROXIMATIONS posées
 *     faute d'accès au PDF officiel de la charte Audencia. Remplacez-les par les
 *     valeurs officielles : c'est le SEUL endroit à modifier côté TypeScript
 *     (+ le bloc @theme de src/app/globals.css, qui reprend les mêmes codes).
 *     Voir docs/CHARTE.md pour la procédure et la justification de chaque rôle.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const BRAND = {
  /** Bleu institutionnel Audencia — fonds de marque, en-têtes, liens. */
  blue: "#0E2A6B",
  /** Bleu profond — dégradés, survols, aplats secondaires. */
  blueDeep: "#081A44",
  /** Bleu clair — fonds de rappel, badges informatifs. */
  blueSoft: "#E3E9F7",
  /**
   * Accent ÉVÉNEMENT (hors charte institutionnelle) : réservé au sport —
   * direct, scores, boutons d'action. Une charte d'école ne prévoit pas de
   * couleur de signalisation assez visible à distance sur un terrain.
   */
  accent: "#D9F24B",
  /** Fond de page — blanc cassé, plus chaleureux qu'un blanc pur. */
  paper: "#F5F4F0",
  /** Texte et aplats sombres. */
  ink: "#14161B",
  /** Gris de séparation. */
  mist: "#E6E7EB",
  /** Texte secondaire. */
  slate: "#545967",
  /** États. */
  danger: "#C22B2B",
  ok: "#1B7F3B",
  warn: "#B45309",
} as const;

/** Polices. Remplacez par les polices officielles de la charte si elles diffèrent. */
export const FONTS = {
  /** Titres : condensée, très large amplitude de graisse (esprit affiche sportive). */
  display: "Big Shoulders",
  /** Texte courant : grotesque neutre, excellente lisibilité sur mobile. */
  body: "Hanken Grotesk",
} as const;

export type BrandColor = keyof typeof BRAND;
