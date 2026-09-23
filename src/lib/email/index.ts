import "server-only";
import { Resend } from "resend";

export interface EmailMessage { to: string; subject: string; html: string }
export interface EmailProvider { send(msg: EmailMessage): Promise<void> }

class ConsoleEmailProvider implements EmailProvider {
  async send(m: EmailMessage) { console.log(`\n📧 [email:console] → ${m.to}\n   ${m.subject}\n   (configurez RESEND_API_KEY pour envoyer réellement)\n`); }
}
class ResendEmailProvider implements EmailProvider {
  private client = new Resend(process.env.RESEND_API_KEY);
  async send(m: EmailMessage) {
    const { error } = await this.client.emails.send({ from: process.env.EMAIL_FROM || "Audencia Padel Cup <onboarding@resend.dev>", to: m.to, subject: m.subject, html: m.html });
    if (error) throw new Error(error.message);
  }
}
export const emailProvider: EmailProvider = process.env.RESEND_API_KEY ? new ResendEmailProvider() : new ConsoleEmailProvider();

/** Envoi « best effort » : un échec d'email ne doit jamais casser l'action utilisateur. */
export async function sendEmail(msg: EmailMessage) {
  try { await emailProvider.send(msg); } catch (e) { console.error("[email] échec d'envoi", e); }
}
