"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../src/lib/supabase";

type Ocorrencia = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  tipo_ocorrencia: string | null;
  status: string | null;
  created_at: string | null;
  resposta_lideranca?: string | null;
  validado_qualidade?: boolean | null;
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
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

export default function SistemaPage() {
  const [loading, setLoading] = useState(true);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      try {
        const { data, error } = await supabase
          .from("ocorrencias")
          .select(
            `
            id,
            titulo,
            descricao,
            setor_origem,
            setor_responsavel,
            gravidade,
            tipo_ocorrencia,
            status,
            created_at,
            resposta_lideranca,
            validado_qualidade
          `
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Erro ao carregar ocorrências:", error);
          return;
        }

        if (!ativo) return;
        setOcorrencias((data ?? []) as Ocorrencia[]);
      } catch (error) {
        console.error("Erro inesperado ao carregar sistema:", error);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, []);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      emAnalise: ocorrencias.filter(
        (item) => item.status === "Em análise pela Qualidade"
      ).length,
      direcionadas: ocorrencias.filter(
        (item) => item.status === "Direcionada para Liderança"
      ).length,
      emTratativa: ocorrencias.filter(
        (item) => item.status === "Em tratativa pela Liderança"
      ).length,
      aguardandoValidacao: ocorrencias.filter(
        (item) => item.status === "Aguardando validação da Qualidade"
      ).length,
      encerradas: ocorrencias.filter((item) => item.status === "Encerrada")
        .length,
    };
  }, [ocorrencias]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[#dcecff] bg-gradient-to-r from-[#ecf7ff] via-[#f7fbff] to-white p-6 shadow-[0_24px_80px_rgba(59,130,246,0.10)] lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ea6ca]">
              Painel principal
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#10375c] sm:text-4xl">
              Sistema de Gestão da Qualidade
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e7d9b] sm:text-base">
              Ambiente central da operação da Qualidade, com acesso rápido às
              rotinas do sistema, visão resumida das ocorrências e navegação
              estruturada para acompanhamento profissional do fluxo hospitalar.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sistema/qualidade"
                className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
              >
                Abrir área da Qualidade
              </Link>

              <Link
                href="/sistema/lideranca"
                className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
              >
                Abrir área da Liderança
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="rounded-2xl border border-[#d8e9fb] bg-[#f7fbff] px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-white"
              >
                Registrar nova ocorrência
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] border border-[#e3f0fb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                Fluxo oficial
              </p>

              <div className="mt-4 space-y-3 text-sm leading-6 text-[#5d7b99]">
                <p>1. Colaborador abre a ocorrência sem login</p>
                <p>2. Qualidade analisa e direciona</p>
                <p>3. Liderança trata a ocorrência</p>
                <p>4. Liderança registra devolutiva e 5W2H</p>
                <p>5. Qualidade valida</p>
                <p>6. Qualidade encerra</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e3f0fb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                Diretriz do sistema
              </p>

              <div className="mt-4 space-y-3 text-sm leading-6 text-[#5d7b99]">
                <p>
                  A liderança <strong className="text-[#12385f]">não redireciona</strong>.
                </p>
                <p>
                  O direcionamento fica exclusivamente com a{" "}
                  <strong className="text-[#12385f]">Qualidade</strong>.
                </p>
                <p>
                  O frontend está alinhado ao fluxo automático já existente no banco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Total carregado</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.total}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em análise</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.emAnalise}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Direcionadas</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.direcionadas}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em tratativa</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.emTratativa}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Aguardando / encerradas</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.aguardandoValidacao + indicadores.encerradas}
          </h2>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                Ocorrências recentes
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#12385f]">
                Resumo operacional
              </h2>
            </div>

            <Link
              href="/sistema/qualidade"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8e9fb] bg-[#f7fbff] px-4 py-2.5 text-sm font-semibold text-[#275982] transition hover:bg-white"
            >
              Ir para Qualidade
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[24px] border border-[#e7f1fb] bg-[#fbfdff] p-5"
                >
                  <div className="h-5 w-48 animate-pulse rounded bg-[#e7f1fb]" />
                  <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[#eef5fb]" />
                  <div className="mt-4 h-4 w-40 animate-pulse rounded bg-[#eef5fb]" />
                </div>
              ))
            ) : ocorrencias.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
                  📋
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
                  Nenhuma ocorrência encontrada
                </h3>
                <p className="mt-2 text-sm text-[#6482a0]">
                  Assim que os registros forem criados, eles aparecerão neste
                  painel interno.
                </p>
              </div>
            ) : (
              ocorrencias.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[28px] border border-[#e7f1fb] bg-[#fbfdff] p-5 transition hover:border-[#d1e6f8] hover:bg-white"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[#12385f]">
                          {item.titulo || "Ocorrência sem título"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status || "Sem status"}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#62809d]">
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

                    <div className="text-sm text-[#6f8daa] xl:min-w-[160px] xl:text-right">
                      <p>
                        <strong className="text-[#32597d]">Abertura:</strong>{" "}
                        {formatarData(item.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
              Acesso rápido
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#12385f]">
              Módulos do sistema
            </h2>

            <div className="mt-6 space-y-4">
              <Link
                href="/sistema/qualidade"
                className="block rounded-[24px] border border-[#e6f2ff] bg-[#f8fbff] p-5 transition hover:border-[#d0e6f8] hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f4ff] text-xl">
                    ✅
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#12385f]">
                      Área da Qualidade
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6482a0]">
                      Direcionamento, observações, validação final e encerramento.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sistema/lideranca"
                className="block rounded-[24px] border border-[#e6f2ff] bg-[#f8fbff] p-5 transition hover:border-[#d0e6f8] hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f4ff] text-xl">
                    🩺
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#12385f]">
                      Área da Liderança
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6482a0]">
                      Tratativa setorial, devolutiva da liderança e 5W2H integrado.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="block rounded-[24px] border border-[#e6f2ff] bg-[#f8fbff] p-5 transition hover:border-[#d0e6f8] hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f4ff] text-xl">
                    ➕
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#12385f]">
                      Nova ocorrência
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6482a0]">
                      Registro público da ocorrência para entrada no fluxo do sistema.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
              Situação resumida
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#12385f]">
              Leitura rápida do fluxo
            </h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-[#eef4fa] bg-[#fbfdff] p-4">
                <p className="text-sm font-semibold text-[#5e7c99]">
                  Ocorrências aguardando ação da Qualidade
                </p>
                <p className="mt-2 text-3xl font-bold text-[#10375c]">
                  {indicadores.emAnalise + indicadores.aguardandoValidacao}
                </p>
              </div>

              <div className="rounded-[24px] border border-[#eef4fa] bg-[#fbfdff] p-4">
                <p className="text-sm font-semibold text-[#5e7c99]">
                  Ocorrências em andamento na liderança
                </p>
                <p className="mt-2 text-3xl font-bold text-[#10375c]">
                  {indicadores.direcionadas + indicadores.emTratativa}
                </p>
              </div>

              <div className="rounded-[24px] border border-[#eef4fa] bg-[#fbfdff] p-4">
                <p className="text-sm font-semibold text-[#5e7c99]">
                  Ocorrências encerradas
                </p>
                <p className="mt-2 text-3xl font-bold text-[#10375c]">
                  {indicadores.encerradas}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}