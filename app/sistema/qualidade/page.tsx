"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_destino: string | null;
  gravidade: string | null;
  status: string | null;
  criado_em?: string | null;
  analisado_qualidade_em?: string | null;
  direcionado_em?: string | null;
  tratativa_iniciada_em?: string | null;
  tratativa_finalizada_em?: string | null;
  validado_qualidade_em?: string | null;
  concluido_em?: string | null;
};

const SETORES = [
  "AGENDAMENTO",
  "AUTORIZACAO",
  "CENTRO CIRURGICO",
  "CME",
  "COMISSOES HOSPITALARES",
  "COMPRAS",
  "CONSULTORIO MEDICO",
  "CONTAS MEDICAS",
  "CONTROLADOR DE ACESSO",
  "DIRETORIA",
  "FACILITIES",
  "FARMACIA/OPME",
  "FATURAMENTO",
  "FINANCEIRO",
  "FORNECEDORES EXTERNOS",
  "GESTAO DA INFORMACAO",
  "GESTAO DE PESSOAS",
  "HIGIENE",
  "QUALIDADE",
  "RECEPCAO",
  "ENGENHARIA CLINICA",
  "PRONTO ATENDIMENTO",
];

function formatarData(data?: string | null) {
  if (!data) return "-";
  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function corStatus(status?: string | null) {
  switch (status) {
    case "ABERTA":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "EM_ANALISE_QUALIDADE":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "DIRECIONADA":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "EM_TRATATIVA":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "AGUARDANDO_VALIDACAO":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "CONCLUIDA":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function QualidadePage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [direcionamentos, setDirecionamentos] = useState<Record<number, string>>(
    {}
  );

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ocorrências:", error);
      setErro(error.message || "Não foi possível carregar as ocorrências.");
      setCarregando(false);
      return;
    }

    setOcorrencias((data as Ocorrencia[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  async function iniciarAnalise(id: number) {
    setSalvandoId(id);

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        analisado_qualidade_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao iniciar análise.");
      setSalvandoId(null);
      return;
    }

    await carregarOcorrencias();
    setSalvandoId(null);
  }

  async function direcionarOcorrencia(id: number) {
    const setorDestino = direcionamentos[id];

    if (!setorDestino) {
      alert("Selecione o setor de destino.");
      return;
    }

    setSalvandoId(id);

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        setor_destino: setorDestino,
        direcionado_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao direcionar ocorrência.");
      setSalvandoId(null);
      return;
    }

    await carregarOcorrencias();
    setSalvandoId(null);
  }

  async function concluirOcorrencia(id: number) {
    const agora = new Date().toISOString();

    setSalvandoId(id);

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        validado_qualidade_em: agora,
        concluido_em: agora,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao concluir ocorrência.");
      setSalvandoId(null);
      return;
    }

    await carregarOcorrencias();
    setSalvandoId(null);
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = `${item.titulo ?? ""} ${item.descricao ?? ""} ${item.setor_origem ?? ""} ${item.setor_destino ?? ""}`
        .toLowerCase()
        .trim();

      const buscaOk = !busca || texto.includes(busca.toLowerCase());
      const statusOk = filtroStatus === "TODOS" || item.status === filtroStatus;
      const setorOk =
        filtroSetor === "TODOS" || item.setor_destino === filtroSetor;

      return buscaOk && statusOk && setorOk;
    });
  }, [ocorrencias, busca, filtroStatus, filtroSetor]);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "ABERTA").length,
      emAnalise: ocorrencias.filter(
        (o) => o.status === "EM_ANALISE_QUALIDADE"
      ).length,
      direcionadas: ocorrencias.filter((o) => o.status === "DIRECIONADA").length,
      aguardandoValidacao: ocorrencias.filter(
        (o) => o.status === "AGUARDANDO_VALIDACAO"
      ).length,
      concluidas: ocorrencias.filter((o) => o.status === "CONCLUIDA").length,
    };
  }, [ocorrencias]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                Gestão de Qualidade
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">
                Painel da Qualidade
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Triagem, direcionamento, validação e encerramento das ocorrências.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/sistema"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Voltar ao sistema
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Página inicial
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.total}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Abertas</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.abertas}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Em análise
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.emAnalise}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Direcionadas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.direcionadas}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Aguardando validação
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.aguardandoValidacao}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Concluídas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.concluidas}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="text"
            placeholder="Buscar por título, descrição ou setor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600"
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ABERTA">ABERTA</option>
            <option value="EM_ANALISE_QUALIDADE">EM_ANALISE_QUALIDADE</option>
            <option value="DIRECIONADA">DIRECIONADA</option>
            <option value="EM_TRATATIVA">EM_TRATATIVA</option>
            <option value="AGUARDANDO_VALIDACAO">AGUARDANDO_VALIDACAO</option>
            <option value="CONCLUIDA">CONCLUIDA</option>
          </select>

          <select
            value={filtroSetor}
            onChange={(e) => setFiltroSetor(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600"
          >
            <option value="TODOS">Todos os setores destino</option>
            {SETORES.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>
        </div>

        {carregando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Carregando ocorrências...
          </div>
        ) : erro ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {erro}
          </div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Nenhuma ocorrência encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {ocorrenciasFiltradas.map((ocorrencia) => {
              const podeIniciarAnalise = ocorrencia.status === "ABERTA";
              const podeDirecionar =
                ocorrencia.status === "ABERTA" ||
                ocorrencia.status === "EM_ANALISE_QUALIDADE";
              const podeConcluir =
                ocorrencia.status === "AGUARDANDO_VALIDACAO";

              return (
                <div
                  key={ocorrencia.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          ID #{ocorrencia.id}
                        </span>
                        <span
                          className={`rounded-xl border px-3 py-1 text-xs font-semibold ${corStatus(
                            ocorrencia.status
                          )}`}
                        >
                          {ocorrencia.status || "-"}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-800">
                        {ocorrencia.titulo}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {ocorrencia.descricao || "Sem descrição informada."}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase text-slate-500">
                            Tipo
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {ocorrencia.tipo_ocorrencia || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase text-slate-500">
                            Setor origem
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {ocorrencia.setor_origem || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase text-slate-500">
                            Setor destino
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {ocorrencia.setor_destino || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase text-slate-500">
                            Gravidade
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {ocorrencia.gravidade || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">
                            Análise da qualidade
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatarData(ocorrencia.analisado_qualidade_em)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">
                            Direcionamento
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatarData(ocorrencia.direcionado_em)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">
                            Validação da qualidade
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatarData(ocorrencia.validado_qualidade_em)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-[330px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-800">
                          Ações da Qualidade
                        </p>

                        <div className="mt-4 space-y-3">
                          {podeIniciarAnalise && (
                            <button
                              onClick={() => iniciarAnalise(ocorrencia.id)}
                              disabled={salvandoId === ocorrencia.id}
                              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id
                                ? "Salvando..."
                                : "Iniciar análise"}
                            </button>
                          )}

                          {podeDirecionar && (
                            <div className="space-y-2">
                              <select
                                value={direcionamentos[ocorrencia.id] || ""}
                                onChange={(e) =>
                                  setDirecionamentos((prev) => ({
                                    ...prev,
                                    [ocorrencia.id]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600"
                              >
                                <option value="">Selecionar setor destino</option>
                                {SETORES.filter(
                                  (setor) => setor !== "QUALIDADE"
                                ).map((setor) => (
                                  <option key={setor} value={setor}>
                                    {setor}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => direcionarOcorrencia(ocorrencia.id)}
                                disabled={salvandoId === ocorrencia.id}
                                className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {salvandoId === ocorrencia.id
                                  ? "Salvando..."
                                  : "Direcionar ao setor"}
                              </button>
                            </div>
                          )}

                          {podeConcluir && (
                            <button
                              onClick={() => concluirOcorrencia(ocorrencia.id)}
                              disabled={salvandoId === ocorrencia.id}
                              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id
                                ? "Salvando..."
                                : "Concluir ocorrência"}
                            </button>
                          )}

                          {!podeIniciarAnalise &&
                            !podeDirecionar &&
                            !podeConcluir && (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                                Nenhuma ação disponível para a etapa atual.
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}