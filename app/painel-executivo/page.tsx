"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../src/lib/supabase";

type Ocorrencia = {
  id: number;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string | null;
  gravidade: string;
  status: string;
};

export default function PainelExecutivoPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!perfil || perfil.role !== "diretoria") {
      setErro("Acesso permitido somente à Diretoria.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, tipo_ocorrencia, setor_origem, setor_destino, gravidade, status")
      .order("id", { ascending: false });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const encerradas = ocorrencias.filter((o) => o.status === "Encerrada").length;
    const emAndamento = ocorrencias.filter((o) => o.status !== "Encerrada").length;
    const criticas = ocorrencias.filter((o) => o.gravidade === "Crítica").length;

    const porSetor: Record<string, number> = {};
    for (const oc of ocorrencias) {
      const chave = oc.setor_destino || "Não definido";
      porSetor[chave] = (porSetor[chave] || 0) + 1;
    }

    const ranking = Object.entries(porSetor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { total, encerradas, emAndamento, criticas, ranking };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Painel Executivo</p>
              <h1 className="text-3xl font-bold text-slate-800">Visão institucional da qualidade</h1>
              <p className="mt-2 text-sm text-slate-600">
                Monitoramento consolidado de ocorrências, gravidade e desempenho setorial.
              </p>
            </div>

            <Link href="/" className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
              Início
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card titulo="Total de ocorrências" valor={indicadores.total} />
          <Card titulo="Em andamento" valor={indicadores.emAndamento} />
          <Card titulo="Encerradas" valor={indicadores.encerradas} />
          <Card titulo="Críticas" valor={indicadores.criticas} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Ranking por setor responsável</h2>

            {carregando && <p className="text-sm text-slate-600">Carregando...</p>}
            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="space-y-3">
              {indicadores.ranking.map(([setor, total]) => (
                <div
                  key={setor}
                  className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{setor}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    {total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Leitura estratégica</h2>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">Acompanhamento institucional</p>
                <p className="mt-1">
                  Monitoramento do volume global de ocorrências e da concentração por setor responsável.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">Severidade e risco</p>
                <p className="mt-1">
                  Identificação das ocorrências críticas para apoio à tomada de decisão prioritária.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">Desempenho operacional</p>
                <p className="mt-1">
                  Avaliação do andamento das tratativas e da capacidade de encerramento institucional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}