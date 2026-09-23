import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { DEFAULT_CONTENT, RULE_KEYS, isTbc, type RuleSection } from "@/lib/content";
import { i18n, pickLang } from "@/lib/i18n";
import { PageHero, Container } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.rules"), description: t("rules.sub") };
}

export default async function RulesPage() {
  const [content, { t, locale }] = await Promise.all([repo.getContent(), i18n()]);
  return (
    <>
      <PageHero eyebrow={t("rules.eyebrow")} title={t("nav.rules")} subtitle={t("rules.sub")} />
      <Container className="py-10 md:py-14 max-w-4xl space-y-3">
        {RULE_KEYS.map(([k, label], i) => {
          const s = (content[`rules.${k}`] ?? DEFAULT_CONTENT[`rules.${k}`]) as RuleSection;
          const tbc = s.tbc || isTbc(s.body);
          const title = pickLang(s.title, locale) || pickLang(label, locale);
          const body = pickLang(s.body, locale);
          return (
            <details key={k} className="group rounded-3xl bg-white border border-ink/10 open:border-blue" open={i === 0}>
              <summary className="cursor-pointer list-none flex items-center gap-4 p-5 md:p-6 min-h-16">
                <span className="num text-4xl text-blue/40 w-12">{String(i + 1).padStart(2, "0")}</span>
                <span className="display-md text-2xl md:text-4xl flex-1">{title}</span>
                {tbc && <Badge tone="light">{t("rules.tbc")}</Badge>}
                <ChevronDown className="transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-5 pb-6 md:px-6 md:pl-[5.5rem] text-slate font-semibold whitespace-pre-line">{body}</div>
            </details>
          );
        })}
      </Container>
    </>
  );
}
