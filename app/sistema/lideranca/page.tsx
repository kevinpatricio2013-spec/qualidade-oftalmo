"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

type Ocorrencia = {
  id: string;
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
  observacao_qualidade: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizarRole(role: string | null | undefined) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

function getStatusLabel(status: string | null | undefined) {
  return status || "Sem status";
}

function getStatusClass(status: string | null | undefined) {
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "ABERTA" || valor === "EM ANÁLISE PELA QUALIDADE") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (valor === "DIRECIONADA AO SETOR") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }

  if (valor === "EM TRATATIVA") {
    return "bg-purple-50 text-purple-700 border border-purple-200";
  }

  if (valor === "AGUARDANDO VALIDAÇÃO DA QUALIDADE") {
    return "bg-orange-50 text-orange-700 border border-orange-200";
  }

  if (valor === "CONCLUÍDA" || valor === "CONCLUIDA") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-50 text-slate-700 border border-slate-200";
}

function getGravidadeClass(gravidade: string | null | undefined) {
  const valor = String(gravidade || "").trim().toUpperCase();

  if (valor === "ALTA") return "bg-red-50 text-red-700 border border-red-200";
  if (valor === "MÉDIA" || valor === "MEDIA") {
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
  if (valor === "BAIXA") return "bg-emerald-50 text-emerald-700 border border-emerald-200";

  return "bg-slate-50 text-slate-700 border border-slate-200";
}

export default function LiderancaPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, email, role, setor")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error("Perfil do usuário não encontrado.");
      }

      const roleNormalizado = normalizarRole(profile.role);
      const setor = String(profile.setor || "").trim();

      if (roleNormalizado !== "LIDERANCA" && roleNormalizado !== "LIDER") {
        throw new Error("Este usuário não possui perfil de liderança.");
      }

      if (!setor) {
        throw new Error(
          "O perfil da liderança está sem setor vinculado. Preencha o campo setor na tabela profiles."
        );
      }

      setPerfil(profile as Profile);

      const { data: ocorrenciasData, error: ocorrenciasError } = await supabase
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
            observacao_qualidade,
            created_at,
            updated_at
          `
        )
        .eq("setor_responsavel", setor)
        .order("created_at", { ascending: false });

      if (ocorrenciasError) {
        throw new Error(`Erro ao buscar ocorrências: ${ocorrenciasError.message}`);
      }

      const lista = (ocorrenciasData || []) as Ocorrencia[];
      setOcorrencias(lista);

      const respostasIniciais: Record<string, string> = {};
      for (const item of lista) {
        respostasIniciais[item.id] = item.resposta_lideranca || "";
      }
      setRespostas(respostasIniciais);
    } catch (error: any) {
      console.error("Erro em carregarDados:", error);
      setErro(error?.message || "Erro ao carregar painel da liderança.");
      setOcorrencias([]);
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarResposta(ocorrenciaId: string) {
    try {
      setSalvandoId(ocorrenciaId);
      setErro("");

      const texto = String(respostas[ocorrenciaId] || "").trim();

      if (!texto) {
        throw new Error("Preencha a resposta da liderança antes de salvar.");
      }

      const payload = {
        resposta_lideranca: texto,
        data_resposta_lideranca: new Date().toISOString(),
        status: "Aguardando validação da Qualidade",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("ocorrencias")
        .update(payload)
        .eq("id", ocorrenciaId);

      if (error) {
        throw new Error(`Erro ao salvar resposta: ${error.message}`);
      }

      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao salvar resposta:", error);
      setErro(error?.message || "Erro ao salvar resposta da liderança.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function entrarEmTratativa(ocorrenciaId: string) {
    try {
      setSalvandoId(ocorrenciaId);
      setErro("");

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          status: "Em tratativa",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ocorrenciaId);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }

      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao iniciar tratativa:", error);
      setErro(error?.message || "Erro ao iniciar tratativa.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const resumo = useMemo(() => {
    const total = ocorrencias.length;
    const direcionadas = ocorrencias.filter(
      (item) => String(item.status || "").trim().toUpperCase() === "DIRECIONADA AO SETOR"
    ).length;
    const emTratativa = ocorrencias.filter(
      (item) => String(item.status || "").trim().toUpperCase() === "EM TRATATIVA"
    ).length;
    const aguardandoValidacao = ocorrencias.filter(
      (item) =>
        String(item.status || "").trim().toUpperCase() ===
        "AGUARDANDO VALIDAÇÃO DA QUALIDADE"
    ).length;

    return {
      total,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
    };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Área da Liderança</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Gestão da Qualidade
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Painel operacional da liderança para tratar ocorrências do próprio setor.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Líder: {perfil?.nome || "-"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Setor: {perfil?.setor || "-"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Perfil: {perfil?.role || "-"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sistema"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>

            <button
              onClick={carregarDados}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Atualizar
            </button>

            <button
              onClick={sair}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Sair
            </button>
          </div>
        </div>

        {erro ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total do setor</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.total}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Direcionadas</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.direcionadas}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Em tratativa</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.emTratativa}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Aguardando validação</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.aguardandoValidacao}
            </h2>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências do setor</h2>
            <p className="mt-1 text-sm text-slate-600">
              A liderança visualiza apenas as ocorrências do seu setor responsável e devolve a resposta para validação da Qualidade.
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Carregando painel da liderança...
              </div>
            ) : ocorrencias.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Nenhuma ocorrência encontrada para o setor da liderança.
              </div>
            ) : (
              <div className="space-y-5">
                {ocorrencias.map((ocorrencia) => {
                  const statusAtual = String(ocorrencia.status || "").trim().toUpperCase();
                  const podeIniciarTratativa =
                    statusAtual === "DIRECIONADA AO SETOR" ||
                    statusAtual === "ABERTA" ||
                    statusAtual === "EM ANÁLISE PELA QUALIDADE";

                  return (
                    <article
                      key={ocorrencia.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap gap-2">
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

                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              Tipo: {ocorrencia.tipo_ocorrencia || "-"}
                            </span>
                          </div>

                          <h3 className="text-xl font-semibold text-slate-900">
                            {ocorrencia.titulo || "Sem título"}
                          </h3>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {ocorrencia.descricao || "Sem descrição."}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Setor de origem
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {ocorrencia.setor_origem || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Setor responsável
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {ocorrencia.setor_responsavel || "-"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Criada em
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {formatarData(ocorrencia.created_at)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Última atualização
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {formatarData(ocorrencia.updated_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full lg:w-[380px]">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Resposta da liderança
                            </h4>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Registre aqui a tratativa realizada pelo setor. Ao salvar, a ocorrência volta para a Qualidade validar.
                            </p>

                            <textarea
                              value={respostas[ocorrencia.id] || ""}
                              onChange={(e) =>
                                setRespostas((prev) => ({
                                  ...prev,
                                  [ocorrencia.id]: e.target.value,
                                }))
                              }
                              placeholder="Descreva a ação realizada pela liderança..."
                              className="mt-4 min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white"
                            />

                            <div className="mt-4 flex flex-wrap gap-3">
                              {podeIniciarTratativa ? (
                                <button
                                  onClick={() => entrarEmTratativa(ocorrencia.id)}
                                  disabled={salvandoId === ocorrencia.id}
                                  className="inline-flex items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {salvandoId === ocorrencia.id
                                    ? "Processando..."
                                    : "Iniciar tratativa"}
                                </button>
                              ) : null}

                              <button
                                onClick={() => salvarResposta(ocorrencia.id)}
                                disabled={salvandoId === ocorrencia.id}
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {salvandoId === ocorrencia.id
                                  ? "Salvando..."
                                  : "Salvar e enviar para validação"}
                              </button>
                            </div>

                            {ocorrencia.data_resposta_lideranca ? (
                              <p className="mt-3 text-xs text-slate-500">
                                Última resposta registrada em{" "}
                                {formatarData(ocorrencia.data_resposta_lideranca)}.
                              </p>
                            ) : null}

                            {ocorrencia.observacao_qualidade ? (
                              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                  Observação da Qualidade
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">
                                  {ocorrencia.observacao_qualidade}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}