"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../src/lib/supabase";

type StatusOcorrencia =
  | "aberta"
  | "em_triagem_qualidade"
  | "direcionada_ao_setor"
  | "em_analise"
  | "plano_de_acao"
  | "aguardando_validacao_qualidade"
  | "encerrada"
  | "reaberta"
  | "cancelada";

type Severidade = "leve" | "moderada" | "grave" | "sentinela" | null;

type Ocorrencia = {
  id: number;
  codigo: string | null;
  titulo: string;
  descricao: string;
  status: StatusOcorrencia;
  severidade: Severidade;
  created_at: string;
  prazo_tratativa: string | null;
  setor_origem_id: string | null;
  setor_destino_id: string | null;
  setor_origem?: { nome: string } | null;
  setor_destino?: { nome: string } | null;
};

type Setor = {
  id: string;
  nome: string;
};

const STATUS_LABEL: Record<StatusOcorrencia, string> = {
  aberta: "Aberta",
  em_triagem_qualidade: "Em triagem",
  direcionada_ao_setor: "Direcionada",
  em_analise: "Em análise",
  plano_de_acao: "Plano de ação",
  aguardando_validacao_qualidade: "Aguardando validação",
  encerrada: "Encerrada",
  reaberta: "Reaberta",
  cancelada: "Cancelada",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const [{ data: setoresData, error: setoresError }, { data, error }] =
        await Promise.all([
          supabase
            .from("setores")
            .select("id, nome")
            .eq("ativo", true)
            .order("nome", { ascending: true }),

          supabase
            .from("ocorrencias")
            .select(`
              id,
              codigo,
              titulo,
              descricao,
              status,
              severidade,
              created_at,
              prazo_tratativa,
              setor_origem_id,
              setor_destino_id,
              setor_origem:setor_origem_id ( nome ),
              setor_destino:setor_destino_id ( nome )
            `)
            .order("created_at", { ascending: false }),
        ]);

      if (setoresError) throw setoresError;
      if (error) throw error;

      setSetores((setoresData || []) as Setor[]);
      setOcorrencias((data || []) as unknown as Ocorrencia[]);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter((o) => o.status === "aberta").length;
    const triagem = ocorrencias.filter(
      (o) => o.status === "em_triagem_qualidade"
    ).length;
    const tratamento = ocorrencias.filter((o) =>
      ["direcionada_ao_setor", "em_analise", "plano_de_acao"].includes(o.status)
    ).length;
    const validacao = ocorrencias.filter(
      (o) => o.status === "aguardando_validacao_qualidade"
    ).length;
    const encerradas = ocorrencias.filter(
      (o) => o.status === "encerrada"
    ).length;

    return {
      total,
      abertas,
      triagem,
      tratamento,
      validacao,
      encerradas,
    };
  }, [ocorrencias]);

  const porStatus = useMemo(() => {
    return Object.keys(STATUS_LABEL).map((status) => ({
      status: status as StatusOcorrencia,
      label: STATUS_LABEL[status as StatusOcorrencia],
      total: ocorrencias.filter((o) => o.status === status).length,
    }));
  }, [ocorrencias]);

  const porSeveridade = useMemo(() => {
    return [
      {
        label: "Leve",
        total: ocorrencias.filter((o) => o.severidade === "leve").length,
      },
      {
        label: "Moderada",
        total: ocorrencias.filter((o) => o.severidade === "moderada").length,
      },
      {
        label: "Grave",
        total: ocorrencias.filter((o) => o.severidade === "grave").length,
      },
      {
        label: "Sentinela",
        total: ocorrencias.filter((o) => o.severidade === "sentinela").length,
      },
      {
        label: "Não informada",
        total: ocorrencias.filter((o) => !o.severidade).length,
      },
    ];
  }, [ocorrencias]);

  const porSetorDestino = useMemo(() => {
    return setores
      .map((setor) => ({
        nome: setor.nome,
        total: ocorrencias.filter((o) => o.setor_destino_id === setor.id).length,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [ocorrencias, setores]);

  const registrosRecentes = useMemo(() => {
    return ocorrencias.slice(0, 8);
  }, [ocorrencias]);

  function corStatus(status: StatusOcorrencia) {
    switch (status) {
      case "encerrada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "aguardando_validacao_qualidade":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "plano_de_acao":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "em_analise":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "em_triagem_qualidade":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "reaberta":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "cancelada":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  function nomeSetor(relacao: { nome: string } | null | undefined, id: string | null) {
    if (relacao?.nome) return relacao.nome;
    const setor = setores.find((s) => s.id === id);
    return setor?.nome || "Não informado";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <section className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">
                Gestão de Qualidade
              </p>
              <h1 className="mt-2 text-3xl font-bold">Dashboard Executivo</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200">
                Visão consolidada das ocorrências, não conformidades, tratativas
                e andamento operacional da Qualidade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Página inicial
              </Link>
              <Link
                href="/sistema"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Ir para o sistema
              </Link>
            </div>
          </div>
        </section>

        {erro ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <CardIndicador titulo="Total" valor={indicadores.total} />
          <CardIndicador titulo="Abertas" valor={indicadores.abertas} />
          <CardIndicador titulo="Triagem" valor={indicadores.triagem} />
          <CardIndicador titulo="Em tratamento" valor={indicadores.tratamento} />
          <CardIndicador titulo="Validação" valor={indicadores.validacao} />
          <CardIndicador titulo="Encerradas" valor={indicadores.encerradas} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Bloco titulo="Distribuição por status" descricao="Leitura rápida do andamento dos registros.">
              <div className="grid gap-4 md:grid-cols-2">
                {porStatus.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.label}
                      </p>
                      <span className="text-2xl font-bold text-slate-900">
                        {item.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Bloco>

            <Bloco
              titulo="Registros recentes"
              descricao="Últimas ocorrências lançadas no sistema."
            >
              <div className="space-y-3">
                {registrosRecentes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum registro encontrado.
                  </p>
                ) : (
                  registrosRecentes.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {item.codigo || `OC-${item.id}`}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {item.titulo}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${corStatus(
                            item.status
                          )}`}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>

                      <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                        <span>
                          <strong>Origem:</strong>{" "}
                          {nomeSetor(item.setor_origem, item.setor_origem_id)}
                        </span>
                        <span>
                          <strong>Destino:</strong>{" "}
                          {nomeSetor(item.setor_destino, item.setor_destino_id)}
                        </span>
                        <span>
                          <strong>Severidade:</strong>{" "}
                          {item.severidade || "Não informada"}
                        </span>
                        <span>
                          <strong>Prazo:</strong>{" "}
                          {item.prazo_tratativa
                            ? new Date(item.prazo_tratativa).toLocaleDateString(
                                "pt-BR"
                              )
                            : "Não definido"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Bloco>
          </div>

          <div className="space-y-6">
            <Bloco
              titulo="Severidade"
              descricao="Classificação dos registros lançados."
            >
              <div className="space-y-3">
                {porSeveridade.map((item) => (
                  <LinhaResumo key={item.label} label={item.label} valor={item.total} />
                ))}
              </div>
            </Bloco>

            <Bloco
              titulo="Setores mais demandados"
              descricao="Principais destinos de encaminhamento."
            >
              <div className="space-y-3">
                {porSetorDestino.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Ainda não há direcionamentos por setor.
                  </p>
                ) : (
                  porSetorDestino.map((item) => (
                    <LinhaResumo key={item.nome} label={item.nome} valor={item.total} />
                  ))
                )}
              </div>
            </Bloco>

            <Bloco
              titulo="Direcionamento"
              descricao="Atalhos úteis para navegação principal."
            >
              <div className="grid gap-3">
                <Link
                  href="/sistema"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Abrir módulo operacional
                </Link>
                <Link
                  href="/"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Voltar para a página inicial
                </Link>
              </div>
            </Bloco>
          </div>
        </section>
      </div>
    </main>
  );
}

function CardIndicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{valor}</h3>
    </div>
  );
}

function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
        <p className="text-sm text-slate-500">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

function LinhaResumo({
  label,
  valor,
}: {
  label: string;
  valor: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-lg font-bold text-slate-900">{valor}</span>
    </div>
  );
}