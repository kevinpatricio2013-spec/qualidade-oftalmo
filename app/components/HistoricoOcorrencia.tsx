"use client";

type HistoricoItem = {
  id: number;
  tipo_evento: string;
  descricao: string;
  status_anterior: string | null;
  status_novo: string | null;
  usuario: string | null;
  origem: string | null;
  created_at: string;
};

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR");
}

function corEvento(tipo: string) {
  switch (tipo) {
    case "STATUS":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "TRATATIVA":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "ACAO_5W2H":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "CRIACAO":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "EDICAO":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function nomeEvento(tipo: string) {
  switch (tipo) {
    case "STATUS":
      return "Mudança de status";
    case "TRATATIVA":
      return "Tratativa";
    case "ACAO_5W2H":
      return "Plano de ação 5W2H";
    case "CRIACAO":
      return "Criação";
    case "EDICAO":
      return "Edição";
    default:
      return tipo;
  }
}

export default function HistoricoOcorrencia({
  historico,
}: {
  historico: HistoricoItem[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Histórico da ocorrência
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Registro automático de mudanças de status, tratativas e ações realizadas.
        </p>
      </div>

      {historico.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Nenhum histórico encontrado para esta ocorrência.
        </div>
      ) : (
        <div className="space-y-4">
          {historico.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-sky-600" />
                {index < historico.length - 1 && (
                  <div className="mt-1 h-full w-px bg-slate-200" />
                )}
              </div>

              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${corEvento(
                      item.tipo_evento
                    )}`}
                  >
                    {nomeEvento(item.tipo_evento)}
                  </span>

                  <span className="text-xs text-slate-500">
                    {formatarData(item.created_at)}
                  </span>

                  {item.origem && (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                      Origem: {item.origem}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-6 text-slate-700">{item.descricao}</p>

                {(item.status_anterior || item.status_novo) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {item.status_anterior && (
                      <span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-red-700">
                        Antes: {item.status_anterior}
                      </span>
                    )}
                    {item.status_novo && (
                      <span className="rounded-lg border border-green-100 bg-green-50 px-2 py-1 text-green-700">
                        Depois: {item.status_novo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}