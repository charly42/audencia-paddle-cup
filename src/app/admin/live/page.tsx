import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { LiveProvider } from "@/components/sport/LiveProvider";
import { LiveControl } from "@/components/admin/LiveControl";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { i18n } from "@/lib/i18n";

export default async function AdminLivePage() {
  await requireAdmin("live");
  const [matches, settings, courts, { t }] = await Promise.all([repo.listMatches(), repo.getSettings(), repo.listCourts(), i18n()]);
  return (
    <div className="max-w-7xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.command")}</p><h1 className="display text-6xl md:text-8xl">{t("a.live")}</h1></header>
      <AnnouncementForm settings={settings} />
      <LiveProvider initialMatches={matches} initialMode={settings.eventMode}><LiveControl courts={courts} /></LiveProvider>
    </div>
  );
}
