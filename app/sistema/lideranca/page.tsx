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
  tratativa_iniciada_em?: string | null;
  tratativa_finalizada_em?: string | null;
};

type Perfil = {
  id?: string;
  role?: string;
  setor?: string | null;
};

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

function formatarData(data?: string | null) {
  if (!data) return "-";
  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

export default function LiderancaPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  async function carregarPagina() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from("profiles")
      .select("id, role, setor")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfilData) {
      console.error(perfilError);
      setErro("Não foi possível carregar o perfil do usuário.");
      setCarregando(false);
      return;
    }

    setPerfil(perfilData as Perfil);

    const setorUsuario = (perfilData as Perfil).setor;

    if (!setorUsuario) {
      setErro("Seu perfil de liderança não possui setor definido.");
      setCarregando(false);
      return;
    }

    const { data: ocorrenciasData, error: ocorrenciasError } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("setor_destino", setorUsuario)
      .order("id", { ascending: false });

    if (ocorrenciasError) {
      console.error(ocorrenciasError);
      setErro("Não foi possível carregar as ocorrências do setor.");
      setCarregando(false);
      return;
    }

    setOcorrencias((ocorrenciasData as Ocorrencia[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarPagina();
  }, []);

  async function iniciarTratativa(id: number) {
    setSalvandoId(id);

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        tratativa_iniciada_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao iniciar tratativa.");
      setSalvandoId(null);
      return;
    }

    await carregarPagina();
    setSalvandoId(null);
  }

  async function enviarParaValidacao(id: number) {
    setSalvandoId(id);

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        tratativa_finalizada_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao enviar para validação.");
      setSalvandoId(null);
      return;
    }

    await carregarPagina();
    setSalvandoId(null);
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = `${item.titulo ?? ""} ${item.descricao ?? ""} ${item.setor_origem ?? ""}`
        .toLowerCase()
        .trim();

      const buscaOk = !busca || texto.includes(busca.toLowerCase());
      const statusOk = filtroStatus === "TODOS" || item.status === filtroStatus;

      return buscaOk && statusOk;
    });
  }, [ocorrencias, busca, filtroStatus]);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      direcionadas: ocorrencias.filter((o) => o.status === "DIRECIONADA").length,
      emTratativa: ocorrencias.filter((o) => o.status === "EM_TRATATIVA").length,
      aguardandoValidacao: ocorrencias.filter(
        (o) => o.status === "AGUARDANDO_VALIDACAO"
      ).length,
      concluidas: ocorrencias.filter((o) => o.status === "CONCLUIDA").length,
    };
  }, [ocorrencias]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                Gestão de Qualidade
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">
                Painel da Liderança
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Tratativa das ocorrências direcionadas ao setor.
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                Setor do perfil: {perfil?.setor || "-"}
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
                className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800"
              >
                Página inicial
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.total}
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
                Em tratativa
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {indicadores.emTratativa}
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
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <input
            type="text"
            placeholder="Buscar por título, descrição ou setor de origem..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-600"
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-600"
          >
            <option value="TODOS">Todos os status</option>
            <option value="DIRECIONADA">DIRECIONADA</option>
            <option value="EM_TRATATIVA">EM_TRATATIVA</option>
            <option value="AGUARDANDO_VALIDACAO">AGUARDANDO_VALIDACAO</option>
            <option value="CONCLUIDA">CONCLUIDA</option>
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
            Nenhuma ocorrência encontrada para o setor.
          </div>
        ) : (
          <div className="space-y-4">
            {ocorrenciasFiltradas.map((ocorrencia) => {
              const podeIniciarTratativa =
                ocorrencia.status === "DIRECIONADA";
              const podeEnviarValidacao =
                ocorrencia.status === "EM_TRATATIVA";

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

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">
                            Tratativa iniciada
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatarData(ocorrencia.tratativa_iniciada_em)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">
                            Enviado para validação
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatarData(ocorrencia.tratativa_finalizada_em)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-[320px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-800">
                          Ações da Liderança
                        </p>

                        <div className="mt-4 space-y-3">
                          {podeIniciarTratativa && (
                            <button
                              onClick={() => iniciarTratativa(ocorrencia.id)}
                              disabled={salvandoId === ocorrencia.id}
                              className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id
                                ? "Salvando..."
                                : "Iniciar tratativa"}
                            </button>
                          )}

                          {podeEnviarValidacao && (
                            <button
                              onClick={() => enviarParaValidacao(ocorrencia.id)}
                              disabled={salvandoId === ocorrencia.id}
                              className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id
                                ? "Salvando..."
                                : "Enviar para validação"}
                            </button>
                          )}

                          {!podeIniciarTratativa && !podeEnviarValidacao && (
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