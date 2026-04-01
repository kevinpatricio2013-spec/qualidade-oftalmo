"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";
import HistoricoOcorrencia from "../../components/HistoricoOcorrencia";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
};

type HistoricoItem = {
  id: number;
  tipo_evento: string;
  descricao: string;
  status_anterior: string | null;
  status_novo: string | null;
  usuario: string | null;
  origem: string | null;
  created_at: string;
};

type Tratativa = {
  id: number;
  descricao: string;
  created_at?: string;
};

type Acao5W2H = {
  id: number;
  o_que: string;
  created_at?: string;
};

export default function DetalheOcorrencia({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [acoes5w2h, setAcoes5w2h] = useState<Acao5W2H[]>([]);

  const [novaTratativa, setNovaTratativa] = useState("");
  const [novaAcao5w2h, setNovaAcao5w2h] = useState("");

  const [salvandoTratativa, setSalvandoTratativa] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  async function carregarOcorrencia() {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao carregar ocorrência:", error);
      return;
    }

    setOcorrencia(data);
  }

  async function carregarHistorico() {
    const { data, error } = await supabase
      .from("historico_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    setHistorico((data as HistoricoItem[]) || []);
  }

  async function carregarTratativas() {
    const { data, error } = await supabase
      .from("tratativas_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar tratativas:", error);
      return;
    }

    setTratativas((data as Tratativa[]) || []);
  }

  async function carregarAcoes5W2H() {
    const { data, error } = await supabase
      .from("plano_acao_5w2h")
      .select("*")
      .eq("ocorrencia_id", id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ações 5W2H:", error);
      return;
    }

    setAcoes5w2h((data as Acao5W2H[]) || []);
  }

  async function salvarTratativa() {
    if (!novaTratativa.trim()) return;

    setSalvandoTratativa(true);

    const { error } = await supabase.from("tratativas_ocorrencia").insert({
      ocorrencia_id: id,
      descricao: novaTratativa.trim(),
    });

    if (error) {
      console.error("Erro ao salvar tratativa:", error);
      setSalvandoTratativa(false);
      return;
    }

    setNovaTratativa("");
    await carregarTratativas();
    await carregarHistorico();
    setSalvandoTratativa(false);
  }

  async function salvar5W2H() {
    if (!novaAcao5w2h.trim()) return;

    setSalvandoAcao(true);

    const { error } = await supabase.from("plano_acao_5w2h").insert({
      ocorrencia_id: id,
      o_que: novaAcao5w2h.trim(),
    });

    if (error) {
      console.error("Erro ao salvar ação 5W2H:", error);
      setSalvandoAcao(false);
      return;
    }

    setNovaAcao5w2h("");
    await carregarAcoes5W2H();
    await carregarHistorico();
    setSalvandoAcao(false);
  }

  async function alterarStatus(novoStatus: string) {
    if (!ocorrencia) return;

    setAlterandoStatus(true);

    const { error } = await supabase
      .from("ocorrencias")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar status:", error);
      setAlterandoStatus(false);
      return;
    }

    await carregarOcorrencia();
    await carregarHistorico();
    setAlterandoStatus(false);
  }

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    carregarOcorrencia();
    carregarHistorico();
    carregarTratativas();
    carregarAcoes5W2H();
  }, [id]);

  if (!ocorrencia) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Carregando ocorrência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {ocorrencia.titulo}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {ocorrencia.descricao}
              </p>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Status atual: {ocorrencia.status}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => alterarStatus("Aberta")}
              disabled={alterandoStatus}
              className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
            >
              Aberta
            </button>

            <button
              type="button"
              onClick={() => alterarStatus("Em análise")}
              disabled={alterandoStatus}
              className="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 transition hover:bg-yellow-200 disabled:opacity-50"
            >
              Em análise
            </button>

            <button
              type="button"
              onClick={() => alterarStatus("Finalizada")}
              disabled={alterandoStatus}
              className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200 disabled:opacity-50"
            >
              Finalizada
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Tratativas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registre as ações imediatas e conduções adotadas para a ocorrência.
          </p>

          <textarea
            value={novaTratativa}
            onChange={(e) => setNovaTratativa(e.target.value)}
            placeholder="Descreva a tratativa realizada"
            className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-sky-500"
          />

          <button
            type="button"
            onClick={salvarTratativa}
            disabled={salvandoTratativa}
            className="mt-3 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {salvandoTratativa ? "Salvando..." : "Salvar tratativa"}
          </button>

          <div className="mt-6 space-y-3">
            {tratativas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma tratativa registrada.
              </div>
            ) : (
              tratativas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {item.descricao}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            Plano de ação 5W2H
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registre a ação estruturada vinculada à ocorrência.
          </p>

          <textarea
            value={novaAcao5w2h}
            onChange={(e) => setNovaAcao5w2h(e.target.value)}
            placeholder="Descreva a ação do plano 5W2H"
            className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={salvar5W2H}
            disabled={salvandoAcao}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {salvandoAcao ? "Salvando..." : "Salvar ação 5W2H"}
          </button>

          <div className="mt-6 space-y-3">
            {acoes5w2h.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma ação 5W2H registrada.
              </div>
            ) : (
              acoes5w2h.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {item.o_que}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <HistoricoOcorrencia historico={historico} />
      </div>
    </div>
  );
}