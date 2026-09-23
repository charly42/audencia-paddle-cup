/**
 * Crée (ou promeut) un compte administrateur.
 *   npm run create-admin -- prenom.nom@audencia.com super_admin
 * Rôles : super_admin | event_admin | score_manager | checkin_staff
 * La connexion se fait ensuite par magic link (email) depuis /login.
 */
import { createClient } from "@supabase/supabase-js";

const ROLES = ["super_admin", "event_admin", "score_manager", "checkin_staff"];
const [email, role = "super_admin"] = process.argv.slice(2);
if (!email || !ROLES.includes(role)) { console.error(`Usage : npm run create-admin -- <email> [${ROLES.join("|")}]`); process.exit(1); }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const mail = email.trim().toLowerCase();
  let { data: profile } = await db.from("profiles").select("id").eq("email", mail).maybeSingle();
  if (!profile) {
    const { data, error } = await db.auth.admin.createUser({ email: mail, email_confirm: true });
    if (error) { console.error("❌", error.message); process.exit(1); }
    profile = { id: data.user.id };
  }
  const { error } = await db.from("profiles").update({ role }).eq("id", profile.id);
  if (error) { console.error("❌", error.message); process.exit(1); }
  console.log(`✅ ${mail} est maintenant ${role}. Connexion : /login (magic link).`);
})();
