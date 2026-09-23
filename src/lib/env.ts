export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);
/** Mode démo : pas de Supabase → données en mémoire. */
export const isDemoMode = !isSupabaseConfigured;
/** Connexion démo (joueur/admin) : jamais en production sauf DEMO_MODE=true. */
export const demoAuthAllowed = isDemoMode && (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true");
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const tournamentProviderName = (process.env.TOURNAMENT_PROVIDER || "local").toLowerCase();
