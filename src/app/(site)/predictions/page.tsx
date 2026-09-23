import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { i18n } from "@/lib/i18n";
import { PageHero, Container } from "@/components/site/PageHero";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { PredictionBoard } from "@/components/sport/Predictions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("pred.title"), description: t("pred.sub") };
}

export default async function PredictionsPage() {
  const [settings, { t }] = await Promise.all([repo.getSettings(), i18n()]);
  if (!settings.predictionsEnabled) notFound();
  const [matches, standings] = await Promise.all([repo.listMatches(), repo.predictionStandings()]);
  // Les pronostics de ce visiteur sont identifiés côté serveur par l'empreinte anonyme.
  const mine = await repo.listPredictions();
  return (
    <>
      <PageHero eyebrow={t("sup.eyebrow")} title={t("pred.title")} subtitle={t("pred.sub")} />
      <Container className="py-10 md:py-14">
        <LiveProvider initialMatches={matches} initialMode={settings.eventMode}>
          <PredictionBoard initialMine={mine} standings={standings} labels={{
            pick: t("pred.pick"), locked: t("pred.locked"), saved: t("pred.saved"), yourName: t("pred.yourName"),
            points: t("pred.points"), empty: t("pred.empty"), leaderboard: t("pred.leaderboard"),
            closesAt: t("pred.closesAt"), save: t("cta.save"),
          }} />
        </LiveProvider>
      </Container>
    </>
  );
}
