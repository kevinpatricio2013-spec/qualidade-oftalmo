"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import LogoutButton from "@/src/components/auth/LogoutButton";

const links = [
  { href: "/sistema", label: "Visão Geral" },
  { href: "/sistema/qualidade", label: "Qualidade" },
  { href: "/sistema/lideranca", label: "Liderança" },
  { href: "/sistema/indicadores", label: "Indicadores" },
  { href: "/abrir-ocorrencia", label: "Abrir Ocorrência" },
];

export default function SistemaLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    async function verificar() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setCarregandoSessao(false);
    }

    verificar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (carregandoSessao) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
          Verificando acesso...
        </div>
      </div>
    );
  }

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

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => {
                const ativo = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      ativo
                        ? "border border-sky-200 bg-sky-50 text-sky-700"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}