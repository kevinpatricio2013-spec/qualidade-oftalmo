"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Props = {
  nome?: string;
  role?: string;
};

export default function BarraSistema({ nome, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function ativo(href: string) {
    if (href === "/sistema") {
      return pathname === "/sistema" || pathname.startsWith("/sistema/");
    }
    return pathname === href;
  }

  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";
  const ativoClasse = "bg-emerald-500 text-white border border-emerald-500";
  const inativoClasse =
    "bg-white text-slate-700 border border-emerald-100 hover:bg-emerald-50";

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-emerald-50/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-sm">
              SG
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-800">
                Sistema de Gestão de Ocorrências
              </h1>
              <p className="truncate text-sm text-slate-600">
                {nome ? `Usuário: ${nome}` : "Ambiente hospitalar"}
                {role ? ` • Perfil: ${role}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className={`${base} ${ativo("/") ? ativoClasse : inativoClasse}`}
            >
              Início
            </Link>

            <Link
              href="/dashboard"
              className={`${base} ${
                ativo("/dashboard") ? ativoClasse : inativoClasse
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/sistema"
              className={`${base} ${
                ativo("/sistema") ? ativoClasse : inativoClasse
              }`}
            >
              Ocorrências
            </Link>

            <Link
              href="/sistema/nova"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              Nova ocorrência
            </Link>

            <button
              type="button"
              onClick={handleSair}
              className="inline-flex items-center justify-center rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}