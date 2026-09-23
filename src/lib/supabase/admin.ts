import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client SERVICE ROLE — bypass RLS. Serveur uniquement (jamais importé côté client).
 * À n'utiliser qu'après vérification du rôle de l'appelant (voir lib/auth.ts).
 */
let cached: ReturnType<typeof createClient> | null = null;
export function createAdminClient() {
  if (!cached) {
    cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
