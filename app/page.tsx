"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseMedical,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import LogoutButton from "../src/components/logout-button";

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
  data_limite?: string | null;
  concluido_em?: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

function formatarDataCurta(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function traduzirStatus(status?: string | null) {
  switch (status) {
    case "EM_ANALISE_QUALIDADE":
    case "Em análise pela Qualidade":
      return "Em análise pela Qualidade";
    case "DIRECIONADA":
    case "Direcionada para Liderança":
      return "Direcionada para Liderança";
    case "EM_TRATATIVA":
    case "Em tratativa pela Liderança":
      return "Em tratativa pela Liderança";
    case "AGUARDANDO_VALIDACAO":
    case "Aguardando validação da Qualidade":
      return "Aguardando validação da Qualidade";
    case "CONCLUIDA":
    case "Encerrada":
      return "Encerrada";
    default:
      return status || "Não definido";
  }
}

function statusClasses(status?: string | null) {
  const traduzido = traduzirStatus(status);

  switch (traduzido) {
    case "Em análise pela Qualidade":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Direcionada para Liderança":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "Em tratativa pela Liderança":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "Aguardando validação da Qualidade":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "Encerrada":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function gravidadeClasses(gravidade?: string | null) {
  const valor = gravidade?.toLowerCase() || "";

  if (
    valor.includes("alta") ||
    valor.includes("grave") ||
    valor.includes("crítica") ||
    valor.includes("critica")
  ) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (valor.includes("média") || valor.includes("media")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (valor.includes("baixa")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function calcularDiasEmAberto(dataCriacao?: string | null) {
  if (!dataCriacao) return 0;

  const inicio = new Date(dataCriacao).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - inicio) / (1000 * 60 * 60 * 24)));
}

function verificarSlaVencido(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return false;
  if (
    ocorrencia.status === "CONCLUIDA" ||
    ocorrencia.status === "Encerrada"
  ) {
    return false;
  }

  return new Date(ocorrencia.data_limite).getTime() < Date.now();
}

function calcularDiasAtraso(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return 0;
  if (!verificarSlaVencido(ocorrencia)) return 0;

  const limite = new Date(ocorrencia.data_limite).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - limite) / (1000 * 60 * 60 * 24)));
}

function ehStatus(status?: string | null, opcoes: string[] = []) {
  const atual = traduzirStatus(status);
  return opcoes.includes(atual);
}

export default function SistemaPage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: perfilData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (ativo && perfilData) {
            setPerfil(perfilData as Profile);
          }
        }

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
            data_limite,
            concluido_em
          `
          )
          .order("created_at", { ascending: false });

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

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emAnalise = ocorrencias.filter((o) =>
      ehStatus(o.status, ["Em análise pela Qualidade"])
    ).length;

    const direcionadas = ocorrencias.filter((o) =>
      ehStatus(o.status, ["Direcionada para Liderança"])
    ).length;

    const emTratativa = ocorrencias.filter((o) =>
      ehStatus(o.status, ["Em tratativa pela Liderança"])
    ).length;

    const aguardandoValidacao = ocorrencias.filter((o) =>
      ehStatus(o.status, ["Aguardando validação da Qualidade"])
    ).length;

    const concluidas = ocorrencias.filter((o) =>
      ehStatus(o.status, ["Encerrada"])
    ).length;

    const vencidas = ocorrencias.filter((o) => verificarSlaVencido(o)).length;

    const alta = ocorrencias.filter((o) => {
      const g = o.gravidade?.toLowerCase() || "";
      return (
        g.includes("alta") ||
        g.includes("grave") ||
        g.includes("crítica") ||
        g.includes("critica")
      );
    }).length;

    return {
      total,
      emAnalise,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
      concluidas,
      vencidas,
      alta,
    };
  }, [ocorrencias]);

  const recentes = useMemo(() => ocorrencias.slice(0, 6), [ocorrencias]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            Carregando painel do sistema...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex justify-end">
          <LogoutButton />
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                Gestão da Qualidade
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Painel executivo do sistema
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Acompanhe o volume de registros, o andamento do fluxo entre
                Qualidade e Liderança e os principais números do sistema.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Usuário atual
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {perfil?.nome || "Gestão da Qualidade"}
              </p>
              <p className="text-xs text-slate-600">
                {perfil?.email?.split("@")[0] || "painel institucional"}
                {perfil?.setor ? ` • ${perfil.setor}` : ""}
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
            titulo="Em análise"
            valor={indicadores.emAnalise}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Direcionadas"
            valor={indicadores.direcionadas}
            icon={<BriefcaseMedical className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Em tratativa"
            valor={indicadores.emTratativa}
            icon={<Clock3 className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardMini titulo="Encerradas" valor={indicadores.concluidas} />
          <CardMini
            titulo="Aguardando validação"
            valor={indicadores.aguardandoValidacao}
          />
          <CardMini
            titulo="Ocorrências de maior gravidade"
            valor={indicadores.alta}
          />
          <CardMini titulo="SLA vencido" valor={indicadores.vencidas} destaque />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Acessos rápidos
              </h2>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Navegue rapidamente para as áreas principais do sistema.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/sistema"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <p className="text-lg font-bold text-slate-900">
                  Painel do Sistema
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Visão geral das ocorrências, andamento do fluxo e indicadores.
                </p>
              </Link>

              <Link
                href="/sistema/qualidade"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <p className="text-lg font-bold text-slate-900">
                  Área da Qualidade
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Direcionamento, validação final, filtros e acompanhamento do
                  SLA.
                </p>
              </Link>

              <Link
                href="/sistema/lideranca"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <p className="text-lg font-bold text-slate-900">
                  Área da Liderança
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tratativas, 5W2H e devolução da ocorrência para a Qualidade.
                </p>
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <p className="text-lg font-bold text-slate-900">
                  Nova Ocorrência
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Registro público da ocorrência para entrada no fluxo.
                </p>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Resumo do fluxo
              </h2>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Modelo operacional que orienta o tratamento das ocorrências.
            </p>

            <div className="space-y-4">
              <ResumoFluxo
                numero="1"
                titulo="Registro público"
                texto="O colaborador abre a ocorrência sem login."
              />
              <ResumoFluxo
                numero="2"
                titulo="Triagem da Qualidade"
                texto="A Qualidade analisa e direciona a ocorrência."
              />
              <ResumoFluxo
                numero="3"
                titulo="Tratativa da Liderança"
                texto="A liderança executa as ações e registra a devolutiva."
              />
              <ResumoFluxo
                numero="4"
                titulo="Validação final"
                texto="A Qualidade valida a tratativa e encerra o caso."
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Ocorrências recentes
            </h2>
          </div>

          <div className="space-y-4">
            {recentes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  Nenhuma ocorrência encontrada até o momento.
                </p>
              </div>
            ) : (
              recentes.map((item) => (
                <Link
                  key={item.id}
                  href={`/ocorrencia/${item.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.titulo || "Ocorrência sem título"}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            item.status
                          )}`}
                        >
                          {traduzirStatus(item.status)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${gravidadeClasses(
                            item.gravidade
                          )}`}
                        >
                          {item.gravidade || "Sem gravidade"}
                        </span>

                        {verificarSlaVencido(item) && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            {calcularDiasAtraso(item)} dia(s) de atraso
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.descricao || "Sem descrição informada."}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Origem: {item.setor_origem || "Não informado"} •
                        Responsável:{" "}
                        {item.setor_responsavel || "Aguardando direcionamento"} •
                        Abertura: {formatarDataCurta(item.created_at)} •
                        {calcularDiasEmAberto(item.created_at)} dia(s) em aberto
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                </Link>
              ))
            )}
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
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <span className="text-3xl font-bold text-slate-900">{valor}</span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-900">{titulo}</p>
    </div>
  );
}

function CardMini({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-sm ${
          destaque ? "font-semibold text-red-700" : "text-slate-600"
        }`}
      >
        {titulo}
      </p>
      <p
        className={`mt-3 text-4xl font-bold ${
          destaque ? "text-red-700" : "text-slate-900"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function ResumoFluxo({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
        {numero}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">{titulo}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{texto}</p>
      </div>
    </div>
  );
}