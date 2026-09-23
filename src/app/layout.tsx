import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { BRAND } from "@/lib/brand";
import { dictionary, getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/ui/Toast";
import { RegisterSW } from "@/components/site/RegisterSW";

// Les pages lisent des données temps réel : jamais de rendu statique figé.
export const dynamic = "force-dynamic";

// « Big Shoulders » (anciennement Big Shoulders Display + Text, fusionnées par Google en une famille variable).
// Police variable (pas de `weight`) avec l'axe de taille optique : le navigateur choisit
// automatiquement le dessin « Display » pour les très grands titres.
// adjustFontFallback: false — Next n'a pas de métriques de repli pour cette famille ; la pile de repli est dans globals.css.
const display = Big_Shoulders({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display-face", display: "swap", adjustFontFallback: false });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });

const DESC = "Audencia Padel Cup — STAFF vs STUDENTS. Qualify. Represent. Play. Challenge. Tournoi de padel étudiants / staff au 4PADEL Saint-Ouen.";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Audencia Padel Cup — STAFF vs STUDENTS", template: "%s · Audencia Padel Cup" },
  description: DESC,
  applicationName: "Audencia Padel Cup",
  openGraph: { type: "website", siteName: "Audencia Padel Cup", title: "Audencia Padel Cup — STAFF vs STUDENTS", description: DESC, locale: "fr_FR", images: [{ url: "/api/card/og", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Audencia Padel Cup — STAFF vs STUDENTS", description: DESC, images: ["/api/card/og"] },
  appleWebApp: { capable: true, title: "Audencia Padel Cup", statusBarStyle: "black-translucent" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: BRAND.blue, width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh flex flex-col">
        {/* Dictionnaire de la langue active envoyé au client : les composants clients appellent useT(). */}
        <I18nProvider locale={locale} dict={dictionary(locale)}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
