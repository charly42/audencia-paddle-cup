import { i18n } from "@/lib/i18n";

export default async function Offline() {
  const { t } = await i18n();
  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <p className="display text-7xl text-blue">{t("offline.title")}</p>
      <p className="mt-3 text-slate font-semibold">{t("offline.body")}</p>
    </section>
  );
}
