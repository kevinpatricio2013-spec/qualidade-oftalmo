"use client";

import Link from "next/link";

type Ocorrencia = {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  setor_origem?: string | null;
  setor_responsavel?: string | null;
  gravidade?: string | null;
  tipo_ocorrencia?: string | null;
  status?: string | null;
  created_at?: string | null;
  prazo?: string | null;
};

type Props = {
  ocorrencias: Ocorrencia[];
  emptyMessage?: string;
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function diasParaVencimento(data?: string | null) {
  if (!data) return null;

  const hoje = new Date();
  const prazo = new Date(data);

  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  const diffMs = prazo.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "Em análise pela Qualidade":
      return "bg-[#fff4d9] text-[#996b00]";
    case "Direcionada para Liderança":
      return "bg-[#e8f4ff] text-[#0f5d99]";
    case "Em tratativa pela Liderança":
      return "bg-[#e7faff] text-[#0077a8]";
    case "Aguardando validação da Qualidade":
      return "bg-[#efe9ff] text-[#6d4bb6]";
    case "Encerrada":
      return "bg-[#e8f8ef] text-[#1c7c4d]";
    default:
      return "bg-[#eef5fb] text-[#5a7590]";
  }
}

function getPrazoTexto(prazo?: string | null) {
  const dias = diasParaVencimento(prazo);

  if (dias === null) return "Sem prazo";
  if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return "Vence hoje";
  return `Vence em ${dias} dia(s)`;
}

function getPrazoClass(prazo?: string | null) {
  const dias = diasParaVencimento(prazo);

  if (dias === null) return "bg-[#eef5fb] text-[#5a7590]";
  if (dias < 0) return "bg-[#ffe7e7] text-[#b42318]";
  if (dias === 0) return "bg-[#fff1db] text-[#9a6700]";
  if (dias <= 3) return "bg-[#fff7e8] text-[#9a6700]";
  return "bg-[#eef8f1] text-[#1c7c4d]";
}

export default function OcorrenciaList({
  ocorrencias,
  emptyMessage = "Nenhuma ocorrência encontrada.",
}: Props) {
  if (!ocorrencias || ocorrencias.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
          📋
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ocorrencias.map((item) => (
        <article
          key={item.id}
          className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-[#12385f]">
                  {item.titulo || "Ocorrência sem título"}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                    item.status
                  )}`}
                >
                  {item.status || "Sem status"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getPrazoClass(
                    item.prazo
                  )}`}
                >
                  {getPrazoTexto(item.prazo)}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#5f7f9d]">
                {item.descricao || "Sem descrição informada."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.setor_origem && (
                  <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#4d7294]">
                    Origem: {item.setor_origem}
                  </span>
                )}

                {item.setor_responsavel && (
                  <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#4d7294]">
                    Responsável: {item.setor_responsavel}
                  </span>
                )}

                {item.gravidade && (
                  <span className="rounded-full bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#5c6d92]">
                    Gravidade: {item.gravidade}
                  </span>
                )}

                {item.tipo_ocorrencia && (
                  <span className="rounded-full bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#597692]">
                    Tipo: {item.tipo_ocorrencia}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="text-sm text-[#6785a2]">
                <p>
                  <strong className="text-[#32597d]">Abertura:</strong>{" "}
                  {formatarData(item.created_at)}
                </p>
                <p>
                  <strong className="text-[#32597d]">Prazo:</strong>{" "}
                  {formatarData(item.prazo)}
                </p>
              </div>

              <Link
                href={`/ocorrencia/${item.id}`}
                className="rounded-2xl border border-[#d8e9fb] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff]"
              >
                Ver detalhe
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}