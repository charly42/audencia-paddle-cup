import type { Metadata } from "next";

export const metadata: Metadata = { title: "Display", robots: { index: false, follow: false } };

/** Écrans campus : plein écran, sans navigation, curseur masqué. */
export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <div className="on-dark min-h-dvh bg-blue-deep text-white cursor-none overflow-hidden court-lines">{children}</div>;
}
