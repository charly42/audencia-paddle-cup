"use client";
import { useT } from "@/lib/i18n/provider";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <p className="num text-7xl text-blue">{t("err.fault")}</p>
      <h1 className="display-md text-3xl mt-2">{t("err.title")}</h1>
      <p className="mt-3 text-slate">{t("err.body")}</p>
      <button onClick={reset} className="mt-6 bg-blue text-white font-bold px-6 py-3 rounded-full">{t("err.retry")}</button>
    </section>
  );
}
