/**
 * Seed des DEMO DATA dans Supabase.
 *   npm run seed            → insère les données de démonstration (is_demo = true)
 *   npm run seed:clear      → supprime UNIQUEMENT les données is_demo = true
 * Ajoutez --force pour semer même si des équipes réelles existent déjà.
 * ⚠️ Données fictives : ne jamais les présenter comme officielles.
 */
import { createClient } from "@supabase/supabase-js";
import { buildDemoData } from "../src/lib/repo/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });
const args = new Set(process.argv.slice(2));

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, label: string) {
  const { data, error } = await p;
  if (error) { console.error(`❌ ${label}: ${error.message}`); process.exit(1); }
  return data;
}

async function clear() {
  console.log("🧹 Suppression des données de démonstration…");
  const demoTeams = ((await must(db.from("teams").select("id").eq("is_demo", true), "teams")) as { id: string }[]).map((t) => t.id);
  const demoSessions = ((await must(db.from("practice_sessions").select("id").eq("is_demo", true), "sessions")) as { id: string }[]).map((s) => s.id);
  await must(db.from("matches").delete().eq("is_demo", true), "matches");
  if (demoSessions.length) await must(db.from("practice_registrations").delete().in("practice_session_id", demoSessions), "practice_registrations");
  if (demoTeams.length) await must(db.from("practice_registrations").delete().in("team_id", demoTeams), "practice_registrations (teams)");
  await must(db.from("practice_sessions").delete().eq("is_demo", true), "practice_sessions");
  await must(db.from("tickets").delete().eq("is_demo", true), "tickets");
  await must(db.from("schedule_items").delete().eq("is_demo", true), "schedule_items");
  await must(db.from("teams").delete().eq("is_demo", true), "teams (players + supports en cascade)");
  await must(db.from("promotions").delete().eq("is_demo", true), "promotions");
  console.log("✅ Données de démonstration supprimées.");
}

async function seed() {
  const { count } = await db.from("teams").select("id", { count: "exact", head: true }).eq("is_demo", false);
  if ((count ?? 0) > 0 && !args.has("--force")) {
    console.error(`⚠️  ${count} équipe(s) réelle(s) existent déjà. Relancez avec --force pour semer quand même.`); process.exit(1);
  }
  const d = buildDemoData();
  const tournaments = Object.fromEntries(((await must(db.from("tournaments").select("id, slug"), "tournaments")) as { id: string; slug: string }[]).map((t) => [t.slug, t.id]));
  const courts = Object.fromEntries(((await must(db.from("courts").select("id, name"), "courts")) as { id: string; name: string }[]).map((c) => [c.name, c.id]));

  console.log("🌱 Insertion des données de démonstration…");
  await must(db.from("promotions").upsert(d.promotions, { onConflict: "id" }), "promotions");
  await must(db.from("teams").upsert(d.teams, { onConflict: "id" }), "teams");
  await must(db.from("players").upsert(d.players, { onConflict: "id" }), "players");
  const matches = d.matches.map(({ tournament_slug, court_name, updated_at: _u, ...m }) => ({ ...m, tournament_id: tournaments[tournament_slug], court_id: court_name ? courts[court_name] ?? null : null }));
  await must(db.from("matches").upsert(matches, { onConflict: "id" }), "matches");
  await must(db.from("practice_sessions").upsert(d.practice_sessions, { onConflict: "id" }), "practice_sessions");
  await must(db.from("practice_registrations").upsert(d.practice_registrations, { onConflict: "id" }), "practice_registrations");
  await must(db.from("schedule_items").upsert(d.schedule_items, { onConflict: "id" }), "schedule_items");
  await must(db.from("tickets").upsert(d.tickets, { onConflict: "id" }), "tickets");
  console.log(`✅ OK — ${d.teams.length} équipes, ${d.matches.length} matchs, ${d.practice_sessions.length} sessions, ${d.tickets.length} billets (DEMO).`);
  console.log("ℹ️  Pour passer le site en mode LIVE : connectez-vous en admin → Dashboard → EVENT MODE.");
}

(args.has("--clear") ? clear() : seed()).catch((e) => { console.error(e); process.exit(1); });
