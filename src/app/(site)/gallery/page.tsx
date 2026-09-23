import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { i18n } from "@/lib/i18n";
import { PageHero, Container } from "@/components/site/PageHero";
import { EmptyState } from "@/components/ui/Skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("gallery.title"), description: t("gallery.sub") };
}

export default async function GalleryPage() {
  const [settings, { t }] = await Promise.all([repo.getSettings(), i18n()]);
  if (!settings.galleryEnabled) notFound();
  const photos = await repo.listPhotos();
  return (
    <>
      <PageHero eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} subtitle={t("gallery.sub")} />
      <Container className="py-10 md:py-14">
        {photos.length ? (
          <ul className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {photos.map((p) => (
              <li key={p.id} className="mb-4 break-inside-avoid rounded-3xl overflow-hidden bg-white border border-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-auto object-cover" />
                {(p.caption || p.credit) && (
                  <div className="p-4">
                    {p.caption && <p className="font-bold">{p.caption}</p>}
                    {p.credit && <p className="text-xs text-slate font-semibold mt-1">© {p.credit}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <EmptyState title={t("gallery.title")} body={t("gallery.empty")} />}
      </Container>
    </>
  );
}
