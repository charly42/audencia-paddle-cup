import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { DEFAULT_CONTENT } from "@/lib/content";
import { i18n } from "@/lib/i18n";
import { PartnersEditor, RulesEditor, ScheduleEditor, SettingsForm, TextBlocksEditor } from "@/components/admin/ContentEditors";

export default async function AdminContentPage() {
  await requireAdmin("content");
  const [settings, content, partners, schedule, { t }] = await Promise.all([repo.getSettings(), repo.getContent(), repo.listPartners(true), repo.listSchedule(), i18n()]);
  return (
    <div className="max-w-5xl space-y-8">
      <header><p className="text-xs font-extrabold tracking-[.3em] text-blue">{t("a.eb.edit")}</p><h1 className="display text-6xl md:text-8xl">{t("a.content")}</h1>
        <p className="text-slate font-semibold mt-2">{t("a.contentNote")}</p></header>
      <SettingsForm settings={settings} />
      <TextBlocksEditor content={content} defaults={DEFAULT_CONTENT} />
      <RulesEditor content={content} defaults={DEFAULT_CONTENT} />
      <ScheduleEditor items={schedule} />
      <PartnersEditor partners={partners} />
    </div>
  );
}
