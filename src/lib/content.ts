/**
 * Contenus éditables (admin → Content), bilingues : chaque texte est { fr, en }.
 * Les valeurs ci-dessous servent de défaut tant que l'organisation ne les a pas modifiées
 * (table content_blocks). Lecture : pickLang() / pickBlock() de lib/i18n.
 * ⚠️ Règles et mentions : placeholders « à confirmer par l'organisation ».
 */
export const TBC = "TO BE CONFIRMED BY ORGANIZER";
export const TBC_FR = "À CONFIRMER PAR L'ORGANISATION";
export type L = { fr: string; en: string };
export interface RuleSection { title: L | string; body: L | string; tbc: boolean }

const tbc: L = { fr: TBC_FR, en: TBC };
/** Vrai si le texte est encore un placeholder (dans l'une ou l'autre langue). */
export const isTbc = (v: unknown) => {
  const s = typeof v === "string" ? v : v && typeof v === "object" ? Object.values(v as Record<string, string>).join("|") : "";
  return s.includes(TBC) || s.includes(TBC_FR);
};

export const RULE_KEYS = [
  ["general", { fr: "RÈGLES GÉNÉRALES", en: "GENERAL RULES" }], ["team", { fr: "RÈGLES D'ÉQUIPE", en: "TEAM RULES" }],
  ["pingpong", { fr: "QUALIFICATIONS PING-PONG", en: "PING-PONG QUALIFIERS" }], ["padel", { fr: "RÈGLES DU PADEL", en: "PADEL RULES" }],
  ["format", { fr: "FORMAT DES MATCHS", en: "MATCH FORMAT" }], ["late", { fr: "RETARDS", en: "LATE ARRIVAL" }],
  ["fairplay", { fr: "FAIR-PLAY", en: "FAIR PLAY" }], ["equipment", { fr: "ÉQUIPEMENT", en: "EQUIPMENT" }],
  ["safety", { fr: "SÉCURITÉ", en: "SAFETY" }], ["image", { fr: "DROIT À L'IMAGE", en: "IMAGE RIGHTS" }],
] as const;

export const DEFAULT_CONTENT: Record<string, unknown> = {
  "home.date_placeholder": { fr: "DATE À ANNONCER", en: "DATE TO BE ANNOUNCED" },
  "home.important_message": { fr: "", en: "" },
  "home.one_campus": {
    title: { fr: "ONE CAMPUS. ONE CUP.", en: "ONE CAMPUS. ONE CUP." },
    body: {
      fr: "Des tables de ping-pong du campus aux courts de Saint-Ouen : une promotion, un binôme, une Coupe. Le staff attend les étudiants sur le terrain.",
      en: "From the campus table-tennis tables to the Saint-Ouen courts: one cohort, one pair, one Cup. The staff is waiting for the students on court.",
    },
  },
  "home.aftermovie": { title: { fr: "AFTERMOVIE", en: "AFTERMOVIE" }, body: { fr: "Aftermovie et photos — à renseigner par l'organisation.", en: "Aftermovie and photos — to be added by the organisers." } },
  "home.thank_you": { title: { fr: "MERCI", en: "THANK YOU" }, body: { fr: "Merci aux joueurs, aux supporters, au staff et à nos partenaires.", en: "Thank you to the players, supporters, staff and partners." } },
  "home.next_edition": { title: { fr: "PROCHAINE ÉDITION", en: "NEXT EDITION" }, body: { fr: "Rendez-vous à la prochaine édition — informations à venir.", en: "See you at the next edition — details to come." } },
  "about.title": { fr: "BIEN PLUS QU'UN TOURNOI.", en: "MORE THAN A TOURNAMENT." },
  "about.text": {
    fr: "L'Audencia Padel Cup réunit étudiants et staff autour de la compétition, du sport et de la vie de campus.",
    en: "The Audencia Padel Cup brings students and staff together around competition, sport and campus life.",
  },
  "about.pillars": [
    { title: { fr: "SPORT", en: "SPORT" }, body: { fr: "Du ping-pong au padel : la compétition comme point de départ.", en: "From table tennis to padel: competition as the starting point." } },
    { title: { fr: "COMMUNAUTÉ", en: "COMMUNITY" }, body: { fr: "Chaque promotion a son binôme, chaque binôme a ses supporters.", en: "Every cohort has its pair, every pair has its supporters." } },
    { title: { fr: "ESPRIT D'ÉQUIPE", en: "TEAM SPIRIT" }, body: { fr: "On se qualifie ensemble, on représente ensemble.", en: "We qualify together, we represent together." } },
    { title: { fr: "VIE DE CAMPUS", en: "CAMPUS LIFE" }, body: { fr: "Une journée qui rassemble étudiants, staff et invités.", en: "A day that brings students, staff and guests together." } },
  ],
  "privacy.controller": { fr: `Responsable de traitement : ${TBC_FR}`, en: `Data controller: ${TBC}` },
  "privacy.retention": { fr: `Durée de conservation : ${TBC_FR}`, en: `Retention period: ${TBC}` },
  "privacy.contact": { fr: `Contact DPO / exercice des droits : ${TBC_FR}`, en: `DPO contact / exercising your rights: ${TBC}` },
  "privacy.legal": { fr: `Mentions légales : ${TBC_FR}`, en: `Legal notice: ${TBC}` },
  ...Object.fromEntries(RULE_KEYS.map(([k, title]) => [`rules.${k}`, { title, body: tbc, tbc: true } satisfies RuleSection])),
};
