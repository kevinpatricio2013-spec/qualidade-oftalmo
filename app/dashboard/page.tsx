"use client";

import Link from "next/link";

const indicadores = [
  { titulo: "Ocorrências Totais", valor: 128 },
  { titulo: "Pendentes", valor: 32 },
  { titulo: "Em Tratativa", valor: 18 },
  { titulo: "Resolvidas", valor: 78 },
];

const setores = [
  { nome: "Centro Cirúrgico", valor: 34 },
  { nome: "CME", valor: 22 },
  { nome: "Recepção", valor: 18 },
  { nome: "Faturamento", valor: 12 },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard Executivo
            </h1>
            <p className="text-sm text-slate-500">
              Visão geral das ocorrências e desempenho institucional
            </p>
          </div>

          <Link
            href="/sistema"
            className="bg-cyan-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-cyan-800"
          >
            Ir para sistema
          </Link>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicadores.map((item) => (
            <div
              key={item.titulo}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.titulo}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {item.valor}
              </p>
            </div>
          ))}
        </div>

        {/* SETORES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Ocorrências por setor
          </h2>

          <div className="space-y-3">
            {setores.map((setor) => (
              <div key={setor.nome}>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{setor.nome}</span>
                  <span>{setor.valor}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-cyan-600 h-2 rounded-full"
                    style={{ width: `${setor.valor}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Situação das ocorrências
            </h2>

            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Pendentes</span>
                <span className="font-semibold text-red-600">32</span>
              </li>
              <li className="flex justify-between">
                <span>Em tratativa</span>
                <span className="font-semibold text-yellow-600">18</span>
              </li>
              <li className="flex justify-between">
                <span>Resolvidas</span>
                <span className="font-semibold text-green-600">78</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Navegação rápida
            </h2>

            <div className="space-y-3">
              <Link
                href="/"
                className="block bg-slate-800 p-3 rounded-xl hover:bg-slate-700"
              >
                Página inicial
              </Link>

              <Link
                href="/sistema"
                className="block bg-slate-800 p-3 rounded-xl hover:bg-slate-700"
              >
                Gestão de ocorrências
              </Link>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
