import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { i18n } from "@/lib/i18n";
import { RegisterForm } from "@/components/site/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("cta.register"), description: t("reg.sub") };
}

export default async function RegisterPage() {
  const [settings, promotions, { t }] = await Promise.all([repo.getSettings(), repo.listPromotions(), i18n()]);
  const late = settings.registrationDeadline && new Date(settings.registrationDeadline) < new Date();
  const closed = !settings.registrationOpen ? t("reg.closedNotOpen") : late ? t("reg.closedDeadline") : undefined;
  return (
    <>
      <PageHero eyebrow={t("reg.eyebrow")} title={t("cta.register")} subtitle={t("reg.sub")} />
      <Container className="py-10 md:py-14 max-w-3xl"><RegisterForm promotions={promotions.filter((p) => p.active)} closedReason={closed} /></Container>
    </>
  );
}
