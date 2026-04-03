import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Gestão da Qualidade",
  description: "Sistema hospitalar de gestão da qualidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f4f8f6",
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
          color: "#17372d",
        }}
      >
        {children}
      </body>
    </html>
  );
}