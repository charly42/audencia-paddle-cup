import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { VolunteerAdmin } from "@/components/admin/VolunteerAdmin";
import { i18n } from "@/lib/i18n";

export default async function AdminVolunteersPage() {
  await requireAdmin("content");
  const [shifts, courts, settings, { t }] = await Promise.all([repo.listShifts(), repo.listCourts(), repo.getSettings(), i18n()]);
  return (
    <div className="max-w-6xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.staffing")}</p><h1 className="display text-6xl md:text-8xl">{t("a.volunteers")}</h1>
        {!settings.volunteersEnabled && <p className="mt-3 rounded-2xl bg-lime px-4 py-3 font-bold inline-block">{t("a.volOff")}</p>}</header>
      <VolunteerAdmin shifts={shifts} courts={courts} />
    </div>
  );
}
