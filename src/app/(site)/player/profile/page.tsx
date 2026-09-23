import type { Metadata } from "next";
import { requirePlayer } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { PageHero, Container } from "@/components/site/PageHero";
import { Button } from "@/components/ui/Button";
import { i18n } from "@/lib/i18n";
import { LogOut } from "lucide-react";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default async function ProfilePage() {
  const { profile, player, team } = await requirePlayer();
  const { t } = await i18n();
  const rows: [string, string][] = [
    [t("prof.firstName"), player?.firstName ?? profile.firstName ?? "—"], [t("prof.lastName"), player?.lastName ?? profile.lastName ?? "—"], [t("prof.email"), profile.email],
    [t("prof.phone"), player?.phone ?? "—"], [t("prof.level"), player ? t(`level.${player.skillLevel}`) : "—"], [t("prof.team"), team?.name ?? "—"],
  ];
  return (
    <>
      <PageHero eyebrow={t("nav.playerSpace")} title={t("prof.title")} />
      <Container className="py-10 md:py-14 max-w-2xl space-y-6">
        <dl className="rounded-3xl bg-white border border-ink/10 divide-y divide-ink/10">
          {rows.map(([k, v]) => <div key={k} className="px-6 py-4 flex justify-between gap-4"><dt className="text-xs font-extrabold tracking-widest text-slate pt-1">{k}</dt><dd className="font-extrabold text-right break-all">{v}</dd></div>)}
        </dl>
        <p className="text-sm text-slate font-semibold">{t("prof.note")}</p>
        <form action={logoutAction}><Button variant="ghost" type="submit"><LogOut size={18} aria-hidden />{t("cta.logout")}</Button></form>
      </Container>
    </>
  );
}
