"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-3xl w-full text-center">

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Gestão da Qualidade
        </p>

        <h1 className="mt-4 text-4xl font-bold text-slate-900">
          Sistema Hospitalar
        </h1>

        <p className="mt-4 text-slate-600">
          Plataforma profissional para registro, análise e tratamento de não conformidades.
        </p>

        <div className="mt-8 flex justify-center gap-4">

          <Link
            href="/login"
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700"
          >
            Acessar sistema
          </Link>

          <Link
            href="/ocorrencia/nova"
            className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Abrir ocorrência
          </Link>

        </div>
      </div>
    </main>
  );
}