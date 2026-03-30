"use client";

import Link from "next/link";
import StatusBadge from "@/src/components/sistema/StatusBadge";
import { diasParaVencimento, formatarData } from "@/src/lib/qualidade";
import type { Ocorrencia } from "@/src/types/ocorrencia";

interface OcorrenciaListProps {
  titulo: string;
  descricao?: string;
  ocorrencias: Ocorrencia[];
  vazioTexto?: string;
}

export default function OcorrenciaList({
  titulo,
  descricao,
  ocorrencias,
  vazioTexto = "Nenhuma ocorrência encontrada.",
}: OcorrenciaListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
        {descricao ? <p className="mt-1 text-sm text-slate-500">{descricao}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Título</th>
              <th className="px-6 py-4 font-semibold">Origem</th>
              <th className="px-6 py-4 font-semibold">Destino</th>
              <th className="px-6 py-4 font-semibold">Gravidade</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Prazo</th>
              <th className="px-6 py-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ocorrencias.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  {vazioTexto}
                </td>
              </tr>
            ) : (
              ocorrencias.map((item) => {
                const dias = diasParaVencimento(item.prazo);
                const prazoClasse =
                  dias === null
                    ? "text-slate-500"
                    : dias < 0
                    ? "text-rose-600 font-semibold"
                    : dias <= 3
                    ? "text-amber-600 font-semibold"
                    : "text-emerald-700";

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-slate-900">#{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.titulo}</div>
                      <div className="text-xs text-slate-500">
                        Abertura em {formatarData(item.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {item.setor_origem || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {item.setor_destino || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {item.gravidade || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className={`px-6 py-4 ${prazoClasse}`}>
                      {item.prazo ? formatarData(item.prazo) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/sistema/ocorrencia/${item.id}`}
                        className="inline-flex rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}