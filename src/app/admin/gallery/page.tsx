import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { GalleryAdmin } from "@/components/admin/GalleryAdmin";
import { i18n } from "@/lib/i18n";

export default async function AdminGalleryPage() {
  await requireAdmin("content");
  const [photos, teams, { t }] = await Promise.all([repo.listPhotos(), repo.listTeams(), i18n()]);
  return (
    <div className="max-w-6xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.after")}</p><h1 className="display text-6xl md:text-8xl">{t("a.gallery")}</h1></header>
      <GalleryAdmin photos={photos} teams={teams} />
    </div>
  );
}
