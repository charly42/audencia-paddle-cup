import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const supabaseOn = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const demoOn = !supabaseOn && (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true");

/**
 * Proxy Next 16 (ex-« middleware ») : garde d'accès grossière (session présente).
 * Les rôles sont vérifiés côté serveur dans chaque page et chaque action.
 */
export async function proxy(request: NextRequest) {
  const login = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  };
  if (supabaseOn) {
    const { response, user } = await updateSession(request);
    return user ? response : login();
  }
  if (demoOn && request.cookies.get("apc_demo")?.value) return NextResponse.next();
  return login();
}

export const config = { matcher: ["/admin/:path*", "/player/:path*"] };
