"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/src/lib/supabase";

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
  "Farmácia/OPME",
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

const tipos = [
  "Não conformidade",
  "Evento adverso",
  "Quase falha",
  "Reclamação",
  "Sugestão de melhoria",
];

const gravidades = ["Leve", "Moderada", "Grave", "Crítica"];

const initialForm = {
  titulo: "",
  descricao: "",
  tipo_ocorrencia: "Não conformidade",
  setor_origem: "",
  setor_destino: "Qualidade",
  gravidade: "Leve",
};

export default function AbrirOcorrenciaPage() {
  const [form, setForm] = useState(initialForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function atualizarCampo(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarOcorrencia(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.titulo.trim() || !form.descricao.trim() || !form.setor_origem) {
      setErro("Preencha os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo_ocorrencia: form.tipo_ocorrencia,
      setor_origem: form.setor_origem,
      setor_destino: "Qualidade",
      gravidade: form.gravidade,
      status: "Aberta",
    };

    const { error } = await supabase.from("ocorrencias").insert([payload]);

    if (error) {
      console.error("ERRO AO ABRIR OCORRÊNCIA:", error);
      setErro("Não foi possível registrar a ocorrência: " + error.message);
      setSalvando(false);
      return;
    }

    setSucesso("Ocorrência registrada com sucesso.");
    setForm(initialForm);
    setSalvando(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Abertura de ocorrência
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Registro rápido para não conformidades, eventos e oportunidades de melhoria.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Início
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {(erro || sucesso) && (
            <div className="mb-5 space-y-2">
              {erro && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erro}
                </div>
              )}
              {sucesso && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {sucesso}
                </div>
              )}
            </div>
          )}

          <form onSubmit={salvarOcorrencia} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <CampoTexto
                label="Título *"
                value={form.titulo}
                onChange={(v) => atualizarCampo("titulo", v)}
                placeholder="Digite o título"
              />

              <CampoSelect
                label="Tipo de ocorrência *"
                value={form.tipo_ocorrencia}
                onChange={(v) => atualizarCampo("tipo_ocorrencia", v)}
                options={tipos}
              />
            </div>

            <CampoTextarea
              label="Descrição *"
              value={form.descricao}
              onChange={(v) => atualizarCampo("descricao", v)}
              placeholder="Descreva a ocorrência"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <CampoSelect
                label="Setor de origem *"
                value={form.setor_origem}
                onChange={(v) => atualizarCampo("setor_origem", v)}
                options={setores}
                placeholder="Selecione"
              />

              <CampoSelect
                label="Gravidade *"
                value={form.gravidade}
                onChange={(v) => atualizarCampo("gravidade", v)}
                options={gravidades}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Destino inicial
              </label>
              <input
                value="Qualidade"
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/sistema"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ir para gestão
              </Link>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {salvando ? "Salvando..." : "Registrar ocorrência"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
      />
    </div>
  );
}

function CampoTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}