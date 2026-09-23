import type { Metadata } from "next";
import { repo } from "@/lib/repo";
import { PageHero, Container } from "@/components/site/PageHero";
import { i18n } from "@/lib/i18n";
import { TicketForm } from "@/components/site/TicketForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await i18n();
  return { title: t("nav.tickets"), description: t("tk.sub") };
}

export default async function TicketsPage() {
  const [settings, promotions, tickets, { t }] = await Promise.all([repo.getSettings(), repo.listPromotions(), repo.listTickets(), i18n()]);
  const full = settings.ticketCapacity != null && tickets.length >= settings.ticketCapacity;
  const closed = !settings.ticketingOpen ? t("tk.closedNotOpen") : full ? t("tk.closedFull") : undefined;
  return (
    <>
      <PageHero eyebrow={t("tk.eyebrow")} title={t("cta.tickets")} subtitle={t("tk.sub")} />
      <Container className="py-10 md:py-14 max-w-3xl"><TicketForm promotions={promotions.filter((p) => p.active)} closedReason={closed} /></Container>
    </>
  );
}
