import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

/** Retour du magic link Supabase (PKCE `code` ou `token_hash`). Redirection uniquement vers un chemin interne. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/player";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/player";
  if (!isSupabaseConfigured) return NextResponse.redirect(`${siteUrl}/login`);
  const supabase = await createSupabaseServerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash) ok = !(await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash })).error;
  return NextResponse.redirect(`${siteUrl}${ok ? safeNext : "/login?error=1"}`);
}
