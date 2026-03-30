"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string;
  gravidade: string;
  status: string;
  created_at?: string;
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

const statusList = [
  "Aberta",
  "Em análise pela Qualidade",
  "Direcionada ao setor",
  "Em tratativa",
  "Aguardando validação",
  "Concluída",
];

const initialForm = {
  titulo: "",
  descricao: "",
  tipo_ocorrencia: "Não conformidade",
  setor_origem: "",
  setor_destino: "",
  gravidade: "Leve",
  status: "Aberta",
};

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroSetor, setFiltroSetor] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("ERRO AO CARREGAR:", error);
      setErro("Não foi possível carregar as ocorrências: " + error.message);
      setCarregando(false);
      return;
    }

    setOcorrencias((data as Ocorrencia[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  function atualizarCampo(campo: string, valor: string) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function criarOcorrencia(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (
      !form.titulo.trim() ||
      !form.descricao.trim() ||
      !form.setor_origem ||
      !form.setor_destino
    ) {
      setErro("Preencha os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo_ocorrencia: form.tipo_ocorrencia,
      setor_origem: form.setor_origem,
      setor_destino: form.setor_destino,
      gravidade: form.gravidade,
      status: "Aberta",
    };

    const { data, error } = await supabase
      .from("ocorrencias")
      .insert([payload])
      .select();

    if (error) {
      console.error("ERRO COMPLETO SUPABASE:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setErro("Não foi possível criar a ocorrência: " + error.message);
      setSalvando(false);
      return;
    }

    if (data && data.length > 0) {
      setOcorrencias((prev) => [data[0] as Ocorrencia, ...prev]);
    } else {
      await carregarOcorrencias();
    }

    setSucesso("Ocorrência criada com sucesso.");
    setForm(initialForm);
    setModalAberto(false);
    setSalvando(false);
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = busca.toLowerCase();

      const matchBusca =
        item.titulo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.setor_origem?.toLowerCase().includes(texto) ||
        item.setor_destino?.toLowerCase().includes(texto);

      const matchStatus = filtroStatus === "Todos" || item.status === filtroStatus;
      const matchSetor =
        filtroSetor === "Todos" ||
        item.setor_origem === filtroSetor ||
        item.setor_destino === filtroSetor;

      return matchBusca && matchStatus && matchSetor;
    });
  }, [ocorrencias, busca, filtroStatus, filtroSetor]);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
    const emAndamento = ocorrencias.filter((o) =>
      ["Em análise pela Qualidade", "Direcionada ao setor", "Em tratativa", "Aguardando validação"].includes(o.status)
    ).length;
    const concluidas = ocorrencias.filter((o) => o.status === "Concluída").length;

    return { total, abertas, emAndamento, concluidas };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Sistema de Gestão de Qualidade
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Gestão de ocorrências hospitalares
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar para página inicial
              </Link>

              <button
                type="button"
                onClick={() => setModalAberto(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Nova ocorrência
              </button>
            </div>
          </div>

          {(erro || sucesso) && (
            <div className="mt-4 space-y-2">
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
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardIndicador titulo="Total" valor={indicadores.total} />
          <CardIndicador titulo="Abertas" valor={indicadores.abertas} />
          <CardIndicador titulo="Em andamento" valor={indicadores.emAndamento} />
          <CardIndicador titulo="Concluídas" valor={indicadores.concluidas} />
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Título, descrição ou setor"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              >
                <option value="Todos">Todos</option>
                {statusList.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Setor
              </label>
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              >
                <option value="Todos">Todos</option>
                {setores.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências</h2>
          </div>

          {carregando ? (
            <div className="p-8 text-sm text-slate-500">Carregando...</div>
          ) : ocorrenciasFiltradas.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">
              Nenhuma ocorrência encontrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ocorrenciasFiltradas.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          #{item.id} — {item.titulo}
                        </h3>
                        <BadgeStatus status={item.status} />
                        <BadgeGravidade gravidade={item.gravidade} />
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.descricao}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <Info label="Tipo" valor={item.tipo_ocorrencia} />
                        <Info label="Setor origem" valor={item.setor_origem} />
                        <Info label="Setor destino" valor={item.setor_destino} />
                        <Info
                          label="Data"
                          valor={
                            item.created_at
                              ? new Date(item.created_at).toLocaleString("pt-BR")
                              : "-"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Nova ocorrência</h2>
                <p className="text-sm text-slate-500">
                  Cadastro de ocorrência
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={criarOcorrencia} className="p-6">
              <div className="grid gap-5">
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
                    label="Setor de destino *"
                    value={form.setor_destino}
                    onChange={(v) => atualizarCampo("setor_destino", v)}
                    options={setores}
                    placeholder="Selecione"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <CampoSelect
                    label="Gravidade *"
                    value={form.gravidade}
                    onChange={(v) => atualizarCampo("gravidade", v)}
                    options={gravidades}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Status inicial
                    </label>
                    <input
                      value="Aberta"
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para página inicial
                </Link>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {salvando ? "Salvando..." : "Salvar ocorrência"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function CardIndicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{valor}</p>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{valor || "-"}</p>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold border";

  const styles: Record<string, string> = {
    Aberta: "bg-red-50 text-red-700 border-red-200",
    "Em análise pela Qualidade": "bg-amber-50 text-amber-700 border-amber-200",
    "Direcionada ao setor": "bg-blue-50 text-blue-700 border-blue-200",
    "Em tratativa": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Aguardando validação": "bg-purple-50 text-purple-700 border-purple-200",
    "Concluída": "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span className={`${base} ${styles[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {status}
    </span>
  );
}

function BadgeGravidade({ gravidade }: { gravidade: string }) {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold border";

  const styles: Record<string, string> = {
    Leve: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderada: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Grave: "bg-orange-50 text-orange-700 border-orange-200",
    Crítica: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={`${base} ${styles[gravidade] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {gravidade}
    </span>
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