"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  ShieldCheck,
  Target,
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

type Plano5W2H = {
  id: string;
  ocorrencia_id: string;
  what: string | null;
  why: string | null;
  where: string | null;
  when: string | null;
  who: string | null;
  how: string | null;
  how_much: string | null;
  created_at: string | null;
  updated_at: string | null;
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

export default function LiderancaPage() {
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [planos, setPlanos] = useState<Record<string, Plano5W2H | null>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [tratativas, setTratativas] = useState<Record<string, string>>({});
  const [planosForm, setPlanosForm] = useState<
    Record<
      string,
      {
        what: string;
        why: string;
        where: string;
        when: string;
        who: string;
        how: string;
        how_much: string;
      }
    >
  >({});

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
      if (role !== "LIDERANCA" && role !== "LIDER" && role !== "LIDERANÇA") {
        setErro("Acesso permitido somente para Liderança.");
        setLoading(false);
        return;
      }

      if (!perfilData.setor) {
        setErro("O perfil da liderança está sem setor vinculado.");
        setLoading(false);
        return;
      }

      const { data: ocorrenciasData, error: ocorrenciasError } = await supabase
        .from("ocorrencias")
        .select("*")
        .eq("setor_responsavel", perfilData.setor)
        .in("status", ["DIRECIONADA", "EM_TRATATIVA", "AGUARDANDO_VALIDACAO"])
        .order("created_at", { ascending: false });

      if (ocorrenciasError) {
        throw ocorrenciasError;
      }

      const lista = (ocorrenciasData as Ocorrencia[]) || [];
      setOcorrencias(lista);

      const respostasIniciais: Record<string, string> = {};
      const tratativasIniciais: Record<string, string> = {};

      lista.forEach((item) => {
        respostasIniciais[item.id] = item.resposta_lideranca || "";
        tratativasIniciais[item.id] = "";
      });

      setRespostas(respostasIniciais);
      setTratativas(tratativasIniciais);

      if (lista.length > 0) {
        const ids = lista.map((item) => item.id);

        const { data: planosData, error: planosError } = await supabase
          .from("plano_acao_5w2h")
          .select("*")
          .in("ocorrencia_id", ids);

        if (planosError) {
          throw planosError;
        }

        const mapaPlanos: Record<string, Plano5W2H | null> = {};
        const mapaForms: Record<
          string,
          {
            what: string;
            why: string;
            where: string;
            when: string;
            who: string;
            how: string;
            how_much: string;
          }
        > = {};

        ids.forEach((id) => {
          mapaPlanos[id] = null;
          mapaForms[id] = {
            what: "",
            why: "",
            where: "",
            when: "",
            who: "",
            how: "",
            how_much: "",
          };
        });

        (planosData || []).forEach((plano) => {
          mapaPlanos[plano.ocorrencia_id] = plano as Plano5W2H;
          mapaForms[plano.ocorrencia_id] = {
            what: plano.what || "",
            why: plano.why || "",
            where: plano.where || "",
            when: plano.when ? String(plano.when).slice(0, 10) : "",
            who: plano.who || "",
            how: plano.how || "",
            how_much: plano.how_much || "",
          };
        });

        setPlanos(mapaPlanos);
        setPlanosForm(mapaForms);
      } else {
        setPlanos({});
        setPlanosForm({});
      }
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao carregar painel da liderança.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const direcionadas = ocorrencias.filter((o) => o.status === "DIRECIONADA").length;
    const emTratativa = ocorrencias.filter((o) => o.status === "EM_TRATATIVA").length;
    const aguardandoValidacao = ocorrencias.filter((o) => o.status === "AGUARDANDO_VALIDACAO").length;
    const vencidas = ocorrencias.filter((o) => verificarSlaVencido(o)).length;

    return {
      total,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
      vencidas,
    };
  }, [ocorrencias]);

  async function salvarTratativa(ocorrencia: Ocorrencia) {
    const texto = tratativas[ocorrencia.id]?.trim();

    if (!texto) {
      setErro("Descreva a tratativa antes de salvar.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvandoId(ocorrencia.id);

    try {
      const { error: tratativaError } = await supabase
        .from("tratativas_ocorrencia")
        .insert({
          ocorrencia_id: ocorrencia.id,
          descricao: texto,
          responsavel: perfil?.nome || perfil?.setor || "Liderança",
          perfil: "LIDERANCA",
        });

      if (tratativaError) throw tratativaError;

      if (ocorrencia.status === "DIRECIONADA") {
        const { error: statusError } = await supabase
          .from("ocorrencias")
          .update({
            status: "EM_TRATATIVA",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ocorrencia.id);

        if (statusError) throw statusError;
      }

      setSucesso("Tratativa registrada com sucesso.");
      setTratativas((prev) => ({ ...prev, [ocorrencia.id]: "" }));
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao salvar tratativa.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function salvarPlano5W2H(ocorrencia: Ocorrencia) {
    const plano = planosForm[ocorrencia.id];

    if (!plano) {
      setErro("Plano 5W2H não encontrado.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvandoId(ocorrencia.id);

    try {
      const existente = planos[ocorrencia.id];

      if (existente?.id) {
        const { error } = await supabase
          .from("plano_acao_5w2h")
          .update({
            what: plano.what || null,
            why: plano.why || null,
            where: plano.where || null,
            when: plano.when || null,
            who: plano.who || null,
            how: plano.how || null,
            how_much: plano.how_much || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existente.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plano_acao_5w2h")
          .insert({
            ocorrencia_id: ocorrencia.id,
            what: plano.what || null,
            why: plano.why || null,
            where: plano.where || null,
            when: plano.when || null,
            who: plano.who || null,
            how: plano.how || null,
            how_much: plano.how_much || null,
          });

        if (error) throw error;
      }

      if (ocorrencia.status === "DIRECIONADA") {
        const { error: statusError } = await supabase
          .from("ocorrencias")
          .update({
            status: "EM_TRATATIVA",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ocorrencia.id);

        if (statusError) throw statusError;
      }

      setSucesso("Plano 5W2H salvo com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao salvar plano 5W2H.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function devolverParaQualidade(ocorrencia: Ocorrencia) {
    const resposta = respostas[ocorrencia.id]?.trim();

    if (!resposta) {
      setErro("Preencha a resposta da liderança antes de devolver para a Qualidade.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvandoId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          resposta_lideranca: resposta,
          data_resposta_lideranca: new Date().toISOString(),
          status: "AGUARDANDO_VALIDACAO",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ocorrencia.id);

      if (error) throw error;

      setSucesso("Ocorrência devolvida para validação da Qualidade.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao devolver ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">Carregando painel da Liderança...</span>
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
                Painel da Liderança
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Tratativa das ocorrências do seu setor, com SLA visível, registro de ações e devolução para validação da Qualidade.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Perfil atual</p>
              <p className="text-sm font-semibold text-slate-900">
                {perfil?.nome || "Liderança"}
              </p>
              <p className="text-xs text-slate-600">
                {perfil?.role || "Perfil"} {perfil?.setor ? `• ${perfil.setor}` : ""}
              </p>
            </div>
          </div>
        </section>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardIndicador
            titulo="Total no setor"
            valor={indicadores.total}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Direcionadas"
            valor={indicadores.direcionadas}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Em tratativa"
            valor={indicadores.emTratativa}
            icon={<Clock3 className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="SLA vencido"
            valor={indicadores.vencidas}
            icon={<AlertTriangle className="h-5 w-5" />}
            destaque
          />
        </section>

        <section className="space-y-4">
          {ocorrencias.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Não existem ocorrências vinculadas ao seu setor neste momento.
              </p>
            </div>
          ) : (
            ocorrencias.map((ocorrencia) => {
              const slaVencido = verificarSlaVencido(ocorrencia);
              const planoAtual = planosForm[ocorrencia.id] || {
                what: "",
                why: "",
                where: "",
                when: "",
                who: "",
                how: "",
                how_much: "",
              };

              return (
                <div
                  key={ocorrencia.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(ocorrencia.status)}`}>
                            {traduzirStatus(ocorrencia.status)}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gravidadeClasses(ocorrencia.gravidade)}`}>
                            {ocorrencia.gravidade || "Sem gravidade"}
                          </span>

                          {slaVencido && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              SLA vencido
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-900">
                          {ocorrencia.titulo}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {ocorrencia.descricao || "Sem descrição informada."}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <InfoBox label="Tipo" value={ocorrencia.tipo_ocorrencia || "Não informado"} />
                          <InfoBox label="Setor de origem" value={ocorrencia.setor_origem || "Não informado"} />
                          <InfoBox label="Setor responsável" value={ocorrencia.setor_responsavel || "Não informado"} />
                          <InfoBox label="Dias em aberto" value={`${calcularDiasEmAberto(ocorrencia.created_at)} dia(s)`} />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <InfoBox label="Data de abertura" value={formatarDataCurta(ocorrencia.created_at)} />
                          <InfoBox
                            label="Prazo"
                            value={ocorrencia.prazo_dias ? `${ocorrencia.prazo_dias} dia(s)` : "Não definido"}
                          />
                          <InfoBox label="Data limite" value={formatarDataCurta(ocorrencia.data_limite)} />
                          <InfoBox
                            label="Atraso"
                            value={slaVencido ? `${calcularDiasAtraso(ocorrencia)} dia(s)` : "Dentro do prazo"}
                            destaque={slaVencido}
                          />
                        </div>
                      </div>

                      <div className="w-full xl:max-w-sm">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Fluxo atual
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            A liderança registra as ações realizadas e devolve a ocorrência para validação final da Qualidade.
                          </p>

                          <Link
                            href={`/ocorrencia/${ocorrencia.id}`}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Ver detalhe completo
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-emerald-600" />
                          <h2 className="text-base font-semibold text-slate-900">Tratativa da Liderança</h2>
                        </div>

                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Registrar tratativa
                        </label>
                        <textarea
                          rows={5}
                          value={tratativas[ocorrencia.id] || ""}
                          onChange={(e) =>
                            setTratativas((prev) => ({
                              ...prev,
                              [ocorrencia.id]: e.target.value,
                            }))
                          }
                          placeholder="Descreva as ações executadas pelo setor..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />

                        <button
                          onClick={() => salvarTratativa(ocorrencia)}
                          disabled={salvandoId === ocorrencia.id}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {salvandoId === ocorrencia.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              Salvar tratativa
                              <CheckCircle2 className="h-4 w-4" />
                            </>
                          )}
                        </button>

                        {ocorrencia.resposta_lideranca && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Última resposta registrada
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {ocorrencia.resposta_lideranca}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {formatarData(ocorrencia.data_resposta_lideranca)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5 text-emerald-600" />
                          <h2 className="text-base font-semibold text-slate-900">Plano de ação 5W2H</h2>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <CampoPlano
                            label="What / O que"
                            value={planoAtual.what}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  what: value,
                                },
                              }))
                            }
                          />

                          <CampoPlano
                            label="Why / Por que"
                            value={planoAtual.why}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  why: value,
                                },
                              }))
                            }
                          />

                          <CampoPlano
                            label="Where / Onde"
                            value={planoAtual.where}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  where: value,
                                },
                              }))
                            }
                          />

                          <CampoPlano
                            label="When / Quando"
                            type="date"
                            value={planoAtual.when}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  when: value,
                                },
                              }))
                            }
                          />

                          <CampoPlano
                            label="Who / Quem"
                            value={planoAtual.who}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  who: value,
                                },
                              }))
                            }
                          />

                          <CampoPlano
                            label="How much / Quanto custa"
                            value={planoAtual.how_much}
                            onChange={(value) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  how_much: value,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="mt-3">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            How / Como
                          </label>
                          <textarea
                            rows={4}
                            value={planoAtual.how}
                            onChange={(e) =>
                              setPlanosForm((prev) => ({
                                ...prev,
                                [ocorrencia.id]: {
                                  ...prev[ocorrencia.id],
                                  how: e.target.value,
                                },
                              }))
                            }
                            placeholder="Descreva como a ação será executada..."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                          />
                        </div>

                        <button
                          onClick={() => salvarPlano5W2H(ocorrencia)}
                          disabled={salvandoId === ocorrencia.id}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {salvandoId === ocorrencia.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Salvando plano...
                            </>
                          ) : (
                            <>
                              Salvar 5W2H
                              <Target className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-semibold text-slate-900">Devolver para a Qualidade</h2>
                      </div>

                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Resposta final da liderança
                      </label>
                      <textarea
                        rows={5}
                        value={respostas[ocorrencia.id] || ""}
                        onChange={(e) =>
                          setRespostas((prev) => ({
                            ...prev,
                            [ocorrencia.id]: e.target.value,
                          }))
                        }
                        placeholder="Descreva o que foi feito pelo setor e o resultado alcançado..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />

                      <button
                        onClick={() => devolverParaQualidade(ocorrencia)}
                        disabled={salvandoId === ocorrencia.id}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {salvandoId === ocorrencia.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Devolver para validação da Qualidade
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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

function InfoBox({
  label,
  value,
  destaque = false,
}: {
  label: string;
  value: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${destaque ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-sm font-medium ${destaque ? "text-red-700" : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}

function CampoPlano({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
      />
    </div>
  );
}