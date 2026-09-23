import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { ScoreConsole } from "@/components/admin/ScoreConsole";
import { i18n } from "@/lib/i18n";

export default async function AdminScoresPage() {
  await requireAdmin("scores");
  const [matches, settings, courts, { t }] = await Promise.all([repo.listMatches(), repo.getSettings(), repo.listCourts(), i18n()]);
  return (
    <div className="max-w-4xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.courtside")}</p><h1 className="display text-6xl md:text-8xl">{t("a.scores")}</h1></header>
      <LiveProvider initialMatches={matches} initialMode={settings.eventMode}><ScoreConsole courts={courts} /></LiveProvider>
    </div>
  );
}
