"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import { getProfileAtual } from "../../../src/lib/auth";
import ProtegePagina from "../../../src/components/ProtegePagina";
import TopbarSistema from "../../../src/components/TopbarSistema";

type Ocorrencia = {
  id: number;
  titulo: string | null;
  status: string | null;
  setor_origem: string | null;
  setor_destino: string | null;
  gravidade: string | null;
  created_at: string | null;
};

export default function DiretoriaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    const profile = await getProfileAtual();

    if (!profile) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    if (profile.role !== "diretoria" && profile.role !== "qualidade") {
      setErro("Acesso não permitido para este perfil.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, titulo, status, setor_origem, setor_destino, gravidade, created_at")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar indicadores:", error);
      setErro("Não foi possível carregar os indicadores.");
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
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "Aberta").length,
      direcionadas: ocorrencias.filter((o) => o.status === "Direcionada").length,
      respondidas: ocorrencias.filter((o) => o.status === "Respondida").length,
      concluidas: ocorrencias.filter((o) => o.status === "Concluída").length,
      graves: ocorrencias.filter((o) => o.gravidade === "Alta").length,
    };
  }, [ocorrencias]);

  return (
    <ProtegePagina rolesPermitidos={["diretoria", "qualidade"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <TopbarSistema />

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-800">
              Painel Executivo da Diretoria
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visão consolidada do desempenho e do fluxo das ocorrências.
            </p>
          </section>

          {carregando ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Carregando indicadores...
            </div>
          ) : erro ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
              {erro}
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {indicadores.total}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Abertas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {indicadores.abertas}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Direcionadas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-cyan-700">
                    {indicadores.direcionadas}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Respondidas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {indicadores.respondidas}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Concluídas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-700">
                    {indicadores.concluidas}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Alta gravidade
                  </p>
                  <p className="mt-2 text-3xl font-bold text-rose-600">
                    {indicadores.graves}
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border bg-white shadow-sm">
                <div className="border-b p-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Registros recentes
                  </h2>
                </div>

                <div className="divide-y">
                  {ocorrencias.slice(0, 10).map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">
                            {item.titulo || "Ocorrência sem título"}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            Origem: {item.setor_origem || "Não informado"} |
                            Destino: {item.setor_destino || "Não direcionado"} |
                            Gravidade: {item.gravidade || "Não classificada"}
                          </p>
                        </div>

                        <div className="text-sm font-medium text-slate-600">
                          {item.status || "Sem status"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtegePagina>
  );
}