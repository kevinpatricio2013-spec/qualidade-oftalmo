"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import DashboardCards from "@/src/components/sistema/DashboardCards";
import OcorrenciaList from "@/src/components/sistema/OcorrenciaList";
import { SETORES } from "@/src/lib/qualidade";
import type { Ocorrencia } from "@/src/types/ocorrencia";

export default function SistemaLiderancaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState("Centro Cirúrgico");
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

  const doSetor = useMemo(
    () => ocorrencias.filter((item) => item.setor_destino === setorSelecionado),
    [ocorrencias, setorSelecionado]
  );

  const emTratativa = useMemo(
    () => doSetor.filter((item) => item.status === "Em tratativa"),
    [doSetor]
  );

  const direcionadas = useMemo(
    () => doSetor.filter((item) => item.status === "Direcionada ao setor"),
    [doSetor]
  );

  const aguardandoValidacao = useMemo(
    () => doSetor.filter((item) => item.status === "Aguardando validação"),
    [doSetor]
  );

  if (carregando) {
    return <div className="text-sm text-slate-500">Carregando visão da Liderança...</div>;
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Erro ao carregar a visão da Liderança: {erro}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
          Módulo Liderança
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Gestão setorial de tratativas e prazos
        </h2>
        <p className="mt-3 max-w-4xl text-slate-600">
          Ambiente para que cada liderança acompanhe apenas as ocorrências direcionadas ao seu
          setor, com visão prática do andamento da tratativa.
        </p>

        <div className="mt-6 max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Selecionar setor
          </label>
          <select
            value={setorSelecionado}
            onChange={(e) => setSetorSelecionado(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600"
          >
            {SETORES.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>
        </div>
      </section>

      <DashboardCards
        items={[
          { titulo: "Total do setor", valor: doSetor.length },
          { titulo: "Direcionadas ao setor", valor: direcionadas.length },
          { titulo: "Em tratativa", valor: emTratativa.length },
          { titulo: "Aguardando validação", valor: aguardandoValidacao.length },
        ]}
      />

      <OcorrenciaList
        titulo={`Ocorrências do setor: ${setorSelecionado}`}
        descricao="Fila operacional do setor selecionado."
        ocorrencias={doSetor}
        vazioTexto="Não há ocorrências para este setor."
      />
    </div>
  );
}