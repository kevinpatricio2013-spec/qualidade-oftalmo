import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão de Ocorrências",
  description: "Sistema hospitalar de gestão de ocorrências",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}