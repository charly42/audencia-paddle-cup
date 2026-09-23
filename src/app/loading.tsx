import { Skeleton } from "@/components/ui/Skeleton";
import { i18n } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await i18n();
  return (
    <div className="max-w-6xl mx-auto px-5 py-16 space-y-6" aria-busy="true" aria-label={t("loading")}>
      <Skeleton className="h-16 w-2/3" /><Skeleton className="h-6 w-1/2" />
      <div className="grid md:grid-cols-3 gap-4 pt-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
    </div>
  );
}
