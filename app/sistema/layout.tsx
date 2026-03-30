import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/sistema", label: "Visão Geral" },
  { href: "/sistema/qualidade", label: "Qualidade" },
  { href: "/sistema/lideranca", label: "Liderança" },
  { href: "/sistema/indicadores", label: "Indicadores" },
  { href: "/abrir-ocorrencia", label: "Abrir Ocorrência" },
];

export default function SistemaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Sistema de Gestão de Qualidade
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Gestão hospitalar de ocorrências
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Plataforma com visão de Qualidade, Liderança, fluxo assistencial e indicadores.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}