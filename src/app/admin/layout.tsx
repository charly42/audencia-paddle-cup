import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { canAccess, ROLE_LABEL, type AdminArea } from "@/lib/permissions";
import { logoutAction } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { i18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

/** Menu admin : `key` = clé de traduction du libellé. */
const ITEMS: { href: string; key: string; area: AdminArea }[] = [
  { href: "/admin", key: "a.dashboard", area: "dashboard" }, { href: "/admin/live", key: "a.live", area: "live" },
  { href: "/admin/scores", key: "a.scores", area: "scores" }, { href: "/admin/matches", key: "a.matches", area: "matches" },
  { href: "/admin/teams", key: "a.teams", area: "teams" }, { href: "/admin/check-in", key: "a.checkin", area: "check-in" },
  { href: "/admin/tickets", key: "a.tickets", area: "tickets" }, { href: "/admin/practice", key: "a.practice", area: "practice" },
  { href: "/admin/moderation", key: "a.moderation", area: "content" }, { href: "/admin/gallery", key: "a.gallery", area: "content" },
  { href: "/admin/volunteers", key: "a.volunteers", area: "content" }, { href: "/admin/content", key: "a.content", area: "content" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin("dashboard");
  const { t, locale } = await i18n();
  const items = ITEMS.filter((i) => canAccess(profile.role, i.area)).map((i) => ({ href: i.href, label: t(i.key) }));
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr] bg-paper">
      <aside className="on-dark bg-ink text-white p-4 md:p-5 md:sticky md:top-0 md:h-dvh md:overflow-y-auto flex flex-col gap-4">
        <div className="flex md:block items-center justify-between gap-3">
          <Link href="/admin" className="display text-3xl leading-none">APC<span className="text-lime"> {t("a.admin")}</span></Link>
          <p className="text-[11px] font-extrabold tracking-widest text-lime md:mt-2">{ROLE_LABEL[profile.role]}</p>
        </div>
        <AdminNav items={items} />
        <div className="hidden md:flex mt-auto flex-col gap-2 text-sm font-bold">
          <LanguageSwitcher locale={locale} label={t("lang.switch")} dark />
          <Link href="/" className="text-white/70 hover:text-lime">{t("cta.publicSite")}</Link>
          <form action={logoutAction}><button className="inline-flex items-center gap-2 text-white/70 hover:text-lime"><LogOut size={16} aria-hidden />{t("cta.logout")}</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-4 md:p-8">{children}</div>
    </div>
  );
}
