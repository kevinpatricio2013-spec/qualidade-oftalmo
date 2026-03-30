"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import DashboardCards from "@/src/components/sistema/DashboardCards";
import {
  contarPorGravidade,
  contarPorSetor,
  contarPorStatus,
  obterIndicadores,
} from "@/src/lib/qualidade";
import type { Ocorrencia } from "@/src/types/ocorrencia";

export default function SistemaIndicadoresPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
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
    carregar();
  }, []);

  const indicadores = useMemo(() => obterIndicadores(ocorrencias), [ocorrencias]);
  const porStatus = useMemo(() => contarPorStatus(ocorrencias), [ocorrencias]);
  const porGravidade = useMemo(() => contarPorGravidade(ocorrencias), [ocorrencias]);
  const porSetor = useMemo(() => contarPorSetor(ocorrencias), [ocorrencias]);

  if (carregando) {
    return <div className="text-sm text-slate-500">Carregando indicadores...</div>;
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Erro ao carregar indicadores: {erro}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Indicadores
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Painel gerencial de desempenho do fluxo
        </h2>
        <p className="mt-3 max-w-4xl text-slate-600">
          Consolidação executiva para acompanhamento do volume de ocorrências, desempenho do fluxo,
          criticidade e distribuição entre setores.
        </p>
      </section>

      <DashboardCards
        items={[
          { titulo: "Total de ocorrências", valor: indicadores.total },
          { titulo: "Concluídas", valor: indicadores.concluidas },
          { titulo: "Em tratativa", valor: indicadores.emTratativa },
          { titulo: "Vencidas", valor: indicadores.vencidas },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Por etapa do fluxo</h3>
          <div className="mt-5 space-y-4">
            {porStatus.map((item) => (
              <div key={item.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.status}</span>
                  <span className="font-semibold text-slate-900">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-700"
                    style={{
                      width:
                        indicadores.total > 0
                          ? `${(item.total / indicadores.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Por gravidade</h3>
          <div className="mt-5 space-y-4">
            {porGravidade.map((item) => (
              <div key={item.gravidade}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.gravidade}</span>
                  <span className="font-semibold text-slate-900">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{
                      width:
                        indicadores.total > 0
                          ? `${(item.total / indicadores.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Por setor destino</h3>
          <div className="mt-5 space-y-4">
            {porSetor.slice(0, 8).map((item) => (
              <div key={item.setor}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.setor}</span>
                  <span className="font-semibold text-slate-900">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{
                      width:
                        indicadores.total > 0
                          ? `${(item.total / indicadores.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}