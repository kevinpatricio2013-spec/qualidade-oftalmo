"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_destino: string | null;
  gravidade: string | null;
  status: string | null;
  created_at: string | null;
  resposta_lideranca?: string | null;
};

function formatarData(data?: string | null) {
  if (!data) return "Sem data";
  try {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Sem data";
  }
}

function corStatus(status?: string | null) {
  switch (status) {
    case "Aberta":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Em análise":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Direcionada":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Em tratativa":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Respondida":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Concluída":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Erro ao carregar dashboard do sistema:", error);
      setErro("Não foi possível carregar os dados do sistema.");
      setOcorrencias([]);
      setCarregando(false);
      return;
    }

    setOcorrencias((data as Ocorrencia[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
    const direcionadas = ocorrencias.filter((o) => o.status === "Direcionada").length;
    const respondidas = ocorrencias.filter((o) => o.status === "Respondida").length;
    const concluidas = ocorrencias.filter((o) => o.status === "Concluída").length;

    return {
      total,
      abertas,
      direcionadas,
      respondidas,
      concluidas,
    };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="p-8">
              <div className="mb-4 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                Sistema de Gestão da Qualidade
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
                Painel central do sistema hospitalar
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Ambiente central para acompanhamento das ocorrências, direcionamento
                pela Qualidade, tratativa pela liderança e monitoramento dos fluxos
                assistenciais e administrativos.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/abrir-ocorrencia"
                  className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Abrir ocorrência
                </Link>

                <Link
                  href="/sistema/qualidade"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Área da Qualidade
                </Link>

                <Link
                  href="/sistema/lideranca"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Área da Liderança
                </Link>
              </div>
            </div>

            <div className="border-l border-slate-200 bg-slate-50 p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Visão rápida
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Registros
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {indicadores.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Abertas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {indicadores.abertas}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Direcionadas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-cyan-700">
                    {indicadores.direcionadas}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Concluídas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {indicadores.concluidas}
                  </p>
                </div>
              </div>

              <Link
                href="/sistema/indicadores"
                className="mt-5 inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Ver indicadores
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Link
            href="/sistema/qualidade"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              QUALIDADE
            </div>
            <h3 className="text-xl font-semibold text-slate-800">
              Direcionamento e classificação
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Visualize todas as ocorrências, classifique, acompanhe e direcione
              cada registro para o setor responsável.
            </p>
          </Link>

          <Link
            href="/sistema/lideranca"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              LIDERANÇA
            </div>
            <h3 className="text-xl font-semibold text-slate-800">
              Tratativa setorial
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Permite que cada líder acompanhe os registros direcionados ao seu
              setor e devolva a resposta formal para a Qualidade.
            </p>
          </Link>

          <Link
            href="/abrir-ocorrencia"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              REGISTRO
            </div>
            <h3 className="text-xl font-semibold text-slate-800">
              Nova ocorrência
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Acesso rápido para abertura de ocorrência, com foco em usabilidade,
              rastreabilidade e padronização do fluxo.
            </p>
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Ocorrências recentes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Últimos registros para acompanhamento rápido pela gestão.
              </p>
            </div>

            <Link
              href="/sistema/qualidade"
              className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver todas
            </Link>
          </div>

          {carregando ? (
            <div className="p-6 text-sm text-slate-500">Carregando dados do sistema...</div>
          ) : erro ? (
            <div className="p-6 text-sm text-red-600">{erro}</div>
          ) : ocorrencias.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Nenhuma ocorrência encontrada até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ocorrencias.map((item) => (
                <Link
                  key={item.id}
                  href={`/sistema/ocorrencia/${item.id}`}
                  className="block p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-800">
                          {item.titulo || "Ocorrência sem título"}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${corStatus(
                            item.status
                          )}`}
                        >
                          {item.status || "Sem status"}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.descricao || "Sem descrição informada."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Origem: {item.setor_origem || "Não informado"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Destino: {item.setor_destino || "Não direcionado"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Tipo: {item.tipo_ocorrencia || "Não informado"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Gravidade: {item.gravidade || "Não classificada"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-slate-500">
                      {formatarData(item.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}