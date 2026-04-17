"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  status: string | null;
  resposta_lideranca: string | null;
  data_resposta_lideranca: string | null;
  validado_qualidade: boolean | null;
  data_validacao_qualidade: string | null;
  observacao_qualidade: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type HistoricoItem = {
  id: number;
  ocorrencia_id: number;
  acao: string | null;
  descricao: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  usuario_id: string | null;
  criado_em: string | null;
};

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

function getStatusLabel(status: string | null | undefined) {
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "EM_ANALISE_QUALIDADE") return "Em análise pela Qualidade";
  if (valor === "DIRECIONADA") return "Direcionada para Liderança";
  if (valor === "EM_TRATATIVA") return "Em tratativa pela Liderança";
  if (valor === "AGUARDANDO_VALIDACAO") return "Aguardando validação da Qualidade";
  if (valor === "ENCERRADA") return "Encerrada";

  return status || "-";
}

function getStatusClass(status: string | null | undefined) {
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "EM_ANALISE_QUALIDADE") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (valor === "DIRECIONADA") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (valor === "EM_TRATATIVA") {
    return "border border-purple-200 bg-purple-50 text-purple-700";
  }

  if (valor === "AGUARDANDO_VALIDACAO") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  if (valor === "ENCERRADA") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getGravidadeClass(gravidade: string | null | undefined) {
  const valor = String(gravidade || "").trim().toUpperCase();

  if (valor === "ALTA") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (valor === "MÉDIA" || valor === "MEDIA") {
    return "border border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (valor === "BAIXA") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getAcaoLabel(acao: string | null | undefined) {
  const valor = String(acao || "").trim().toUpperCase();

  if (valor === "CRIACAO") return "Criação da ocorrência";
  if (valor === "ALTERACAO_STATUS") return "Alteração de status";
  if (valor === "DIRECIONAMENTO") return "Direcionamento";
  if (valor === "RESPOSTA_LIDERANCA") return "Resposta da liderança";
  if (valor === "VALIDACAO_QUALIDADE") return "Validação da Qualidade";

  return acao || "Movimentação";
}

function getAcaoDotClass(acao: string | null | undefined) {
  const valor = String(acao || "").trim().toUpperCase();

  if (valor === "CRIACAO") return "bg-slate-500";
  if (valor === "ALTERACAO_STATUS") return "bg-blue-500";
  if (valor === "DIRECIONAMENTO") return "bg-indigo-500";
  if (valor === "RESPOSTA_LIDERANCA") return "bg-purple-500";
  if (valor === "VALIDACAO_QUALIDADE") return "bg-emerald-500";

  return "bg-slate-400";
}

export default function DetalheOcorrenciaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const { data: ocorrenciaData, error: erroOcorrencia } = await supabase
        .from("ocorrencias")
        .select(
          `
            id,
            titulo,
            descricao,
            tipo_ocorrencia,
            setor_origem,
            setor_responsavel,
            gravidade,
            status,
            resposta_lideranca,
            data_resposta_lideranca,
            validado_qualidade,
            data_validacao_qualidade,
            observacao_qualidade,
            created_at,
            updated_at
          `
        )
        .eq("id", id)
        .single();

      if (erroOcorrencia) {
        throw new Error(erroOcorrencia.message);
      }

      const { data: historicoData, error: erroHistorico } = await supabase
        .from("historico_ocorrencias")
        .select(
          `
            id,
            ocorrencia_id,
            acao,
            descricao,
            status_anterior,
            status_novo,
            usuario_id,
            criado_em
          `
        )
        .eq("ocorrencia_id", id)
        .order("criado_em", { ascending: false });

      if (erroHistorico) {
        throw new Error(erroHistorico.message);
      }

      setOcorrencia(ocorrenciaData as Ocorrencia);
      setHistorico((historicoData || []) as HistoricoItem[]);
    } catch (error: any) {
      console.error("Erro ao carregar detalhe da ocorrência:", error);
      setErro(error?.message || "Erro ao carregar ocorrência.");
      setOcorrencia(null);
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  const resumoHistorico = useMemo(() => {
    return {
      total: historico.length,
      ultimaMovimentacao: historico.length > 0 ? historico[0]?.criado_em : null,
    };
  }, [historico]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">Carregando ocorrência...</p>
          </div>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {erro}
          </div>

          <div className="mt-4">
            <Link
              href="/sistema"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!ocorrencia) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-600">Ocorrência não encontrada.</p>
          </div>

          <div className="mt-4">
            <Link
              href="/sistema"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Detalhe da Ocorrência</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Gestão da Qualidade
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Visualização completa da ocorrência, tratativas e histórico de movimentações.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={carregarDados}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Atualizar
            </button>

            <Link
              href="/sistema"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                    ocorrencia.status
                  )}`}
                >
                  {getStatusLabel(ocorrencia.status)}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getGravidadeClass(
                    ocorrencia.gravidade
                  )}`}
                >
                  Gravidade: {ocorrencia.gravidade || "-"}
                </span>

                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Tipo: {ocorrencia.tipo_ocorrencia || "-"}
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                {ocorrencia.titulo || "Sem título"}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {ocorrencia.descricao || "Sem descrição."}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Setor de origem
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {ocorrencia.setor_origem || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Setor responsável
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {ocorrencia.setor_responsavel || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Criada em
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatarData(ocorrencia.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Última atualização
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatarData(ocorrencia.updated_at)}
                  </p>
                </div>
              </div>
            </article>

            {ocorrencia.resposta_lideranca ? (
              <article className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Resposta da Liderança
                  </h3>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {ocorrencia.resposta_lideranca}
                </p>

                <p className="mt-4 text-xs text-slate-500">
                  Registrado em: {formatarData(ocorrencia.data_resposta_lideranca)}
                </p>
              </article>
            ) : null}

            {ocorrencia.observacao_qualidade ? (
              <article className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Observação da Qualidade
                  </h3>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {ocorrencia.observacao_qualidade}
                </p>

                {ocorrencia.data_validacao_qualidade ? (
                  <p className="mt-4 text-xs text-slate-500">
                    Validação em: {formatarData(ocorrencia.data_validacao_qualidade)}
                  </p>
                ) : null}
              </article>
            ) : null}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Resumo do Histórico</h3>

              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total de movimentações
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {resumoHistorico.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Última movimentação
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatarData(resumoHistorico.ultimaMovimentacao)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Histórico da Ocorrência
                </h3>
              </div>

              {historico.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                <div className="space-y-6">
                  {historico.map((item, index) => (
                    <div key={item.id} className="relative pl-8">
                      {index !== historico.length - 1 ? (
                        <div className="absolute left-[11px] top-7 h-[calc(100%+18px)] w-px bg-slate-200" />
                      ) : null}

                      <div
                        className={`absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-4 border-white shadow ${getAcaoDotClass(
                          item.acao
                        )}`}
                      />

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {getAcaoLabel(item.acao)}
                            </p>

                            <span className="text-xs text-slate-500">
                              {formatarData(item.criado_em)}
                            </span>
                          </div>

                          <p className="text-sm leading-6 text-slate-600">
                            {item.descricao || "Movimentação registrada no histórico."}
                          </p>

                          {(item.status_anterior || item.status_novo) ? (
                            <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Transição de status
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                                  Antes: {getStatusLabel(item.status_anterior)}
                                </span>

                                <span className="text-slate-400">→</span>

                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                                  Depois: {getStatusLabel(item.status_novo)}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}