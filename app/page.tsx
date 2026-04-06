"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import type { Ocorrencia } from "../src/types/ocorrencia";
import {
  calcularDiasAtraso,
  calcularDiasEmAberto,
  formatarDataCurta,
  gravidadeClasses,
  statusClasses,
  traduzirStatus,
  verificarSlaVencido,
} from "../src/lib/qualidade";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

export default function SistemaPage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
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

        if (perfilError) {
          setErro("Perfil não encontrado.");
          setLoading(false);
          return;
        }

        setPerfil(perfilData);

        let query = supabase
          .from("ocorrencias")
          .select("*")
          .order("created_at", { ascending: false });

        const role = perfilData.role?.toUpperCase();
        const setor = perfilData.setor;

        if (role === "LIDERANCA" && setor) {
          query = query.eq("setor_responsavel", setor);
        }

        const { data: ocorrenciasData, error: ocorrenciasError } = await query;

        if (ocorrenciasError) {
          throw ocorrenciasError;
        }

        setOcorrencias((ocorrenciasData as Ocorrencia[]) || []);
      } catch (error: any) {
        setErro(error?.message || "Erro ao carregar sistema.");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emAnalise = ocorrencias.filter((o) => o.status === "EM_ANALISE_QUALIDADE").length;
    const direcionadas = ocorrencias.filter((o) => o.status === "DIRECIONADA").length;
    const emTratativa = ocorrencias.filter((o) => o.status === "EM_TRATATIVA").length;
    const aguardandoValidacao = ocorrencias.filter((o) => o.status === "AGUARDANDO_VALIDACAO").length;
    const concluidas = ocorrencias.filter((o) => o.status === "CONCLUIDA").length;
    const vencidas = ocorrencias.filter((o) => verificarSlaVencido(o)).length;

    const alta = ocorrencias.filter((o) =>
      o.gravidade?.toLowerCase().includes("alta") ||
      o.gravidade?.toLowerCase().includes("grave") ||
      o.gravidade?.toLowerCase().includes("crítica")
    ).length;

    const media = ocorrencias.filter((o) =>
      o.gravidade?.toLowerCase().includes("média") ||
      o.gravidade?.toLowerCase().includes("media")
    ).length;

    const baixa = ocorrencias.filter((o) =>
      o.gravidade?.toLowerCase().includes("baixa")
    ).length;

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
          <span className="text-sm font-medium text-slate-700">Carregando sistema...</span>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">Erro ao carregar sistema</h1>
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
                Painel executivo do sistema
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Visão geral das ocorrências, andamento do fluxo, situações vencidas e concentração por setor.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Perfil atual</p>
              <p className="text-sm font-semibold text-slate-900">
                {perfil?.nome || "Usuário"}
              </p>
              <p className="text-xs text-slate-600">
                {perfil?.role || "Sem perfil"} {perfil?.setor ? `• ${perfil.setor}` : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardIndicador titulo="Total de ocorrências" valor={indicadores.total} icon={<ClipboardList className="h-5 w-5" />} />
          <CardIndicador titulo="Em tratativa" valor={indicadores.emTratativa} icon={<BriefcaseMedical className="h-5 w-5" />} />
          <CardIndicador titulo="Aguardando validação" valor={indicadores.aguardandoValidacao} icon={<ShieldCheck className="h-5 w-5" />} />
          <CardIndicador titulo="Vencidas" valor={indicadores.vencidas} icon={<Siren className="h-5 w-5" />} destaque />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardMini titulo="Em análise" valor={indicadores.emAnalise} />
          <CardMini titulo="Direcionadas" valor={indicadores.direcionadas} />
          <CardMini titulo="Encerradas" valor={indicadores.concluidas} />
          <CardMini titulo="Prazo vencido" valor={indicadores.vencidas} />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Gravidade</h2>

            <div className="mt-4 space-y-3">
              <LinhaResumo titulo="Alta / Grave" valor={indicadores.alta} />
              <LinhaResumo titulo="Média" valor={indicadores.media} />
              <LinhaResumo titulo="Baixa" valor={indicadores.baixa} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="text-base font-semibold text-slate-900">Ranking de setores</h2>

            <div className="mt-4 space-y-3">
              {rankingSetores.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados de setores até o momento.</p>
              ) : (
                rankingSetores.map((item, index) => (
                  <div
                    key={`${item.setor}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 border border-slate-200">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.setor}</p>
                        <p className="text-xs text-slate-500">Ocorrências vinculadas ao setor</p>
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
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
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
                        <p className="mt-1 text-xs text-red-700 font-medium">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-emerald-600" />
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
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                            {traduzirStatus(item.status)}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gravidadeClasses(item.gravidade)}`}>
                            {item.gravidade || "Sem gravidade"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Aberta em {formatarDataCurta(item.created_at)} • {calcularDiasEmAberto(item.created_at)} dia(s) em aberto
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Resumo operacional</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ResumoBox
              titulo="Fluxo ativo"
              descricao="Ocorrências que ainda exigem ação da Qualidade ou Liderança."
              valor={indicadores.total - indicadores.concluidas}
            />
            <ResumoBox
              titulo="Conformidade de prazo"
              descricao="Quantidade de ocorrências dentro do SLA."
              valor={Math.max(0, indicadores.total - indicadores.vencidas)}
            />
            <ResumoBox
              titulo="Encerramento"
              descricao="Ocorrências finalizadas e validadas no processo."
              valor={indicadores.concluidas}
            />
            <ResumoBox
              titulo="Pontos críticos"
              descricao="Casos em alta gravidade para atenção imediata."
              valor={indicadores.alta}
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
        destaque
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          destaque ? "bg-white text-red-600" : "bg-emerald-50 text-emerald-700"
        }`}>
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

function LinhaResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{titulo}</span>
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
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
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-3 text-sm font-bold text-slate-900 border border-slate-200">
          {valor}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{descricao}</p>
    </div>
  );
}