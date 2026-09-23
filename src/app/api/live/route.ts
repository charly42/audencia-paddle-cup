import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";

// Cache serveur très court : protège la base quand des centaines de téléphones rafraîchissent en même temps.
let memo: { at: number; body: unknown } | null = null;
export async function GET() {
  if (!memo || Date.now() - memo.at > 1500) {
    const [settings, matches] = await Promise.all([repo.getSettings(), repo.listMatches()]);
    memo = { at: Date.now(), body: { mode: settings.eventMode, matches, at: new Date().toISOString() } };
  }
  return NextResponse.json(memo.body, { headers: { "Cache-Control": "no-store" } });
}
