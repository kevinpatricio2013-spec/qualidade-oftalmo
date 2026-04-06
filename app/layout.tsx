import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão da Qualidade",
  description: "Sistema hospitalar de gestão da qualidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}