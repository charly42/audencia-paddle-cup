import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client lié à la session de l'utilisateur (cookies) — clé anon, soumis à la RLS. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component : ignoré (le middleware rafraîchit) */ }
      },
    },
  });
}
