"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import ProtegePagina from "../../../src/components/ProtegePagina";
import TopbarSistema from "../../../src/components/TopbarSistema";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  setor_origem: string | null;
  setor_destino: string | null;
  status: string | null;
  resposta_lideranca: string | null;
};

const setores = [
  "Agendamento",
  "Autorização",
  "Centro Cirúrgico",
  "CME",
  "Comissões Hospitalares",
  "Compras",
  "Consultório Médico",
  "Contas Médicas",
  "Controlador de Acesso",
  "Diretoria",
  "Facilities",
  "Farmácia / OPME",
  "Faturamento",
  "Financeiro",
  "Fornecedores Externos",
  "Gestão da Informação",
  "Gestão de Pessoas",
  "Higiene",
  "Qualidade",
  "Recepção",
  "Engenharia Clínica",
  "Pronto Atendimento",
];

export default function QualidadePage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarOcorrencias() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ocorrências:", error);
      setOcorrencias([]);
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  async function direcionarOcorrencia(id: number, setorDestino: string) {
    const { error } = await supabase
      .from("ocorrencias")
      .update({
        setor_destino: setorDestino,
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao direcionar: " + error.message);
      return;
    }

    await carregarOcorrencias();
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  return (
    <ProtegePagina rolesPermitidos={["qualidade", "diretoria"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <TopbarSistema />

          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">
              Gestão da Qualidade
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Direcionamento e acompanhamento das ocorrências.
            </p>
          </div>

          {carregando ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Carregando ocorrências...
            </div>
          ) : (
            <div className="grid gap-4">
              {ocorrencias.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-500">
                  Nenhuma ocorrência encontrada.
                </div>
              ) : (
                ocorrencias.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-slate-800">
                          {item.titulo}
                        </h2>

                        <p className="text-sm text-slate-600">
                          {item.descricao}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            Origem: {item.setor_origem || "Não informado"}
                          </span>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                            Destino: {item.setor_destino || "Não direcionado"}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                            Status: {item.status || "Sem status"}
                          </span>
                        </div>

                        {item.resposta_lideranca && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                            <strong>Resposta da liderança:</strong>{" "}
                            {item.resposta_lideranca}
                          </div>
                        )}
                      </div>

                      <div className="w-full max-w-xs">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Direcionar para setor
                        </label>
                        <select
                          defaultValue={item.setor_destino || ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              direcionarOcorrencia(item.id, e.target.value);
                            }
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                        >
                          <option value="">Selecione</option>
                          {setores.map((setor) => (
                            <option key={setor} value={setor}>
                              {setor}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </ProtegePagina>
  );
}