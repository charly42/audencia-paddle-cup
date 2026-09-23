import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/env";
import { QRTicket } from "@/components/sport/Ticket";
import { Container } from "@/components/site/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { i18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Ticket", robots: { index: false, follow: false } };

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const ticket = await repo.getTicketByToken((await params).token);
  if (!ticket) notFound();
  const [settings, { t }] = await Promise.all([repo.getSettings(), i18n()]);
  return (
    <Container className="py-10 md:py-16">
      <QRTicket ticket={ticket} url={`${siteUrl}/tickets/${ticket.token}`} eventName={settings.eventName} venue={settings.venue} date={settings.eventDate} />
      <p className="text-center text-sm text-slate font-semibold mt-6 max-w-md mx-auto">{t("ticket.note")}</p>
      <div className="mt-6 flex justify-center"><LinkButton href="/" variant="ghost">{t("ticket.backHome")}</LinkButton></div>
    </Container>
  );
}
