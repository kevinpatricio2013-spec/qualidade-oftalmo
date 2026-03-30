"use client";

import type { StatusOcorrencia } from "@/src/types/ocorrencia";

interface StatusBadgeProps {
  status: StatusOcorrencia;
}

const estilos: Record<StatusOcorrencia, string> = {
  Aberta: "bg-slate-100 text-slate-700 border-slate-200",
  "Em análise pela Qualidade": "bg-amber-50 text-amber-700 border-amber-200",
  "Direcionada ao setor": "bg-sky-50 text-sky-700 border-sky-200",
  "Em tratativa": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Aguardando validação": "bg-violet-50 text-violet-700 border-violet-200",
  "Concluída": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estilos[status]}`}
    >
      {status}
    </span>
  );
}