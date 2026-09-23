"use client";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/lib/i18n/provider";

/** QR code d'une URL (page équipe) — pour affiches, écrans campus, stories. */
export function QRBlock({ url, label }: { url: string; label: string }) {
  const t = useT();
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-3xl bg-white border border-ink/10 p-5">
      <QRCodeSVG value={url} size={144} level="M" marginSize={1} title={label} />
      <p className="text-[11px] font-extrabold tracking-widest text-slate">{t("team.scanFollow")}</p>
    </div>
  );
}
