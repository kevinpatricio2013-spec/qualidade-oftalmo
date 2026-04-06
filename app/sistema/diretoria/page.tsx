"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  ShieldCheck,
  Siren,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../../src/lib/supabase";

type Ocorrencia = {
  id: string;
  titulo: string;
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
  prazo_dias: number | null;
  data_limite: string | null;
  concluido_em: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

function traduzirStatus(status?: string | null) {
  switch (status) {
    case "EM_ANALISE_QUALIDADE":
      return "Em análise pela Qualidade";
    case "DIRECIONADA":
      return "Direcionada para Liderança";
    case "EM_TRATATIVA":
      return "Em tratativa pela Liderança";
    case "AGUARDANDO_VALIDACAO":
      return "Aguardando validação da Qualidade";
    case "CONCLUIDA":
      return "Encerrada";
    default:
      return status || "Não definido";
  }
}

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleString("pt-BR");
}

function formatarDataCurta(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function statusClasses(status?: string | null) {
  switch (status) {
    case "EM_ANALISE_QUALIDADE":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "DIRECIONADA":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "EM_TRATATIVA":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "AGUARDANDO_VALIDACAO":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CONCLUIDA":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function gravidadeClasses(gravidade?: string | null) {
  const valor = gravidade?.toLowerCase();

  if (
    valor?.includes("alta") ||
    valor?.includes("grave") ||
    valor?.includes("crítica") ||
    valor?.includes("critica")
  ) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (valor?.includes("média") || valor?.includes("media")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (valor?.includes("baixa")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function calcularDiasEmAberto(dataCriacao?: string | null) {
  if (!dataCriacao) return 0;

  const inicio = new Date(dataCriacao).getTime();
  const agora = Date.now();
  const diferenca = agora - inicio;

  return Math.max(0, Math.floor(diferenca / (1000 * 60 * 60 * 24)));
}

function verificarSlaVencido(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return false;
  if (ocorrencia.status === "CONCLUIDA") return false;

  return new Date(ocorrencia.data_limite).getTime() < Date.now();
}

function calcularDiasAtraso(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return 0;
  if (!verificarSlaVencido(ocorrencia)) return 0;

  const limite = new Date(ocorrencia.data_limite).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - limite) / (1000 * 60 * 60 * 24)));
}

export default function DiretoriaPage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarDados() {
    setLoading(true);
    setErro(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfilData) {
        setErro("Perfil não encontrado.");
        setLoading(false);
        return;
      }

      setPerfil(perfilData as Profile);

      const role = (perfilData.role || "").toUpperCase();
      if (role !== "DIRETORIA" && role !== "QUALIDADE") {
        setErro("Acesso permitido somente para Diretoria ou Qualidade.");
        setLoading(false);
        return;
      }

      const { data: ocorrenciasData, error: ocorrenciasError } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("created_at", { ascending: false });

      if (ocorrenciasError) {
        throw ocorrenciasError;
      }

      setOcorrencias((ocorrenciasData as Ocorrencia[]) || []);
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao carregar painel da diretoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emAnalise = ocorrencias.filter((o) => o.status === "EM_ANALISE_QUALIDADE").length;
    const direcionadas = ocorrencias.filter((o) => o.status === "DIRECIONADA").length;
    const emTratativa = ocorrencias.filter((o) => o.status === "EM_TRATATIVA").length;
    const aguardandoValidacao = ocorrencias.filter((o) => o.status === "AGUARDANDO_VALIDACAO").length;
    const concluidas = ocorrencias.filter((o) => o.status === "CONCLUIDA").length;
    const vencidas = ocorrencias.filter((o) => verificarSlaVencido(o)).length;

    const alta = ocorrencias.filter((o) => {
      const g = o.gravidade?.toLowerCase() || "";
      return g.includes("alta") || g.includes("grave") || g.includes("crítica") || g.includes("critica");
    }).length;

    const media = ocorrencias.filter((o) => {
      const g = o.gravidade?.toLowerCase() || "";
      return g.includes("média") || g.includes("media");
    }).length;

    const baixa = ocorrencias.filter((o) => {
      const g = o.gravidade?.toLowerCase() || "";
      return g.includes("baixa");
    }).length;

    const fluxoAtivo = total - concluidas;

    const ocorrenciasAbertas = ocorrencias.filter((o) => o.status !== "CONCLUIDA");
    const mediaDiasAbertos =
      ocorrenciasAbertas.length > 0
        ? Math.round(
            ocorrenciasAbertas.reduce((acc, item) => acc + calcularDiasEmAberto(item.created_at), 0) /
              ocorrenciasAbertas.length
          )
        : 0;

    return {
      total,
      emAnalise,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
      concluidas,
      vencidas,
      alta,
      media,
      baixa,
      fluxoAtivo,
      mediaDiasAbertos,
    };
  }, [ocorrencias]);

  const rankingSetores = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const item of ocorrencias) {
      const setor = item.setor_responsavel || item.setor_origem || "Não informado";
      mapa.set(setor, (mapa.get(setor) || 0) + 1);
    }

    return Array.from(mapa.entries())
      .map(([setor, total]) => ({ setor, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [ocorrencias]);

  const setoresCriticos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        total: number;
        vencidas: number;
        alta: number;
      }
    >();

    for (const item of ocorrencias) {
      const setor = item.setor_responsavel || item.setor_origem || "Não informado";
      const atual = mapa.get(setor) || { total: 0, vencidas: 0, alta: 0 };

      atual.total += 1;

      if (verificarSlaVencido(item)) {
        atual.vencidas += 1;
      }

      const gravidade = item.gravidade?.toLowerCase() || "";
      if (
        gravidade.includes("alta") ||
        gravidade.includes("grave") ||
        gravidade.includes("crítica") ||
        gravidade.includes("critica")
      ) {
        atual.alta += 1;
      }

      mapa.set(setor, atual);
    }

    return Array.from(mapa.entries())
      .map(([setor, dados]) => ({
        setor,
        total: dados.total,
        vencidas: dados.vencidas,
        alta: dados.alta,
        score: dados.vencidas * 3 + dados.alta * 2 + dados.total,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [ocorrencias]);

  const vencidas = useMemo(() => {
    return ocorrencias
      .filter((o) => verificarSlaVencido(o))
      .sort((a, b) => calcularDiasAtraso(b) - calcularDiasAtraso(a))
      .slice(0, 8);
  }, [ocorrencias]);

  const recentes = useMemo(() => {
    return ocorrencias.slice(0, 8);
  }, [ocorrencias]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">Carregando painel da Diretoria...</span>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">Erro ao carregar painel</h1>
          <p className="mt-2 text-sm text-slate-600">{erro}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                Gestão da Qualidade
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Painel executivo da Diretoria
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Visão consolidada das ocorrências, riscos operacionais, SLA, setores críticos e andamento geral do fluxo.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Perfil atual</p>
              <p className="text-sm font-semibold text-slate-900">
                {perfil?.nome || "Diretoria"}
              </p>
              <p className="text-xs text-slate-600">
                {perfil?.role || "Perfil"} {perfil?.setor ? `• ${perfil.setor}` : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardIndicador
            titulo="Total de ocorrências"
            valor={indicadores.total}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Fluxo ativo"
            valor={indicadores.fluxoAtivo}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Encerradas"
            valor={indicadores.concluidas}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="SLA vencido"
            valor={indicadores.vencidas}
            icon={<Siren className="h-5 w-5" />}
            destaque
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardMini titulo="Em análise" valor={indicadores.emAnalise} />
          <CardMini titulo="Direcionadas" valor={indicadores.direcionadas} />
          <CardMini titulo="Em tratativa" valor={indicadores.emTratativa} />
          <CardMini titulo="Aguardando validação" valor={indicadores.aguardandoValidacao} />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Distribuição por gravidade</h2>
            </div>

            <div className="space-y-3">
              <LinhaResumo titulo="Alta / Grave" valor={indicadores.alta} destaque="alto" />
              <LinhaResumo titulo="Média" valor={indicadores.media} destaque="medio" />
              <LinhaResumo titulo="Baixa" valor={indicadores.baixa} destaque="baixo" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Tempo médio</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Média de dias em aberto
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-900">
                {indicadores.mediaDiasAbertos}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Indicador calculado com base nas ocorrências ainda não encerradas.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Situação geral</h2>
            </div>

            <div className="space-y-3">
              <ResumoBox
                titulo="Dentro do SLA"
                descricao="Ocorrências ainda no prazo definido."
                valor={Math.max(0, indicadores.total - indicadores.vencidas)}
              />
              <ResumoBox
                titulo="Pontos críticos"
                descricao="Casos de maior severidade para atenção imediata."
                valor={indicadores.alta}
              />
              <ResumoBox
                titulo="Aguardando validação"
                descricao="Casos devolvidos pela liderança e aguardando encerramento."
                valor={indicadores.aguardandoValidacao}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Ranking de setores</h2>
            </div>

            <div className="space-y-3">
              {rankingSetores.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados de setores até o momento.</p>
              ) : (
                rankingSetores.map((item, index) => (
                  <div
                    key={`${item.setor}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.setor}</p>
                        <p className="text-xs text-slate-500">Total de ocorrências vinculadas</p>
                      </div>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-800">
                      {item.total}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-slate-900">Ocorrências vencidas</h2>
            </div>

            <div className="space-y-4">
              {vencidas.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma ocorrência vencida no momento.</p>
              ) : (
                vencidas.map((item) => (
                  <Link
                    key={item.id}
                    href={`/ocorrencia/${item.id}`}
                    className="block rounded-2xl border border-red-200 bg-red-50 p-4 transition hover:bg-red-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Setor: {item.setor_responsavel || item.setor_origem || "Não informado"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-red-700">
                          Atrasada há {calcularDiasAtraso(item)} dia(s)
                        </p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                        {traduzirStatus(item.status)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Setores mais críticos</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {setoresCriticos.length === 0 ? (
              <p className="text-sm text-slate-500">Sem criticidade suficiente para exibir ranking.</p>
            ) : (
              setoresCriticos.map((item) => (
                <div
                  key={item.setor}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">{item.setor}</h3>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Score {item.score}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniResumo label="Total" value={item.total} />
                    <MiniResumo label="Vencidas" value={item.vencidas} destaque />
                    <MiniResumo label="Alta" value={item.alta} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Ocorrências recentes</h2>
          </div>

          <div className="space-y-4">
            {recentes.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma ocorrência encontrada.</p>
            ) : (
              recentes.map((item) => (
                <Link
                  key={item.id}
                  href={`/ocorrencia/${item.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                          {traduzirStatus(item.status)}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gravidadeClasses(item.gravidade)}`}>
                          {item.gravidade || "Sem gravidade"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-sm font-semibold text-slate-900">
                        {item.titulo}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600">
                        Origem: {item.setor_origem || "Não informado"} • Responsável:{" "}
                        {item.setor_responsavel || "Aguardando direcionamento"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Aberta em {formatarDataCurta(item.created_at)} • {calcularDiasEmAberto(item.created_at)} dia(s) em aberto
                      </p>

                      {item.data_limite && (
                        <p className="mt-1 text-xs text-slate-500">
                          Data limite: {formatarDataCurta(item.data_limite)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {verificarSlaVencido(item) && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {calcularDiasAtraso(item)} dia(s) de atraso
                        </span>
                      )}

                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Leitura executiva</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ResumoNarrativo
              titulo="Cenário operacional"
              texto={`Atualmente existem ${indicadores.fluxoAtivo} ocorrência(s) em andamento no fluxo, com ${indicadores.vencidas} caso(s) fora do prazo e ${indicadores.alta} ocorrência(s) de alta gravidade.`}
            />
            <ResumoNarrativo
              titulo="Ponto de atenção"
              texto={`Os setores com maior concentração ou criticidade devem ser observados prioritariamente, principalmente quando combinam volume alto, SLA vencido e gravidade elevada.`}
            />
            <ResumoNarrativo
              titulo="Leitura de desempenho"
              texto={`O sistema registra ${indicadores.concluidas} ocorrência(s) encerradas e uma média de ${indicadores.mediaDiasAbertos} dia(s) nas ocorrências ainda abertas.`}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function CardIndicador({
  titulo,
  valor,
  icon,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            destaque ? "bg-white text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {icon}
        </div>

        <span className={`text-3xl font-bold ${destaque ? "text-red-700" : "text-slate-900"}`}>
          {valor}
        </span>
      </div>

      <p className={`mt-4 text-sm font-semibold ${destaque ? "text-red-700" : "text-slate-900"}`}>
        {titulo}
      </p>
    </div>
  );
}

function CardMini({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}

function LinhaResumo({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number;
  destaque?: "alto" | "medio" | "baixo";
}) {
  const classes =
    destaque === "alto"
      ? "border-red-200 bg-red-50 text-red-700"
      : destaque === "medio"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : destaque === "baixo"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${classes}`}>
      <span className="text-sm font-medium">{titulo}</span>
      <span className="rounded-full border border-white/60 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
        {valor}
      </span>
    </div>
  );
}

function ResumoBox({
  titulo,
  descricao,
  valor,
}: {
  titulo: string;
  descricao: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900">
          {valor}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{descricao}</p>
    </div>
  );
}

function MiniResumo({
  label,
  value,
  destaque = false,
}: {
  label: string;
  value: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${destaque ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${destaque ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function ResumoNarrativo({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p>
    </div>
  );
}