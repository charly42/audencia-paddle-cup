import "server-only";
import { repo } from "./repo";
import { sendEmail } from "./email";
import { notificationEmail } from "./email/templates";

/** Notification joueur : in-app (table notifications) + email. Architecture prête pour du push (V2). */
export async function notifyProfile(profile: { id: string; email: string; firstName: string | null }, n: { kind: string; title: string; body?: string; email?: boolean }) {
  try {
    await repo.addNotification(profile.id, { kind: n.kind, title: n.title, body: n.body });
    if (n.email !== false) await sendEmail({ to: profile.email, ...notificationEmail({ firstName: profile.firstName ?? "", title: n.title, body: n.body }) });
  } catch (e) { console.error("[notify]", e); }
}

/** Notifie les deux joueurs d'une équipe. */
export async function notifyTeam(teamId: string, n: { kind: string; title: string; body?: string; email?: boolean }) {
  const team = await repo.getTeamById(teamId);
  if (!team) return;
  const players = (await repo.listPlayers()).filter((p) => p.teamId === teamId && p.profileId && p.email);
  await Promise.all(players.map((p) => notifyProfile({ id: p.profileId!, email: p.email!, firstName: p.firstName }, n)));
}
