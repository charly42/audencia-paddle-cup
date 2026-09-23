import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { TeamEditor } from "@/components/admin/TeamEditor";
import { i18n } from "@/lib/i18n";

export default async function AdminTeamPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("teams");
  const team = await repo.getTeamById((await params).id);
  if (!team) notFound();
  const [promotions, { t }] = await Promise.all([repo.listPromotions(), i18n()]);
  return (
    <div className="space-y-6">
      <Link href="/admin/teams" className="font-extrabold text-sm underline underline-offset-4">{t("a.allTeams")}</Link>
      <h1 className="display text-6xl md:text-8xl">{team.name}</h1>
      <TeamEditor team={team} promotions={promotions} />
    </div>
  );
}
