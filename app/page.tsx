"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

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

const tiposOcorrencia = [
  "Não conformidade",
  "Evento adverso",
  "Quase falha",
  "Desvio de processo",
  "Reclamação",
  "Sugestão de melhoria",
];

const gravidades = ["Leve", "Moderada", "Grave", "Crítica"];

const statusFluxo: Record<string, string[]> = {
  Aberto: ["Em análise", "Encaminhado"],
  "Em análise": ["Encaminhado", "Em tratativa"],
  Encaminhado: ["Em tratativa"],
  "Em tratativa": ["Concluído"],
  Concluído: [],
};

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleString("pt-BR");
}

function badgeGravidade(gravidade: string) {
  switch (gravidade) {
    case "Leve":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "Moderada":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Grave":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "Crítica":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
}

function badgeStatus(status: string) {
  switch (status) {
    case "Aberto":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "Em análise":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "Encaminhado":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "Em tratativa":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Concluído":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
}

function calcularProximoStatus(statusAtual: string) {
  const opcoes = statusFluxo[statusAtual] || [];
  return opcoes[0] || statusAtual;
}

export default function Page() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detalhe, setDetalhe] = useState<Ocorrencia | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo_ocorrencia: "",
    setor_origem: "",
    setor_destino: "",
    gravidade: "",
    status: "Aberto",
  });

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

  function limparFormulario() {
    setForm({
      titulo: "",
      descricao: "",
      tipo_ocorrencia: "",
      setor_origem: "",
      setor_destino: "",
      gravidade: "",
      status: "Aberto",
    });
    setEditandoId(null);
  }

  async function salvarOcorrencia() {
    if (
      !form.titulo ||
      !form.descricao ||
      !form.tipo_ocorrencia ||
      !form.setor_origem ||
      !form.setor_destino ||
      !form.gravidade
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          ...form,
        })
        .eq("id", editandoId);

      if (error) {
        console.error("ERRO AO EDITAR:", error);
        alert("Erro ao editar ocorrência: " + error.message);
        return;
      }

      alert("Ocorrência atualizada com sucesso.");
    } else {
      const { error } = await supabase.from("ocorrencias").insert([
        {
          ...form,
          status: "Aberto",
        },
      ]);

      if (error) {
        console.error("ERRO AO INSERIR:", error);
        alert("Erro ao salvar ocorrência: " + error.message);
        return;
      }

      alert("Ocorrência cadastrada com sucesso.");
    }

    limparFormulario();
    setMostrarFormulario(false);
    carregarOcorrencias();
  }

  function iniciarEdicao(item: Ocorrencia) {
    setForm({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      tipo_ocorrencia: item.tipo_ocorrencia || "",
      setor_origem: item.setor_origem || "",
      setor_destino: item.setor_destino || "",
      gravidade: item.gravidade || "",
      status: item.status || "Aberto",
    });
    setEditandoId(item.id);
    setMostrarFormulario(true);
    setDetalhe(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirOcorrencia(id: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta ocorrência?"
    );
    if (!confirmar) return;

    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);

    if (error) {
      console.error("ERRO AO EXCLUIR:", error);
      alert("Erro ao excluir ocorrência: " + error.message);
      return;
    }

    if (detalhe?.id === id) {
      setDetalhe(null);
    }

    alert("Ocorrência excluída com sucesso.");
    carregarOcorrencias();
  }

  async function avancarStatus(item: Ocorrencia) {
    const novoStatus = calcularProximoStatus(item.status);

    if (novoStatus === item.status) {
      alert("Esta ocorrência já está no último status.");
      return;
    }

    const { error } = await supabase
      .from("ocorrencias")
      .update({ status: novoStatus })
      .eq("id", item.id);

    if (error) {
      console.error("ERRO AO ATUALIZAR STATUS:", error);
      alert("Erro ao atualizar status: " + error.message);
      return;
    }

    await carregarOcorrencias();

    if (detalhe?.id === item.id) {
      setDetalhe({ ...item, status: novoStatus });
    }
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = `${item.titulo} ${item.descricao} ${item.tipo_ocorrencia}`
        .toLowerCase()
        .trim();

      const passouBusca = filtroBusca
        ? texto.includes(filtroBusca.toLowerCase())
        : true;

      const passouSetor = filtroSetor
        ? item.setor_origem === filtroSetor || item.setor_destino === filtroSetor
        : true;

      const passouGravidade = filtroGravidade
        ? item.gravidade === filtroGravidade
        : true;

      const passouStatus = filtroStatus ? item.status === filtroStatus : true;

      return passouBusca && passouSetor && passouGravidade && passouStatus;
    });
  }, [ocorrencias, filtroBusca, filtroSetor, filtroGravidade, filtroStatus]);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "Aberto").length,
      emTratativa: ocorrencias.filter(
        (o) =>
          o.status === "Em análise" ||
          o.status === "Encaminhado" ||
          o.status === "Em tratativa"
      ).length,
      concluidas: ocorrencias.filter((o) => o.status === "Concluído").length,
      criticas: ocorrencias.filter((o) => o.gravidade === "Crítica").length,
    };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700">
                Gestão da Qualidade Assistencial
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Gestão de Ocorrências
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Registro, análise, acompanhamento e encerramento de ocorrências
                com visual profissional e fluxo organizado.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario((prev) => !prev);
                }}
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800"
              >
                {mostrarFormulario ? "Fechar formulário" : "Nova ocorrência"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {indicadores.total}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Abertas</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">
                {indicadores.abertas}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Em andamento</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">
                {indicadores.emTratativa}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Concluídas</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {indicadores.concluidas}
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">Críticas</p>
              <p className="mt-2 text-3xl font-bold text-red-900">
                {indicadores.criticas}
              </p>
            </div>
          </div>
        </div>

        {mostrarFormulario && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editandoId ? "Editar ocorrência" : "Cadastrar ocorrência"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preencha as informações principais da ocorrência.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Título
                </label>
                <input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm({ ...form, titulo: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                  placeholder="Digite o título da ocorrência"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de ocorrência
                </label>
                <select
                  value={form.tipo_ocorrencia}
                  onChange={(e) =>
                    setForm({ ...form, tipo_ocorrencia: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="">Selecione</option>
                  {tiposOcorrencia.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Gravidade
                </label>
                <select
                  value={form.gravidade}
                  onChange={(e) =>
                    setForm({ ...form, gravidade: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="">Selecione</option>
                  {gravidades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Setor de origem
                </label>
                <select
                  value={form.setor_origem}
                  onChange={(e) =>
                    setForm({ ...form, setor_origem: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Setor destino
                </label>
                <select
                  value={form.setor_destino}
                  onChange={(e) =>
                    setForm({ ...form, setor_destino: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  rows={5}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                  placeholder="Descreva a ocorrência com detalhes"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={salvarOcorrencia}
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                {editandoId ? "Salvar alterações" : "Cadastrar ocorrência"}
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Filtros</h2>
            <p className="mt-1 text-sm text-slate-500">
              Refine a visualização das ocorrências registradas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              placeholder="Buscar por título ou descrição"
            />

            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">Todos os setores</option>
              {setores.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>

            <select
              value={filtroGravidade}
              onChange={(e) => setFiltroGravidade(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">Todas as gravidades</option>
              {gravidades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">Todos os status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em análise">Em análise</option>
              <option value="Encaminhado">Encaminhado</option>
              <option value="Em tratativa">Em tratativa</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Ocorrências registradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total filtrado: {ocorrenciasFiltradas.length}
              </p>
            </div>
          </div>

          {carregando && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Carregando ocorrências...
            </div>
          )}

          {erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}

          {!carregando && !erro && ocorrenciasFiltradas.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Nenhuma ocorrência encontrada.
            </div>
          )}

          <div className="grid gap-4">
            {ocorrenciasFiltradas.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeGravidade(
                          item.gravidade
                        )}`}
                      >
                        {item.gravidade}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      {item.titulo}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {item.descricao}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <span className="font-medium text-slate-800">Tipo:</span>{" "}
                        {item.tipo_ocorrencia}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">Origem:</span>{" "}
                        {item.setor_origem}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">Destino:</span>{" "}
                        {item.setor_destino}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">Registro:</span>{" "}
                        {formatarData(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-auto xl:justify-end">
                    <button
                      onClick={() => setDetalhe(item)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Visualizar detalhes
                    </button>

                    <button
                      onClick={() => iniciarEdicao(item)}
                      className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => avancarStatus(item)}
                      className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Avançar status
                    </button>

                    <button
                      onClick={() => excluirOcorrencia(item.id)}
                      className="rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(
                      detalhe.status
                    )}`}
                  >
                    {detalhe.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeGravidade(
                      detalhe.gravidade
                    )}`}
                  >
                    {detalhe.gravidade}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {detalhe.titulo}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registrado em {formatarData(detalhe.created_at)}
                </p>
              </div>

              <button
                onClick={() => setDetalhe(null)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tipo de ocorrência
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {detalhe.tipo_ocorrencia}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gravidade
                </p>
                <p className="mt-2 text-sm text-slate-800">{detalhe.gravidade}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Setor de origem
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {detalhe.setor_origem}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Setor destino
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {detalhe.setor_destino}
                </p>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descrição detalhada
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {detalhe.descricao}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-200 p-6">
              <button
                onClick={() => {
                  iniciarEdicao(detalhe);
                }}
                className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                Editar ocorrência
              </button>

              <button
                onClick={() => avancarStatus(detalhe)}
                className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              >
                Avançar status
              </button>

              <button
                onClick={() => excluirOcorrencia(detalhe.id)}
                className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Excluir ocorrência
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}