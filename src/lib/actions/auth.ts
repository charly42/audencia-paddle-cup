"use server";
import { tr } from "../i18n";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "../auth";
import { demoAuthAllowed, isSupabaseConfigured, siteUrl } from "../env";
import { loginSchema } from "../schemas";
import { rateLimit } from "../rate-limit";
import { createSupabaseServerClient } from "../supabase/server";
import type { ActionResult } from "../types";

/** Envoie un magic link. Réponse volontairement identique que l'email existe ou non (pas d'énumération de comptes). */
export async function sendMagicLinkAction(email: string, next: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: await tr("err.demoNoSupabase") };
  if (!(await rateLimit("login", 5, 10 * 60_000))) return { ok: false, error: await tr("err.loginRate") };
  const parsed = loginSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, error: await tr("err.email") };
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/player";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });
  return { ok: true };
}

export async function demoLoginAction(profileId: string, next: string) {
  if (!demoAuthAllowed) throw new Error("err.demoLoginOff");
  (await cookies()).set(DEMO_COOKIE, profileId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/player");
}

export async function logoutAction() {
  if (isSupabaseConfigured) { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); }
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/");
}
