import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoAuthAllowed, isSupabaseConfigured } from "./env";
import { repo } from "./repo";
import { createSupabaseServerClient } from "./supabase/server";
import { canAccess, type AdminArea } from "./permissions";
import type { PlayerContext, Profile } from "./types";

export const DEMO_COOKIE = "apc_demo";

/** Profil courant (Supabase Auth, ou cookie démo hors production). */
export async function getProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser(); // getUser() revalide le JWT côté Supabase (jamais getSession())
    return data.user ? repo.getProfile(data.user.id) : null;
  }
  if (!demoAuthAllowed) return null;
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id ? repo.getProfile(id) : null;
}

export async function requireProfile(next = "/player"): Promise<Profile> {
  const p = await getProfile();
  if (!p) redirect(`/login?next=${encodeURIComponent(next)}`);
  return p;
}

/** Page joueur : profil + équipe. */
export async function requirePlayer(): Promise<PlayerContext> {
  const profile = await requireProfile("/player");
  return repo.getPlayerContext(profile);
}

/** Page admin : redirige si le rôle n'a pas accès à ce module. */
export async function requireAdmin(area: AdminArea): Promise<Profile> {
  const profile = await requireProfile("/admin");
  if (!canAccess(profile.role, area)) redirect(profile.role === "player" ? "/player" : "/admin");
  return profile;
}

/** Server actions / route handlers : lève une erreur si non autorisé (validation côté serveur systématique). */
export async function assertAdmin(area: AdminArea): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !canAccess(profile.role, area)) throw new Error("Accès refusé.");
  return profile;
}
export async function assertPlayer(): Promise<PlayerContext> {
  const profile = await getProfile();
  if (!profile) throw new Error("err.login");
  const ctx = await repo.getPlayerContext(profile);
  if (!ctx.team) throw new Error("err.noTeam");
  return ctx;
}
