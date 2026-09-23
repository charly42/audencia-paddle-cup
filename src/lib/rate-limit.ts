import { headers } from "next/headers";

/**
 * Rate limiting en mémoire (fenêtre glissante). Suffisant pour la V1 sur une instance ;
 * en serverless multi-instances, remplacer par Upstash Redis (même signature).
 */
const buckets = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await clientIp();
  const k = `${key}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(k) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { buckets.set(k, hits); return false; }
  hits.push(now);
  buckets.set(k, hits);
  if (buckets.size > 5000) for (const [bk, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(bk);
  return true;
}
