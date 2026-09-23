import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { ModerationList } from "@/components/admin/ModerationList";
import { i18n } from "@/lib/i18n";

export default async function ModerationPage() {
  await requireAdmin("content");
  const [pending, approved, { t }] = await Promise.all([repo.listCheers(undefined, "pending"), repo.listCheers(undefined, "approved"), i18n()]);
  return (
    <div className="max-w-5xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.community")}</p><h1 className="display text-6xl md:text-8xl">{t("a.moderation")}</h1>
        <p className="text-slate font-semibold mt-2">{t("a.modNote")}</p></header>
      <ModerationList pending={pending} approved={approved} />
    </div>
  );
}
