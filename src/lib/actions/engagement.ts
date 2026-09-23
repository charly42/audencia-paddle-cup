"use server";
import { tr } from "../i18n";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { repo } from "../repo";
import { getProfile } from "../auth";
import { clientIp, rateLimit } from "../rate-limit";
import { hashFingerprint } from "../tokens";
import { predictionSchema, cheerSchema } from "../schemas";
import { track } from "../analytics";
import type { ActionResult } from "../types";

/** Identifiant anonyme stable (cookie + IP hachés) : un pronostic / un message par navigateur. */
async function fingerprint(): Promise<string> {
  const jar = await cookies();
  let sid = jar.get("apc_sid")?.value;
  if (!sid) {
    sid = randomUUID();
    jar.set("apc_sid", sid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 180, path: "/" });
  }
  return hashFingerprint([sid, await clientIp()]);
}

/** Pronostic sur un match. Verrouillé dès que le match n'est plus « à venir ». */
export async function savePredictionAction(input: unknown): Promise<ActionResult<{ locked?: boolean }>> {
  try {
    if (!(await rateLimit("prediction", 60, 60 * 60_000))) return { ok: false, error: await tr("err.rateLater") };
    const parsed = predictionSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: await tr(parsed.error.issues[0]?.message ?? "err.invalid") };
    const { matchId, teamId, displayName } = parsed.data;
    if (!(await repo.getSettings()).predictionsEnabled) return { ok: false, error: await tr("err.predOff") };
    const profile = await getProfile();
    const res = await repo.savePrediction(matchId, teamId, await fingerprint(), displayName, profile && !profile.id.startsWith("demo:") ? profile.id : null);
    if (res === "locked") return { ok: false, error: await tr("err.predLocked"), data: { locked: true } };
    await track("page_view", { kind: "prediction" });
    revalidatePath("/predictions");
    return { ok: true };
  } catch (e) { return { ok: false, error: await tr(e instanceof Error ? e.message : "err.unexpected") }; }
}

/** Message d'encouragement sur la page d'une équipe. Publié après validation par l'organisation. */
export async function sendCheerAction(input: unknown): Promise<ActionResult> {
  try {
    if (!(await rateLimit("cheer", 10, 60 * 60_000))) return { ok: false, error: await tr("err.cheerRate") };
    const parsed = cheerSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: await tr(parsed.error.issues[0]?.message ?? "err.invalid") };
    const v = parsed.data;
    if (v.website) return { ok: false, error: await tr("err.refused") };
    if (!(await repo.getSettings()).cheersEnabled) return { ok: false, error: await tr("err.cheerOff") };
    const team = await repo.getTeamById(v.teamId);
    if (!team) return { ok: false, error: await tr("err.unknownTeam") };
    await repo.addCheer(v.teamId, v.author, v.message, await fingerprint());
    revalidatePath(`/team/${team.slug}`);
    return { ok: true };
  } catch (e) { return { ok: false, error: await tr(e instanceof Error ? e.message : "err.unexpected") }; }
}

/** Inscription d'un bénévole sur un créneau. */
export async function assignVolunteerAction(shiftId: string, name: string, email: string, phone: string): Promise<ActionResult> {
  try {
    if (!(await rateLimit("volunteer", 20, 60 * 60_000))) return { ok: false, error: "Trop de tentatives." };
    if (!name.trim() || name.length > 60) return { ok: false, error: await tr("err.nameRequired") };
    if (!(await repo.getSettings()).volunteersEnabled) return { ok: false, error: await tr("err.volOff") };
    const res = await repo.assignVolunteer(shiftId, name.trim(), email.trim() || null, phone.trim() || null);
    if (res === "full") return { ok: false, error: await tr("err.shiftFull") };
    revalidatePath("/volunteers");
    return { ok: true };
  } catch (e) { return { ok: false, error: await tr(e instanceof Error ? e.message : "err.unexpected") }; }
}
