"use client";

import Link from "next/link";
import { Building2, ShieldCheck, BarChart3, Users, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-700 p-3 text-white shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sistema de Gestão da Qualidade</h1>
              <p className="text-sm text-slate-600">
                Gestão de ocorrências, tratativas e indicadores assistenciais e operacionais
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-5 shadow-sm">
              <ShieldCheck className="mb-3 text-emerald-700" size={26} />
              <h2 className="text-lg font-semibold">Central da Qualidade</h2>
              <p className="mt-2 text-sm text-slate-600">
                Recebe, analisa, classifica, direciona, valida e encerra ocorrências.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5 shadow-sm">
              <Users className="mb-3 text-emerald-700" size={26} />
              <h2 className="text-lg font-semibold">Liderança Setorial</h2>
              <p className="mt-2 text-sm text-slate-600">
                Acompanha e trata exclusivamente as ocorrências destinadas ao seu setor.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5 shadow-sm">
              <BarChart3 className="mb-3 text-emerald-700" size={26} />
              <h2 className="text-lg font-semibold">Painel Executivo</h2>
              <p className="mt-2 text-sm text-slate-600">
                Consolida indicadores institucionais, desempenho setorial e monitoramento estratégico.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-800"
            >
              Acessar sistema
            </Link>

            <Link
              href="/ocorrencia/nova"
              className="rounded-xl border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Registrar ocorrência
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <ClipboardList className="mb-3 text-emerald-700" size={24} />
            <h3 className="text-base font-semibold">Fluxo estruturado</h3>
            <p className="mt-2 text-sm text-slate-600">
              Toda ocorrência é recebida inicialmente pela Qualidade, que faz a triagem e o
              direcionamento técnico ao setor responsável.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <ShieldCheck className="mb-3 text-emerald-700" size={24} />
            <h3 className="text-base font-semibold">Perfis com acesso controlado</h3>
            <p className="mt-2 text-sm text-slate-600">
              Cada perfil visualiza apenas o que é compatível com sua função institucional.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <BarChart3 className="mb-3 text-emerald-700" size={24} />
            <h3 className="text-base font-semibold">Indicadores para decisão</h3>
            <p className="mt-2 text-sm text-slate-600">
              Dashboards por perfil com foco assistencial, operacional e executivo.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}