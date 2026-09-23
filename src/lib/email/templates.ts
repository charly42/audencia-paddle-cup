import { siteUrl } from "../env";
import { BRAND } from "../brand";

/** Translator passé par l'appelant (langue de la personne qui a fait la démarche). */
type T = (k: string, v?: Record<string, string | number>) => string;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:${BRAND.paper};font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink}">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:${BRAND.blue};color:#fff;padding:22px 24px;border-radius:12px 12px 0 0">
<div style="font-size:12px;letter-spacing:2px;color:${BRAND.accent};font-weight:700">AUDENCIA PADEL CUP</div>
<div style="font-size:26px;font-weight:800;margin-top:6px">${esc(title)}</div></div>
<div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;line-height:1.5">${body}</div>
<p style="font-size:12px;color:${BRAND.slate};margin-top:16px">QUALIFY. REPRESENT. PLAY. CHALLENGE.</p></div></body></html>`;
const btn = (href: string, label: string) => `<p><a href="${href}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.ink};font-weight:800;text-decoration:none;padding:12px 20px;border-radius:999px">${esc(label)}</a></p>`;

export const teamRegisteredEmail = (p: { firstName: string; teamName: string; teamCode: string; slug: string }, t: T) => ({
  subject: t("mail.teamSubject", { team: p.teamName }),
  html: shell(t("reg.done"), `<p>${t("mail.hello", { name: esc(p.firstName) })}</p><p>${t("mail.teamRegistered", { team: esc(p.teamName) })}</p>
<p>${t("mail.teamId")} <b style="font-size:18px">${esc(p.teamCode)}</b></p>${btn(`${siteUrl}/team/${p.slug}`, t("mail.viewTeam"))}
<p>${t("mail.loginHint")}</p>${btn(`${siteUrl}/login?next=/player`, t("mail.playerLogin"))}`),
});
export const ticketEmail = (p: { firstName: string; token: string; code: string }, t: T) => ({
  subject: t("mail.ticketSubject"),
  html: shell(t("mail.ticketTitle"), `<p>${t("mail.ticketReady", { name: esc(p.firstName) })}</p><p>${t("mail.backup")} <b>${esc(p.code)}</b></p>${btn(`${siteUrl}/tickets/${p.token}`, t("mail.openTicket"))}<p style="font-size:12px;color:${BRAND.slate}">${t("mail.private")}</p>`),
});
/** Notifications (envoyées par l'admin ou le cron) : la langue du destinataire n'est pas connue, l'email est bilingue. */
export const notificationEmail = (p: { firstName: string; title: string; body?: string }) => ({
  subject: p.title,
  html: shell(p.title, `<p>Bonjour / Hello ${esc(p.firstName)},</p><p>${esc(p.body ?? p.title)}</p>${btn(`${siteUrl}/player`, "ESPACE JOUEUR / PLAYER SPACE")}`),
});
