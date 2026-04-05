"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../src/lib/supabase";

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
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "Em análise pela Qualidade":
      return "bg-[#fff6db] text-[#9a6b00]";
    case "Direcionada para Liderança":
      return "bg-[#e8f3ff] text-[#0f5d99]";
    case "Em tratativa pela Liderança":
      return "bg-[#eaf8ff] text-[#0077a8]";
    case "Aguardando validação da Qualidade":
      return "bg-[#efe9ff] text-[#6849b6]";
    case "Encerrada":
      return "bg-[#e8f8ef] text-[#1c7c4d]";
    default:
      return "bg-[#edf4fb] text-[#52718e]";
  }
}

export default function SistemaPage() {
  const [loading, setLoading] = useState(true);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  useEffect(() => {
    let active = true;

    async function carregarResumo() {
      try {
        const { data, error } = await supabase
          .from("ocorrencias")
          .select(
            "id, titulo, descricao, setor_origem, setor_responsavel, gravidade, tipo_ocorrencia, status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) {
          console.error("Erro ao carregar ocorrências:", error);
          return;
        }

        if (!active) return;
        setOcorrencias(data ?? []);
      } catch (error) {
        console.error("Erro inesperado:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    carregarResumo();

    return () => {
      active = false;
    };
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emAnalise = ocorrencias.filter(
      (item) => item.status === "Em análise pela Qualidade"
    ).length;
    const emTratativa = ocorrencias.filter(
      (item) =>
        item.status === "Direcionada para Liderança" ||
        item.status === "Em tratativa pela Liderança"
    ).length;
    const aguardandoValidacao = ocorrencias.filter(
      (item) => item.status === "Aguardando validação da Qualidade"
    ).length;
    const encerradas = ocorrencias.filter(
      (item) => item.status === "Encerrada"
    ).length;

    return {
      total,
      emAnalise,
      emTratativa,
      aguardandoValidacao,
      encerradas,
    };
  }, [ocorrencias]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#dcecff] bg-gradient-to-r from-[#ecf7ff] via-[#f5fbff] to-white p-6 shadow-[0_20px_60px_rgba(25,118,210,0.10)]">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7ea6ca]">
              Área do sistema
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#10375c] sm:text-3xl">
              Painel base do Sistema da Qualidade
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5c7b99] sm:text-base">
              Esta é a base profissional da área autenticada, com visual
              hospitalar limpo, navegação lateral e acesso rápido às rotinas de
              Qualidade e Liderança, respeitando o fluxo já definido do sistema.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/sistema/qualidade"
                className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
              >
                Abrir área da Qualidade
              </Link>

              <Link
                href="/sistema/lideranca"
                className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
              >
                Abrir área da Liderança
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-[#dfedfb] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                Fluxo oficial
              </p>
              <div className="mt-3 space-y-2 text-sm text-[#567491]">
                <p>1. Colaborador abre ocorrência sem login</p>
                <p>2. Qualidade analisa e direciona</p>
                <p>3. Liderança trata a ocorrência</p>
                <p>4. Liderança registra tratativa e 5W2H</p>
                <p>5. Volta para Qualidade validar</p>
                <p>6. Qualidade encerra</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#dfedfb] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                Visual do projeto
              </p>
              <p className="mt-3 text-sm leading-6 text-[#567491]">
                Interface clara, azul suave, linguagem profissional e estrutura
                pronta para crescer com páginas específicas por perfil.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Total carregado</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.total}
          </h2>
        </div>

        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em análise</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.emAnalise}
          </h2>
        </div>

        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em tratativa</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.emTratativa}
          </h2>
        </div>

        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Aguardando validação</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.aguardandoValidacao}
          </h2>
        </div>

        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Encerradas</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.encerradas}
          </h2>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                Últimas ocorrências
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#12385f]">
                Resumo operacional
              </h2>
            </div>

            <Link
              href="/ocorrencia/nova"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8e9fb] bg-[#f7fbff] px-4 py-2.5 text-sm font-semibold text-[#275982] transition hover:bg-[#eef7ff]"
            >
              Abrir nova ocorrência
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#ebf4fc] bg-[#fafcff] p-4"
                  >
                    <div className="h-4 w-40 animate-pulse rounded bg-[#e4f0fb]" />
                    <div className="mt-3 h-3 w-64 animate-pulse rounded bg-[#edf5fb]" />
                    <div className="mt-2 h-3 w-28 animate-pulse rounded bg-[#edf5fb]" />
                  </div>
                ))}
              </div>
            ) : ocorrencias.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
                  📝
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
                  Nenhuma ocorrência encontrada
                </h3>
                <p className="mt-2 text-sm text-[#6482a0]">
                  Assim que os registros forem sendo criados, eles aparecerão
                  neste resumo do sistema.
                </p>
              </div>
            ) : (
              ocorrencias.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-[#e7f1fb] bg-[#fbfdff] p-5 transition hover:border-[#cfe4f8] hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#12385f]">
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

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6482a0]">
                        {item.descricao || "Sem descrição informada."}
                      </p>
                    </div>

                    <div className="text-sm text-[#6f8daa] lg:text-right">
                      <p>Abertura: {formatarData(item.created_at)}</p>
                    </div>
                  </div>

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
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
              Próximos módulos
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#12385f]">
              Estrutura pronta para evolução
            </h2>

            <div className="mt-5 space-y-4">
              <Link
                href="/sistema/qualidade"
                className="block rounded-3xl border border-[#e6f2ff] bg-[#f8fbff] p-5 transition hover:border-[#cfe4f8] hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6f4ff] text-xl">
                    ✅
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#12385f]">
                      Área da Qualidade
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6482a0]">
                      Tela para análise, direcionamento, validação final e
                      encerramento da ocorrência.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sistema/lideranca"
                className="block rounded-3xl border border-[#e6f2ff] bg-[#f8fbff] p-5 transition hover:border-[#cfe4f8] hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6f4ff] text-xl">
                    🩺
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#12385f]">
                      Área da Liderança
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6482a0]">
                      Tela para tratativa da ocorrência, resposta da liderança e
                      integração do 5W2H.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
              Diretriz do projeto
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#12385f]">
              Regras mantidas
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-[#6482a0]">
              <p>
                <strong className="text-[#12385f]">Colaborador:</strong> abre a
                ocorrência sem login.
              </p>
              <p>
                <strong className="text-[#12385f]">Qualidade:</strong> analisa,
                direciona, valida e encerra.
              </p>
              <p>
                <strong className="text-[#12385f]">Liderança:</strong> não
                redireciona; apenas trata a ocorrência e devolve para validação.
              </p>
              <p>
                <strong className="text-[#12385f]">Status:</strong> automáticos
                no banco, sem intervenção manual indevida no fluxo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}