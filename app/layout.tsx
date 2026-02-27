import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webit COP",
  description: "SaaS COP multi-tenant pour Webit"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

