import type { Metadata } from "next";
import { demoAuthAllowed, isSupabaseConfigured } from "@/lib/env";
import { DEMO_PROFILES, demoPlayerChoices } from "@/lib/repo/demo";
import { ROLE_LABEL } from "@/lib/permissions";
import { PageHero, Container } from "@/components/site/PageHero";
import { LoginForm } from "@/components/site/LoginForm";
import { i18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const { t } = await i18n();
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/player";
  const demo = !isSupabaseConfigured && demoAuthAllowed
    ? { players: demoPlayerChoices().map((p) => ({ ...p, id: `demo:${p.email}` })), admins: DEMO_PROFILES.map((p) => ({ id: p.id, label: ROLE_LABEL[p.role] })) }
    : undefined;
  return (
    <>
      <PageHero eyebrow={t("login.eyebrow")} title={t("cta.login")} subtitle={t("login.sub")} />
      <Container className="py-10 md:py-14 max-w-xl">
        {sp.error && <p role="alert" className="mb-4 rounded-xl bg-danger text-white font-bold px-4 py-3">⚠ {t("login.error")}</p>}
        <div className="rounded-[2rem] bg-white border border-ink/10 p-6 md:p-8">
          {!isSupabaseConfigured && !demo ? <p className="font-semibold text-slate">{t("login.unavailable")}</p> : <LoginForm next={next} demo={demo} />}
        </div>
      </Container>
    </>
  );
}
