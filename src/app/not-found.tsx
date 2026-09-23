import Link from "next/link";
import { i18n } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await i18n();
  return (
    <section className="on-dark bg-blue text-white min-h-[70dvh] grid place-items-center court-lines px-6 text-center">
      <div>
        <p className="num text-[9rem] md:text-[16rem] text-lime">404</p>
        <h1 className="display text-4xl md:text-6xl -mt-4">{t("nf.title")}</h1>
        <p className="mt-4 text-white/80 max-w-md mx-auto">{t("nf.body")}</p>
        <Link href="/" className="mt-8 inline-flex bg-lime text-ink font-extrabold px-7 py-3.5 rounded-full">{t("nf.back")}</Link>
      </div>
    </section>
  );
}
