"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase";

const tiposOcorrencia = [
  "Não conformidade",
  "Evento adverso",
  "Incidente",
  "Oportunidade de melhoria",
  "Queixa operacional",
  "Desvio de processo",
];

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

export default function NovaOcorrenciaPage() {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setorOrigem, setSetorOrigem] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    setErro("");
    setSalvando(true);

    const { error } = await supabase.from("ocorrencias").insert([
      {
        titulo: tipo,
        descricao,
        tipo_ocorrencia: tipo,
        setor_origem: setorOrigem,
        data_ocorrencia: dataOcorrencia,
        status: "Recebida",
        fila_atual: "Central da Qualidade",
        gravidade: "A definir",
        setor_destino: null,
      },
    ]);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setMensagem("Ocorrência registrada com sucesso e encaminhada à Central da Qualidade.");
    setTipo("");
    setDescricao("");
    setSetorOrigem("");
    setDataOcorrencia("");
    setSalvando(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Registrar ocorrência</h1>
          <p className="mt-2 text-sm text-slate-600">
            Preencha as informações para envio à Central da Qualidade.
          </p>
        </div>

        <form onSubmit={salvar} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo da ocorrência</label>
            <select
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {tiposOcorrencia.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Setor de origem</label>
            <select
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={setorOrigem}
              onChange={(e) => setSetorOrigem(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {setores.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data da ocorrência</label>
            <input
              type="date"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={dataOcorrencia}
              onChange={(e) => setDataOcorrencia(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              className="min-h-[140px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o fato observado com clareza."
              required
            />
          </div>

          {mensagem && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Enviar para a Qualidade"}
            </button>

            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar ao início
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}