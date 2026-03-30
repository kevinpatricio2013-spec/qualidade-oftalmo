"use client";

import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabase";

type Setor = {
  id: string;
  nome: string;
};

export default function SistemaClient() {
  const [status, setStatus] = useState("Carregando...");
  const [setores, setSetores] = useState<Setor[]>([]);

  useEffect(() => {
    async function testar() {
      try {
        const { data, error } = await supabase
          .from("setores")
          .select("id, nome")
          .order("nome", { ascending: true });

        if (error) {
          setStatus(`Erro Supabase: ${error.message}`);
          return;
        }

        setSetores(data || []);
        setStatus("Conexão com Supabase funcionando");
      } catch (err: any) {
        setStatus(`Erro: ${err.message || "Falha ao conectar"}`);
      }
    }

    testar();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">
            Gestão de Qualidade
          </p>
          <h1 className="mt-2 text-3xl font-bold">Teste do Sistema</h1>
          <p className="mt-3 text-sm text-slate-200">{status}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Setores carregados do banco
          </h2>

          <div className="mt-4 space-y-3">
            {setores.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum setor encontrado ou conexão ainda não concluída.
              </p>
            ) : (
              setores.map((setor) => (
                <div
                  key={setor.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {setor.nome}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}