"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function DetalheOcorrenciaPage() {
  const params = useParams();
  const id = Number(params?.id);

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [acoes5w2h, setAcoes5w2h] = useState<Acao5W2H[]>([]);

  const [novaTratativa, setNovaTratativa] = useState("");
  const [novaAcao5w2h, setNovaAcao5w2h] = useState("");

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [salvandoTratativa, setSalvandoTratativa] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  async function carregarOcorrencia(ocorrenciaId: number) {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", ocorrenciaId)
      .single();

    if (error) {
      throw new Error(`Erro ao carregar ocorrência: ${error.message}`);
    }

    if (!data) {
      throw new Error("Ocorrência não encontrada.");
    }

    setOcorrencia(data as Ocorrencia);
  }

  async function carregarHistorico(ocorrenciaId: number) {
    const { data, error } = await supabase
      .from("historico_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar histórico:", error.message);
      return;
    }

    setHistorico((data as HistoricoItem[]) || []);
  }

  async function carregarTratativas(ocorrenciaId: number) {
    const { data, error } = await supabase
      .from("tratativas_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar tratativas:", error.message);
      return;
    }

    setTratativas((data as Tratativa[]) || []);
  }

  async function carregarAcoes5W2H(ocorrenciaId: number) {
    const { data, error } = await supabase
      .from("plano_acao_5w2h")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ações 5W2H:", error.message);
      return;
    }

    setAcoes5w2h((data as Acao5W2H[]) || []);
  }

  async function carregarTudo(ocorrenciaId: number) {
    setLoading(true);
    setErro("");

    try {
      await Promise.all([
        carregarOcorrencia(ocorrenciaId),
        carregarHistorico(ocorrenciaId),
        carregarTratativas(ocorrenciaId),
        carregarAcoes5W2H(ocorrenciaId),
      ]);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : "Erro inesperado ao carregar a ocorrência.";
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }

  async function salvarTratativa() {
    if (!novaTratativa.trim() || Number.isNaN(id)) return;

    setSalvandoTratativa(true);

    const { error } = await supabase.from("tratativas_ocorrencia").insert({
      ocorrencia_id: id,
      descricao: novaTratativa.trim(),
    });

    if (error) {
      setErro(`Erro ao salvar tratativa: ${error.message}`);
      setSalvandoTratativa(false);
      return;
    }

    setNovaTratativa("");
    await carregarTratativas(id);
    await carregarHistorico(id);
    setSalvandoTratativa(false);
  }

  async function salvar5W2H() {
    if (!novaAcao5w2h.trim() || Number.isNaN(id)) return;

    setSalvandoAcao(true);

    const { error } = await supabase.from("plano_acao_5w2h").insert({
      ocorrencia_id: id,
      o_que: novaAcao5w2h.trim(),
    });

    if (error) {
      setErro(`Erro ao salvar ação 5W2H: ${error.message}`);
      setSalvandoAcao(false);
      return;
    }

    setNovaAcao5w2h("");
    await carregarAcoes5W2H(id);
    await carregarHistorico(id);
    setSalvandoAcao(false);
  }

  async function alterarStatus(novoStatus: string) {
    if (!ocorrencia || Number.isNaN(id)) return;

    setAlterandoStatus(true);

    const { error } = await supabase
      .from("ocorrencias")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      setErro(`Erro ao alterar status: ${error.message}`);
      setAlterandoStatus(false);
      return;
    }

    await carregarOcorrencia(id);
    await carregarHistorico(id);
    setAlterandoStatus(false);
  }

  useEffect(() => {
    if (!params?.id) return;

    if (Number.isNaN(id)) {
      setErro("ID da ocorrência inválido.");
      setLoading(false);
      return;
    }

    carregarTudo(id);
  }, [params?.id, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg text-slate-600">Carregando ocorrência...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-red-700">Não foi possível carregar a ocorrência</h1>
          <p className="mt-3 text-sm text-slate-700">{erro}</p>

          <button
            type="button"
            onClick={() => {
              if (!Number.isNaN(id)) carregarTudo(id);
            }}
            className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!ocorrencia) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Ocorrência não encontrada.</p>
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