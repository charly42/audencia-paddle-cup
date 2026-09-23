import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { getProfile } from "@/lib/auth";
import { PageHero, Container } from "@/components/site/PageHero";
import { PracticeBoard } from "@/components/sport/Practice";
import { LinkButton } from "@/components/ui/Button";
import { i18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("pr.title"), description: t("pr.sub") };
}

export default async function PracticePage() {
  const [sessions, profile, { t }] = await Promise.all([repo.listPractice(), getProfile(), i18n()]);
  const ctx = profile ? await repo.getPlayerContext(profile) : null;
  const regs = ctx?.team ? await repo.listPracticeForTeam(ctx.team.id) : [];
  const myRegs = Object.fromEntries(regs.filter((r) => r.status !== "cancelled").map((r) => [r.sessionId, { id: r.id, status: r.status as "booked" | "waitlist" }]));
  return (
    <>
      <PageHero eyebrow={t("pr.eyebrow")} title={t("pr.title")} subtitle={t("pr.sub")} />
      <Container className="py-10 md:py-14">
        {!ctx?.team && <div className="mb-8 rounded-3xl bg-lime p-5 flex flex-wrap items-center gap-4 justify-between"><p className="font-extrabold">{t("pr.loginBanner")}</p><LinkButton href="/login?next=/tournament/practice" variant="dark">{t("reg.playerLogin")}</LinkButton></div>}
        <PracticeBoard sessions={sessions} myRegs={myRegs} loggedIn={!!ctx?.team} />
      </Container>
    </>
  );
}
