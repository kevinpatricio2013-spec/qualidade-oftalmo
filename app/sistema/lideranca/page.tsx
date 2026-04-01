"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import { getProfileAtual } from "../../../src/lib/auth";
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

export default function LiderancaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [setorLider, setSetorLider] = useState("");
  const [erro, setErro] = useState("");

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const profile = await getProfileAtual();

    if (!profile) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    if (profile.role !== "lider") {
      setErro("Acesso permitido apenas para liderança.");
      setCarregando(false);
      return;
    }

    const setor = profile.setor || "";
    setSetorLider(setor);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("setor_destino", setor)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ocorrências da liderança:", error);
      setErro("Não foi possível carregar as ocorrências.");
      setOcorrencias([]);
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  async function responderOcorrencia(id: number) {
    const resposta = respostas[id];

    if (!resposta || !resposta.trim()) {
      alert("Digite a resposta da liderança.");
      return;
    }

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        resposta_lideranca: resposta,
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao responder: " + error.message);
      return;
    }

    setRespostas((prev) => ({ ...prev, [id]: "" }));
    await carregarOcorrencias();
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  return (
    <ProtegePagina rolesPermitidos={["lider"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <TopbarSistema />

          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">
              Liderança {setorLider ? `- ${setorLider}` : ""}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Tratativa das ocorrências direcionadas ao setor.
            </p>
          </div>

          {carregando ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Carregando ocorrências...
            </div>
          ) : erro ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
              {erro}
            </div>
          ) : (
            <div className="grid gap-4">
              {ocorrencias.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-500">
                  Nenhuma ocorrência direcionada para este setor.
                </div>
              ) : (
                ocorrencias.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold text-slate-800">
                        {item.titulo}
                      </h2>

                      <p className="text-sm text-slate-600">{item.descricao}</p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Origem: {item.setor_origem || "Não informado"}
                        </span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                          Destino: {item.setor_destino || "Não informado"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                          Status: {item.status || "Sem status"}
                        </span>
                      </div>

                      <textarea
                        value={respostas[item.id] ?? ""}
                        onChange={(e) =>
                          setRespostas((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Digite a tratativa / resposta da liderança"
                        className="min-h-[120px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none"
                      />

                      <div className="flex justify-end">
                        <button
                          onClick={() => responderOcorrencia(item.id)}
                          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Salvar resposta
                        </button>
                      </div>

                      {item.resposta_lideranca && (
                        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          <strong>Resposta registrada:</strong>{" "}
                          {item.resposta_lideranca}
                        </div>
                      )}
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