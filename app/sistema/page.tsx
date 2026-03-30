"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import DashboardCards from "@/src/components/sistema/DashboardCards";
import OcorrenciaList from "@/src/components/sistema/OcorrenciaList";
import { obterIndicadores } from "@/src/lib/qualidade";
import type { Ocorrencia } from "@/src/types/ocorrencia";

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErro(error.message);
      setOcorrencias([]);
      setCarregando(false);
      return;
    }

    setOcorrencias((data || []) as Ocorrencia[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const indicadores = useMemo(() => obterIndicadores(ocorrencias), [ocorrencias]);

  const recentes = useMemo(() => ocorrencias.slice(0, 8), [ocorrencias]);

  if (carregando) {
    return <div className="text-sm text-slate-500">Carregando painel do sistema...</div>;
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Erro ao carregar ocorrências: {erro}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Visão executiva
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Governança do fluxo de ocorrências hospitalares
            </h2>
            <p className="mt-3 text-slate-600">
              Ambiente central para acompanhamento do fluxo completo, desde a abertura até a
              conclusão, com foco em qualidade hospitalar e rastreabilidade das tratativas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/abrir-ocorrencia"
              className="rounded-2xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:opacity-95"
            >
              Nova ocorrência
            </Link>
            <Link
              href="/sistema/indicadores"
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver indicadores
            </Link>
          </div>
        </div>
      </section>

      <DashboardCards
        items={[
          { titulo: "Total de ocorrências", valor: indicadores.total },
          { titulo: "Abertas", valor: indicadores.abertas },
          { titulo: "Em tratativa", valor: indicadores.emTratativa },
          { titulo: "Vencidas", valor: indicadores.vencidas },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Link
          href="/sistema/qualidade"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-700">
            Qualidade
          </p>
          <h3 className="mt-3 text-xl font-bold text-slate-900">
            Central de análise e direcionamento
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Tela para análise técnica, classificação, validação e encaminhamento das ocorrências.
          </p>
        </Link>

        <Link
          href="/sistema/lideranca"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-700">
            Liderança
          </p>
          <h3 className="mt-3 text-xl font-bold text-slate-900">
            Gestão setorial das tratativas
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Visão para líderes acompanharem pendências do setor, responsáveis e prazos.
          </p>
        </Link>

        <Link
          href="/sistema/indicadores"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-700">
            Indicadores
          </p>
          <h3 className="mt-3 text-xl font-bold text-slate-900">
            Painel analítico e visão gerencial
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Consolidação por etapa do fluxo, gravidade, setor e status operacional.
          </p>
        </Link>
      </div>

      <OcorrenciaList
        titulo="Ocorrências recentes"
        descricao="Últimos registros abertos no sistema."
        ocorrencias={recentes}
      />
    </div>
  );
}