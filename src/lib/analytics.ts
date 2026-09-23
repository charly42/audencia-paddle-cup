/** Abstraction analytics. Aucun tracker intrusif par défaut (ANALYTICS_PROVIDER=none). */
export type AnalyticsEvent = "page_view" | "team_registration" | "ticket_registration" | "practice_booking" | "team_support";

export async function track(event: AnalyticsEvent, props: Record<string, string | number> = {}) {
  const provider = process.env.ANALYTICS_PROVIDER || "none";
  if (provider === "console") console.log("[analytics]", event, props);
  if (provider === "plausible" && process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    try {
      await fetch("https://plausible.io/api/event", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: event, url: (process.env.NEXT_PUBLIC_SITE_URL || "") + "/", domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN, props }),
      });
    } catch { /* jamais bloquant */ }
  }
}
