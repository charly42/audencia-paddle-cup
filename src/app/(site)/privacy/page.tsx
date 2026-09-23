import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { DEFAULT_CONTENT } from "@/lib/content";
import { PageHero, Container } from "@/components/site/PageHero";
import { i18n, pickLang } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("priv.title"), description: t("priv.sub") };
}

export default async function PrivacyPage() {
  const [c, { t, locale }] = await Promise.all([repo.getContent(), i18n()]);
  const g = (k: string) => pickLang(c[k] ?? DEFAULT_CONTENT[k], locale);
  const sections: [string, string][] = [
    [t("priv.controller"), g("privacy.controller")],
    [t("priv.collect"), t("priv.collectBody")],
    [t("priv.who"), t("priv.whoBody")],
    [t("priv.retention"), g("privacy.retention")],
    [t("priv.rights"), `${t("priv.rightsBody")} ${g("privacy.contact")}`],
    [t("priv.legal"), g("privacy.legal")],
  ];
  return (
    <>
      <PageHero eyebrow={t("priv.eyebrow")} title={t("priv.title")} tone="ink" subtitle={t("priv.sub")} />
      <Container className="py-10 md:py-14 max-w-3xl space-y-4">
        {sections.map(([t, b]) => <section key={t} className="rounded-3xl bg-white border border-ink/10 p-6"><h2 className="display-md text-2xl md:text-3xl text-blue">{t}</h2><p className="mt-2 font-semibold text-slate whitespace-pre-line">{b}</p></section>)}
      </Container>
    </>
  );
}
