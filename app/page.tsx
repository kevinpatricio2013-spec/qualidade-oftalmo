"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Hospitalar
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Sistema de Gestão de Qualidade
              </h1>
              <p className="mt-4 text-base text-slate-600">
                Plataforma para registro, análise e acompanhamento de ocorrências.
              </p>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link
                href="/abrir-ocorrencia"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Abrir ocorrência
              </Link>

              <Link
                href="/sistema"
                className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Acessar gestão
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}