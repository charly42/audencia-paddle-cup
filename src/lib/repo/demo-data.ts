/**
 * DONNÉES FICTIVES (DEMO DATA) — partagées par le mode démo en mémoire et par `npm run seed`.
 * Tout ce qui est produit ici porte is_demo = true et est supprimable via `npm run seed:clear`.
 * ⚠️  Aucune de ces données n'est officielle (équipes, scores, horaires, joueurs).
 */
import { parisDay, parisIso } from "../time";
export { parisDay, parisIso };

export const did = (kind: string, n: number) =>
  `00000000-0000-4000-8${kind}-${String(n).padStart(12, "0")}`;

const PROMOS = [
  { n: 1, name: "MSc Marketing", slug: "msc-marketing", program: "MSc Marketing" },
  { n: 2, name: "Grande École", slug: "grande-ecole", program: "Programme Grande École" },
  { n: 3, name: "M1 Finance", slug: "m1-finance", program: "MSc Finance" },
  { n: 4, name: "Communication", slug: "communication", program: "MSc Communication" },
  { n: 5, name: "International Business", slug: "international-business", program: "MSc International Business" },
  { n: 6, name: "Digital", slug: "digital", program: "MSc Digital" },
];

// [prénom, nom] fictifs
const NAMES: [string, string][] = [
  ["Léa", "Martin"], ["Hugo", "Bernard"], ["Inès", "Dubois"], ["Tom", "Moreau"], ["Chloé", "Laurent"], ["Nathan", "Simon"],
  ["Camille", "Michel"], ["Lucas", "Lefebvre"], ["Manon", "Garcia"], ["Ethan", "Roux"], ["Jade", "Fournier"], ["Noah", "Girard"],
  ["Sarah", "Bonnet"], ["Adam", "Mercier"], ["Louise", "Blanc"], ["Yanis", "Guerin"], ["Zoé", "Muller"], ["Enzo", "Henry"],
  ["Emma", "Perrin"], ["Liam", "Morin"], ["Alice", "Clement"], ["Jules", "Gauthier"], ["Lina", "Robin"], ["Maël", "Masson"],
  ["Anna", "Colin"], ["Théo", "Vidal"], ["Rose", "Lemoine"], ["Axel", "Caron"], ["Maya", "Faure"], ["Paul", "Andre"],
  ["Nina", "Rousseau"], ["Sacha", "Meyer"],
];

const LEVELS = ["intermediate", "advanced", "beginner", "intermediate", "advanced", "beginner"] as const;

export interface TicketRow { id: string; token: string; code: string; first_name: string; last_name: string; email: string; ticket_type: string; promotion_id: string | null; checked_in_at: string | null; checked_in_by: string | null; created_at: string; is_demo: true }
export interface PracticeRow { id: string; session_date: string; start_time: string; duration_min: number; courts_count: number; capacity: number; coach: boolean; level: string; status: string; location: string; waitlist_enabled: boolean; is_demo: true }
export interface PracticeRegRow { id: string; practice_session_id: string; team_id: string; profile_id: string | null; status: string; created_at: string }
export interface MatchRow { id: string; tournament_slug: string; team_a_id: string | null; team_b_id: string | null; team_a_score: number; team_b_score: number; court_name: string | null; scheduled_at: string | null; status: string; paused: boolean; round: string; round_order: number; position: number; promotion_id: string | null; game_no: number | null; points_value: number; is_demo: true; started_at: string | null; ended_at: string | null; updated_at?: string }
export interface DemoTeamRow {
  id: string; team_code: string; name: string; slug: string; promotion_id: string | null; program: string | null;
  kind: "student" | "staff"; status: string; photo_url: string | null; description: string | null;
  supporters_count: number; is_demo: true; created_at: string;
}

export function buildDemoData() {
  const promotions = PROMOS.map((p) => ({ id: did("001", p.n), name: p.name, slug: p.slug, program: p.program, active: true, is_demo: true as const }));

  const teams: DemoTeamRow[] = [];
  const players: { id: string; team_id: string; first_name: string; last_name: string; email: string; phone: string; skill_level: string; is_captain: boolean; photo_url: null; is_demo: true }[] = [];
  let pn = 0;
  const addTeam = (n: number, name: string, slug: string, promoN: number | null, program: string | null, kind: "student" | "staff", status: string, supporters: number, desc: string) => {
    const id = did("002", n);
    teams.push({
      id, team_code: `APC-D${String(n).padStart(4, "0")}`, name, slug, promotion_id: promoN ? did("001", promoN) : null, program, kind, status,
      photo_url: null, description: desc, supporters_count: supporters, is_demo: true, created_at: new Date(Date.now() - n * 3600_000).toISOString(),
    });
    for (let k = 0; k < 2; k++) {
      const [fn, ln] = NAMES[pn % NAMES.length];
      players.push({
        id: did("003", pn + 1), team_id: id, first_name: fn, last_name: ln,
        email: `${fn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${ln.toLowerCase()}@demo.test`,
        phone: "+33 6 00 00 00 00", skill_level: LEVELS[pn % LEVELS.length], is_captain: k === 0, photo_url: null, is_demo: true,
      });
      pn++;
    }
    return id;
  };

  // Équipes qualifiées (une par promo)
  const T = {
    mkt: addTeam(1, "TEAM MSc Marketing", "ms-marketing", 1, PROMOS[0].program, "student", "finalist", 231, "DEMO — Le duo marketing qui joue avec le sens du timing."),
    ge: addTeam(2, "TEAM Grande École", "grande-ecole", 2, PROMOS[1].program, "student", "semi_finalist", 184, "DEMO — Grande École, grande ambition."),
    fin: addTeam(3, "TEAM M1 Finance", "m1-finance", 3, PROMOS[2].program, "student", "finalist", 257, "DEMO — Rendement maximal sur chaque échange."),
    com: addTeam(4, "TEAM Communication", "communication", 4, PROMOS[3].program, "student", "eliminated", 97, "DEMO — Message clair, revers redoutable."),
    ib: addTeam(5, "TEAM International Business", "international-business", 5, PROMOS[4].program, "student", "semi_finalist", 142, "DEMO — Trois continents, un seul terrain."),
    dig: addTeam(6, "TEAM Digital", "digital", 6, PROMOS[5].program, "student", "eliminated", 118, "DEMO — Toujours en ligne, parfois en retard sur la balle."),
  };
  // Binômes éliminés aux qualifications (plusieurs binômes par promo)
  const B: string[] = [];
  PROMOS.forEach((p, i) => {
    B.push(addTeam(20 + i, `${p.name} — Binôme 2`, `${p.slug}-binome-2`, p.n, p.program, "student", "eliminated", 10 + i * 7, "DEMO — Éliminé en qualifications."));
  });
  // STAFF
  const S = {
    fac: addTeam(41, "TEAM FACULTY", "staff-faculty", null, "Staff", "staff", "registered", 64, "DEMO — Le corps enseignant entre sur le court."),
    life: addTeam(42, "TEAM STUDENT LIFE", "staff-student-life", null, "Staff", "staff", "registered", 71, "DEMO — La vie étudiante, version compétition."),
    prog: addTeam(43, "TEAM PROGRAMMES", "staff-programmes", null, "Staff", "staff", "registered", 52, "DEMO — Les programmes passent en mode match."),
    camp: addTeam(44, "TEAM CAMPUS", "staff-campus", null, "Staff", "staff", "registered", 58, "DEMO — L'équipe campus, toujours sur le terrain."),
  };

  const today = parisDay(0);
  const at = (hhmm: string) => parisIso(today, hhmm);
  const M: MatchRow[] = [];
  let mn = 0;
  const addMatch = (m: {
    t: "qualifiers" | "main-event" | "staff-vs-students"; a: string | null; b: string | null; sa?: number; sb?: number;
    court?: string | null; time?: string | null; status?: string; round: string; order: number; pos: number;
    promo?: number | null; game?: number | null; points?: number; day?: string; paused?: boolean;
  }) => {
    mn++;
    M.push({
      id: did("004", mn), tournament_slug: m.t, team_a_id: m.a, team_b_id: m.b, team_a_score: m.sa ?? 0, team_b_score: m.sb ?? 0,
      court_name: m.court ?? null, scheduled_at: m.time ? parisIso(m.day ?? today, m.time) : null, status: m.status ?? "upcoming",
      paused: m.paused ?? false, round: m.round, round_order: m.order, position: m.pos, promotion_id: m.promo ? did("001", m.promo) : null,
      game_no: m.game ?? null, points_value: m.points ?? 1, is_demo: true,
      started_at: m.status === "live" || m.status === "final" ? at("10:00") : null, ended_at: m.status === "final" ? at("12:30") : null,
    });
  };
  void at;

  // Qualifications ping-pong (jours précédents)
  const qDay = parisDay(-14);
  [T.mkt, T.ge, T.fin, T.com, T.ib, T.dig].forEach((t, i) =>
    addMatch({ t: "qualifiers", a: t, b: B[i], sa: 2, sb: i % 2 === 0 ? 0 : 1, status: "final", round: "final", order: 4, pos: 1, promo: i + 1, day: qDay, time: `1${2 + (i % 3)}:00` }),
  );

  // Student Padel Cup — phase de groupes (A: Marketing, Grande École, Digital — B: Finance, Communication, IB)
  const g = (a: string, b: string, sa: number, sb: number, court: string, time: string, pos: number) =>
    addMatch({ t: "main-event", a, b, sa, sb, court, time, status: "final", round: "group", order: 1, pos });
  g(T.mkt, T.dig, 6, 3, "Court 01", "10:30", 1);
  g(T.fin, T.com, 6, 2, "Court 02", "10:30", 2);
  g(T.ge, T.dig, 6, 4, "Court 03", "11:15", 3);
  g(T.ib, T.fin, 3, 6, "Court 04", "11:15", 4);
  g(T.mkt, T.ge, 6, 5, "Court 01", "12:00", 5);
  g(T.com, T.ib, 2, 6, "Court 02", "12:00", 6);
  // Demi-finales
  addMatch({ t: "main-event", a: T.mkt, b: T.ib, sa: 6, sb: 2, court: "Center Court", time: "14:00", status: "final", round: "semi", order: 3, pos: 1 });
  addMatch({ t: "main-event", a: T.fin, b: T.ge, sa: 6, sb: 4, court: "Court 03", time: "14:00", status: "final", round: "semi", order: 3, pos: 2 });
  // Finale étudiante — EN DIRECT
  addMatch({ t: "main-event", a: T.mkt, b: T.fin, sa: 4, sb: 3, court: "Center Court", time: "15:30", status: "live", round: "final", order: 4, pos: 1 });

  // STAFF CUP (game_no null → hors score global)
  addMatch({ t: "staff-vs-students", a: S.fac, b: S.life, sa: 6, sb: 5, court: "Court 03", time: "14:45", status: "final", round: "semi", order: 3, pos: 1 });
  addMatch({ t: "staff-vs-students", a: S.prog, b: S.camp, sa: 2, sb: 1, court: "Court 04", time: "14:45", status: "live", round: "semi", order: 3, pos: 2 });

  // MAIN EVENT — STAFF vs STUDENTS (Ryder Cup)
  addMatch({ t: "staff-vs-students", a: T.mkt, b: S.fac, sa: 6, sb: 3, court: "Center Court", time: "16:15", status: "final", round: "game", order: 9, pos: 1, game: 1 });
  addMatch({ t: "staff-vs-students", a: T.ge, b: S.life, sa: 4, sb: 6, court: "Court 03", time: "16:15", status: "final", round: "game", order: 9, pos: 2, game: 2 });
  addMatch({ t: "staff-vs-students", a: T.fin, b: S.prog, sa: 0, sb: 0, court: "Center Court", time: "17:00", status: "check_in", round: "game", order: 9, pos: 3, game: 3, points: 1 });

  const practice_sessions: PracticeRow[] = [];
  const plan: [number, string, number, number, boolean, string][] = [
    [2, "18:00", 2, 8, false, "all"], [3, "12:30", 1, 4, true, "beginner"], [5, "18:00", 2, 8, true, "intermediate"],
    [6, "19:30", 2, 8, false, "advanced"], [9, "18:00", 3, 12, true, "all"],
  ];
  plan.forEach(([off, time, courts, cap, coach, level], i) =>
    practice_sessions.push({
      id: did("005", i + 1), session_date: parisDay(off), start_time: time + ":00", duration_min: 90, courts_count: courts, capacity: cap,
      coach, level, status: "open", location: "4PADEL Saint-Ouen", waitlist_enabled: true, is_demo: true,
    }),
  );
  const practice_registrations: PracticeRegRow[] = [
    { id: did("006", 1), practice_session_id: did("005", 1), team_id: T.mkt, profile_id: null, status: "booked", created_at: new Date().toISOString() },
    { id: did("006", 2), practice_session_id: did("005", 1), team_id: T.fin, profile_id: null, status: "booked", created_at: new Date().toISOString() },
    { id: did("006", 3), practice_session_id: did("005", 2), team_id: T.dig, profile_id: null, status: "booked", created_at: new Date().toISOString() },
    { id: did("006", 4), practice_session_id: did("005", 2), team_id: T.com, profile_id: null, status: "booked", created_at: new Date().toISOString() },
    { id: did("006", 5), practice_session_id: did("005", 2), team_id: T.ib, profile_id: null, status: "waitlist", created_at: new Date().toISOString() },
  ];

  const schedule_items = ([
    ["09:30", "CHECK-IN", "Accueil des équipes au 4PADEL Saint-Ouen"], ["10:00", "WELCOME & WARM-UP", null],
    ["10:30", "STUDENT CUP GROUP STAGE", null], ["12:30", "LUNCH", null], ["13:30", "FINAL STAGES", null],
    ["14:45", "STAFF CUP", null], ["15:30", "STUDENT FINAL", null], ["16:15", "STAFF vs STUDENTS", "Le MAIN EVENT"],
    ["17:30", "AWARDS", null], ["18:00", "AFTER PADEL", null],
  ] as [string, string, string | null][]).map(([start_time, title, description], i) => ({
    id: did("007", i + 1), start_time, title, description, sort_order: i + 1, active: true, is_demo: true,
  }));

  const tickets: TicketRow[] = [
    { id: did("008", 1), token: "demo" + "a1b2c3d4e5f60718293a4b5c6d7e8f9012", code: "DEMO0001", first_name: "Clara", last_name: "Demo", email: "clara@demo.test", ticket_type: "spectator", promotion_id: did("001", 1), checked_in_at: null, checked_in_by: null, created_at: new Date().toISOString(), is_demo: true },
    { id: did("008", 2), token: "demo" + "0f9e8d7c6b5a49382716f5e4d3c2b1a098", code: "DEMO0002", first_name: "Marc", last_name: "Demo", email: "marc@demo.test", ticket_type: "supporter", promotion_id: did("001", 3), checked_in_at: new Date().toISOString(), checked_in_by: null, created_at: new Date().toISOString(), is_demo: true },
    { id: did("008", 3), token: "demo" + "1122334455667788990011223344556677", code: "DEMO0003", first_name: "Sofia", last_name: "Demo", email: "sofia@demo.test", ticket_type: "staff", promotion_id: null, checked_in_at: null, checked_in_by: null, created_at: new Date().toISOString(), is_demo: true },
  ];

  return { promotions, teams, players, matches: M, practice_sessions, practice_registrations, schedule_items, tickets, teamIds: T };
}
