"use server";
import { i18n, tr } from "../i18n";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { repo } from "../repo";
import { registerSchema, ticketSchema } from "../schemas";
import { clientIp, rateLimit } from "../rate-limit";
import { uploadPhoto } from "../storage";
import { sendEmail } from "../email";
import { teamRegisteredEmail, ticketEmail } from "../email/templates";
import { track } from "../analytics";
import { hashFingerprint } from "../tokens";
import type { ActionResult } from "../types";

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

/** Inscription d'une équipe (2 joueurs). Validation + anti-spam + upload photo côté serveur. */
export async function registerTeamAction(formData: FormData): Promise<ActionResult<{ teamCode: string; slug: string; teamName: string }>> {
  try {
    const { t } = await i18n();
    if (!(await rateLimit("register", 5, 60 * 60_000))) return fail(await tr("err.rateHour"));
    const parsed = registerSchema.safeParse(JSON.parse(String(formData.get("payload") ?? "{}")));
    if (!parsed.success) return fail(await tr(parsed.error.issues[0]?.message ?? "err.invalid"));
    const v = parsed.data;
    if (v.website) return fail(await tr("err.refused"));

    const settings = await repo.getSettings();
    if (!settings.registrationOpen) return fail(await tr("err.regClosed"));
    if (settings.registrationDeadline && new Date(settings.registrationDeadline) < new Date()) return fail(await tr("err.regDeadline"));
    const promo = (await repo.listPromotions()).find((p) => p.id === v.promotionId);
    if (!promo) return fail(await tr("err.unknownPromo"));

    let photoUrl: string | null = null;
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) photoUrl = await uploadPhoto(photo, "teams");

    const { team, teamCode } = await repo.registerTeam({ teamName: v.teamName, promotionId: v.promotionId, program: v.program, photoUrl, players: v.players });
    await Promise.all(v.players.map((p) => sendEmail({ to: p.email, ...teamRegisteredEmail({ firstName: p.firstName, teamName: team.name, teamCode, slug: team.slug }, t) })));
    await track("team_registration", { promotion: promo.name });
    revalidatePath("/teams");
    return { ok: true, data: { teamCode, slug: team.slug, teamName: team.name } };
  } catch (e) {
    return fail(await tr(e instanceof Error ? e.message : "err.unexpected"));
  }
}

/** Billet gratuit (idempotent par email). Architecture prête pour Stripe : brancher le paiement avant createTicket. */
export async function createTicketAction(input: unknown): Promise<ActionResult<{ token: string }>> {
  try {
    const { t } = await i18n();
    if (!(await rateLimit("ticket", 10, 60 * 60_000))) return fail(await tr("err.rateLater"));
    const parsed = ticketSchema.safeParse(input);
    if (!parsed.success) return fail(await tr(parsed.error.issues[0]?.message ?? "err.invalid"));
    const v = parsed.data;
    if (v.website) return fail(await tr("err.refused"));
    const settings = await repo.getSettings();
    if (!settings.ticketingOpen) return fail(await tr("err.ticketClosed"));
    if (settings.ticketCapacity && (await repo.listTickets()).length >= settings.ticketCapacity) return fail(await tr("err.ticketFull"));

    const { ticket, existing } = await repo.createTicket({ firstName: v.firstName, lastName: v.lastName, email: v.email, ticketType: v.ticketType, promotionId: v.promotionId || null });
    await sendEmail({ to: ticket.email, ...ticketEmail({ firstName: ticket.firstName, token: ticket.token, code: ticket.code }, t) });
    if (!existing) await track("ticket_registration", { type: ticket.ticketType });
    return { ok: true, data: { token: ticket.token } };
  } catch (e) {
    return fail(await tr(e instanceof Error ? e.message : "err.unexpected"));
  }
}

/** « I SUPPORT THIS TEAM » — engagement uniquement, sans impact sportif. 1 soutien / navigateur / équipe. */
export async function supportTeamAction(teamId: string): Promise<ActionResult<{ count: number; already: boolean }>> {
  try {
    if (!(await rateLimit("support", 30, 60 * 60_000))) return fail(await tr("err.supportRate"));
    const jar = await cookies();
    let sid = jar.get("apc_sid")?.value;
    if (!sid) {
      sid = randomUUID();
      jar.set("apc_sid", sid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 180, path: "/" });
    }
    const fp = hashFingerprint([sid, await clientIp()]);
    const res = await repo.supportTeam(teamId, fp);
    if (!res.already) await track("team_support");
    revalidatePath("/supporters");
    return { ok: true, data: res };
  } catch (e) {
    return fail(await tr(e instanceof Error ? e.message : "err.unexpected"));
  }
}
