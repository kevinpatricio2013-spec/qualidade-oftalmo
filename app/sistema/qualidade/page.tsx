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
  data_validacao_qualidade: string | null;
  observacao_qualidade: string | null;
  encaminhado_por_qualidade: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const SETORES = [
  "Agendamento",
  "Autorização",
  "Centro Cirúrgico",
  "CME",
  "Comissões Hospitalares",
  "Compras",
  "Consultório Médico",
  "Contas Médicas",
  "Controlador de Acesso",
  "Diretoria",
  "Facilities",
  "Farmácia/OPME",
  "Faturamento",
  "Financeiro",
  "Fornecedores Externos",
  "Gestão da Informação",
  "Gestão de Pessoas",
  "Higiene",
  "Qualidade",
  "Recepção",
  "Engenharia Clínica",
  "Pronto Atendimento",
];

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
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "EM_ANALISE_QUALIDADE") return "Em análise pela Qualidade";
  if (valor === "DIRECIONADA") return "Direcionada para Liderança";
  if (valor === "EM_TRATATIVA") return "Em tratativa pela Liderança";
  if (valor === "AGUARDANDO_VALIDACAO") return "Aguardando validação da Qualidade";
  if (valor === "ENCERRADA" || valor === "CONCLUIDA") return "Encerrada";

  return status || "Sem status";
}

function getStatusClass(status: string | null | undefined) {
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "EM_ANALISE_QUALIDADE") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (valor === "DIRECIONADA") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }

  if (valor === "EM_TRATATIVA") {
    return "bg-purple-50 text-purple-700 border border-purple-200";
  }

  if (valor === "AGUARDANDO_VALIDACAO") {
    return "bg-orange-50 text-orange-700 border border-orange-200";
  }

  if (valor === "ENCERRADA" || valor === "CONCLUIDA") {
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

export default function QualidadePage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  async function carregarOcorrencias() {
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

      if (roleNormalizado !== "QUALIDADE") {
        throw new Error("Este usuário não possui perfil de Qualidade.");
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
            data_validacao_qualidade,
            observacao_qualidade,
            encaminhado_por_qualidade,
            created_at,
            updated_at
          `
        )
        .order("created_at", { ascending: false });

      if (ocorrenciasError) {
        throw new Error(`Erro ao buscar ocorrências: ${ocorrenciasError.message}`);
      }

      const lista = (ocorrenciasData || []) as Ocorrencia[];
      setOcorrencias(lista);

      const setoresIniciais: Record<string, string> = {};
      const observacoesIniciais: Record<string, string> = {};

      for (const item of lista) {
        setoresIniciais[item.id] = item.setor_responsavel || "";
        observacoesIniciais[item.id] = item.observacao_qualidade || "";
      }

      setSetorSelecionado(setoresIniciais);
      setObservacoes(observacoesIniciais);
    } catch (error: any) {
      console.error("Erro em carregarOcorrencias:", error);
      setErro(error?.message || "Erro ao carregar painel da Qualidade.");
      setOcorrencias([]);
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  async function direcionarOcorrencia(id: string, setor: string) {
    try {
      setSalvandoId(id);
      setErro("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      if (!setor) {
        throw new Error("Selecione o setor responsável.");
      }

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          setor_responsavel: setor,
          status: "DIRECIONADA",
          encaminhado_por_qualidade: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao direcionar ocorrência: ${error.message}`);
      }

      await carregarOcorrencias();
    } catch (error: any) {
      console.error("Erro ao direcionar ocorrência:", error);
      setErro(error?.message || "Erro ao direcionar ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function validarOcorrencia(id: string, aprovar: boolean) {
    try {
      setSalvandoId(id);
      setErro("");

      const observacao = String(observacoes[id] || "").trim();

      const payload = aprovar
        ? {
            validado_qualidade: true,
            data_validacao_qualidade: new Date().toISOString(),
            observacao_qualidade: observacao || null,
            status: "ENCERRADA",
            updated_at: new Date().toISOString(),
          }
        : {
            validado_qualidade: false,
            data_validacao_qualidade: null,
            observacao_qualidade:
              observacao || "Necessário complementar a tratativa antes do encerramento.",
            status: "DIRECIONADA",
            updated_at: new Date().toISOString(),
          };

      const { error } = await supabase
        .from("ocorrencias")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao validar ocorrência: ${error.message}`);
      }

      await carregarOcorrencias();
    } catch (error: any) {
      console.error("Erro ao validar ocorrência:", error);
      setErro(error?.message || "Erro ao validar ocorrência.");
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
    const semDirecionamento = ocorrencias.filter(
      (item) => !item.setor_responsavel
    ).length;
    const direcionadas = ocorrencias.filter(
      (item) => String(item.status || "").toUpperCase() === "DIRECIONADA"
    ).length;
    const aguardandoValidacao = ocorrencias.filter(
      (item) => String(item.status || "").toUpperCase() === "AGUARDANDO_VALIDACAO"
    ).length;
    const encerradas = ocorrencias.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "ENCERRADA" || status === "CONCLUIDA";
    }).length;

    return {
      total,
      semDirecionamento,
      direcionadas,
      aguardandoValidacao,
      encerradas,
    };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Área da Qualidade</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">
              Gestão da Qualidade
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Painel da Qualidade para direcionamento, acompanhamento e validação final das ocorrências.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Usuário: {perfil?.nome || "-"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Perfil: {perfil?.role || "-"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                E-mail: {perfil?.email || "-"}
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
              onClick={carregarOcorrencias}
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

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.total}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sem direcionamento</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.semDirecionamento}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Direcionadas</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.direcionadas}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Aguardando validação</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.aguardandoValidacao}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Encerradas</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : resumo.encerradas}
            </h2>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências</h2>
            <p className="mt-1 text-sm text-slate-600">
              A Qualidade visualiza todas as ocorrências, direciona para o setor responsável e faz a validação final após a tratativa da liderança.
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Carregando painel da Qualidade...
              </div>
            ) : ocorrencias.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Nenhuma ocorrência encontrada.
              </div>
            ) : (
              <div className="space-y-5">
                {ocorrencias.map((ocorrencia) => {
                  const statusAtual = String(ocorrencia.status || "").toUpperCase();
                  const aguardandoValidacao = statusAtual === "AGUARDANDO_VALIDACAO";
                  const encerrada =
                    statusAtual === "ENCERRADA" || statusAtual === "CONCLUIDA";

                  return (
                    <article
                      key={ocorrencia.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
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
                                {ocorrencia.setor_responsavel || "Não direcionado"}
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

                          {ocorrencia.resposta_lideranca ? (
                            <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                                Resposta da liderança
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-purple-800">
                                {ocorrencia.resposta_lideranca}
                              </p>
                              <p className="mt-2 text-xs text-purple-700">
                                Respondido em: {formatarData(ocorrencia.data_resposta_lideranca)}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div className="w-full xl:w-[380px]">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Ações da Qualidade
                            </h4>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Direcione a ocorrência para o setor responsável e faça a validação final quando a liderança devolver a tratativa.
                            </p>

                            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
                              Setor responsável
                            </label>

                            <select
                              value={setorSelecionado[ocorrencia.id] || ""}
                              onChange={(e) =>
                                setSetorSelecionado((prev) => ({
                                  ...prev,
                                  [ocorrencia.id]: e.target.value,
                                }))
                              }
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white"
                            >
                              <option value="">Selecionar setor</option>
                              {SETORES.map((setor) => (
                                <option key={setor} value={setor}>
                                  {setor}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() =>
                                direcionarOcorrencia(
                                  ocorrencia.id,
                                  setorSelecionado[ocorrencia.id] || ""
                                )
                              }
                              disabled={salvandoId === ocorrencia.id || encerrada}
                              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id
                                ? "Processando..."
                                : "Direcionar ocorrência"}
                            </button>

                            <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                              Observação da Qualidade
                            </label>

                            <textarea
                              value={observacoes[ocorrencia.id] || ""}
                              onChange={(e) =>
                                setObservacoes((prev) => ({
                                  ...prev,
                                  [ocorrencia.id]: e.target.value,
                                }))
                              }
                              placeholder="Observações para validação ou devolutiva..."
                              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white"
                            />

                            {aguardandoValidacao ? (
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  onClick={() => validarOcorrencia(ocorrencia.id, true)}
                                  disabled={salvandoId === ocorrencia.id}
                                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {salvandoId === ocorrencia.id
                                    ? "Salvando..."
                                    : "Validar e encerrar"}
                                </button>

                                <button
                                  onClick={() => validarOcorrencia(ocorrencia.id, false)}
                                  disabled={salvandoId === ocorrencia.id}
                                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {salvandoId === ocorrencia.id
                                    ? "Salvando..."
                                    : "Devolver para ajuste"}
                                </button>
                              </div>
                            ) : null}

                            {ocorrencia.data_validacao_qualidade ? (
                              <p className="mt-3 text-xs text-slate-500">
                                Validação registrada em{" "}
                                {formatarData(ocorrencia.data_validacao_qualidade)}.
                              </p>
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