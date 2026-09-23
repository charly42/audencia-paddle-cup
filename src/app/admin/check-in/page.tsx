import { requireAdmin } from "@/lib/auth";
import { CheckInConsole } from "@/components/admin/CheckInConsole";
import { i18n } from "@/lib/i18n";

export default async function CheckInPage() {
  await requireAdmin("check-in");
  const { t } = await i18n();
  return (
    <div className="max-w-6xl space-y-6">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.entrance")}</p><h1 className="display text-6xl md:text-8xl">{t("a.checkin")}</h1></header>
      <CheckInConsole />
    </div>
  );
}
