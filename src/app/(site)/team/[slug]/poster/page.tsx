import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { i18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Poster", robots: { index: false } };

/**
 * Affiche A4 imprimable d'une équipe (QR code vers sa page publique).
 * Conçue pour Ctrl+P : fond forcé à l'impression, aucun élément de navigation.
 */
export default async function PosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await repo.getTeamBySlug(slug);
  if (!team) notFound();
  const [settings, { t }] = await Promise.all([repo.getSettings(), i18n()]);
  const url = `${siteUrl}/team/${team.slug}`;
  return (
    <>
      <style>{`@page { size: A4 portrait; margin: 0 }
        @media print { .no-print { display: none !important } body { background: #fff } }
        .poster { print-color-adjust: exact; -webkit-print-color-adjust: exact }`}</style>
      <div className="no-print bg-ink text-white text-center text-sm font-bold py-2">
        {t("poster.print")} · {t("share.poster")}
      </div>
      <div className="poster on-dark mx-auto bg-blue text-white court-lines" style={{ width: "210mm", minHeight: "297mm", padding: "18mm" }}>
        <p className="text-xs font-extrabold tracking-[.35em] text-lime">AUDENCIA PADEL CUP</p>
        <p className="display text-6xl mt-2">STAFF <span className="text-lime">VS</span> STUDENTS</p>
        <p className="display text-[5.5rem] leading-[.85] mt-12">{team.name}</p>
        <p className="display-md text-4xl text-lime mt-3">{team.promotionName ?? team.program}</p>
        <p className="mt-6 text-2xl font-extrabold">{team.players.map((p) => `${p.firstName} ${p.lastName}`).join("  ·  ")}</p>
        <div className="mt-14 flex items-end justify-between gap-8">
          <div>
            <p className="display text-5xl">{t("poster.scan")}<br /><span className="text-lime">{t("poster.support")}</span></p>
            <p className="mt-3 text-lg font-bold text-white/85">{t("poster.follow")}</p>
            <p className="mt-6 text-sm font-extrabold tracking-widest">{url.replace(/^https?:\/\//, "")}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl shrink-0">
            <QRCodeSVG value={url} size={230} level="M" marginSize={0} title={team.name} />
          </div>
        </div>
        <p className="mt-14 text-sm font-extrabold tracking-[.25em] text-lime">QUALIFY. REPRESENT. PLAY. CHALLENGE.</p>
        <p className="mt-1 text-sm font-bold text-white/70">{settings.venue}</p>
      </div>
    </>
  );
}
