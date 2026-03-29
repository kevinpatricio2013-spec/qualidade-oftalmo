"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type StatusOcorrencia =
  | "Aberta"
  | "Em análise"
  | "Em tratativa"
  | "Aguardando validação"
  | "Concluída"
  | "Atrasada";

type Gravidade = "Leve" | "Moderada" | "Grave" | "Crítica";

type Ocorrencia = {
  id?: number;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string;
  gravidade: Gravidade;
  responsavel: string;
  prazo: string;
  acao_imediata: string;
  causa_raiz: string;
  what_5w2h: string;
  why_5w2h: string;
  where_5w2h: string;
  when_5w2h: string;
  who_5w2h: string;
  how_5w2h: string;
  how_much_5w2h: string;
  historico_tratativas: string;
  conclusao_tratativa: string;
  validado: boolean;
  status?: StatusOcorrencia;
  created_at?: string;
  updated_at?: string;
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

const tiposOcorrencia = [
  "Não conformidade",
  "Evento adverso",
  "Quase falha",
  "Falha de processo",
  "Queixa",
  "Desvio de rotina",
  "Problema assistencial",
  "Problema administrativo",
];

const gravidades: Gravidade[] = ["Leve", "Moderada", "Grave", "Crítica"];

const initialForm: Ocorrencia = {
  titulo: "",
  descricao: "",
  tipo_ocorrencia: "Não conformidade",
  setor_origem: "",
  setor_destino: "",
  gravidade: "Leve",
  responsavel: "",
  prazo: "",
  acao_imediata: "",
  causa_raiz: "",
  what_5w2h: "",
  why_5w2h: "",
  where_5w2h: "",
  when_5w2h: "",
  who_5w2h: "",
  how_5w2h: "",
  how_much_5w2h: "",
  historico_tratativas: "",
  conclusao_tratativa: "",
  validado: false,
};

function calcularStatus(ocorrencia: Partial<Ocorrencia>): StatusOcorrencia {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prazo = ocorrencia.prazo ? new Date(ocorrencia.prazo) : null;
  if (prazo) prazo.setHours(0, 0, 0, 0);

  if (ocorrencia.validado) return "Concluída";

  if (prazo && prazo < hoje && !ocorrencia.validado) {
    return "Atrasada";
  }

  if ((ocorrencia.conclusao_tratativa || "").trim()) {
    return "Aguardando validação";
  }

  const temTratativa =
    !!(ocorrencia.acao_imediata || "").trim() ||
    !!(ocorrencia.causa_raiz || "").trim() ||
    !!(ocorrencia.what_5w2h || "").trim() ||
    !!(ocorrencia.why_5w2h || "").trim() ||
    !!(ocorrencia.how_5w2h || "").trim() ||
    !!(ocorrencia.historico_tratativas || "").trim();

  if ((ocorrencia.responsavel || "").trim() && temTratativa) {
    return "Em tratativa";
  }

  if ((ocorrencia.responsavel || "").trim()) {
    return "Em análise";
  }

  return "Aberta";
}

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleString("pt-BR");
}

function classeStatus(status: StatusOcorrencia) {
  switch (status) {
    case "Aberta":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "Em análise":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Em tratativa":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Aguardando validação":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Concluída":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Atrasada":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function classeGravidade(gravidade: Gravidade) {
  switch (gravidade) {
    case "Leve":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Moderada":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "Grave":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Crítica":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [form, setForm] = useState<Ocorrencia>(initialForm);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("");
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ERRO AO CARREGAR:", error);
      setErro("Não foi possível carregar as ocorrências: " + error.message);
      setCarregando(false);
      return;
    }

    const lista = (data || []).map((item: Ocorrencia) => ({
      ...item,
      status: calcularStatus(item),
    }));

    setOcorrencias(lista);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  function atualizarCampo(
    campo: keyof Ocorrencia,
    valor: string | boolean | number | null
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(initialForm);
    setEditandoId(null);
  }

  async function salvarOcorrencia(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.titulo.trim()) {
      setErro("Informe o título da ocorrência.");
      return;
    }

    if (!form.descricao.trim()) {
      setErro("Informe a descrição da ocorrência.");
      return;
    }

    setSalvando(true);

    const payload = {
      ...form,
      status: calcularStatus(form),
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("ocorrencias")
        .update(payload)
        .eq("id", editandoId);

      if (error) {
        console.error("ERRO AO ATUALIZAR:", error);
        setErro("Não foi possível atualizar a ocorrência: " + error.message);
        setSalvando(false);
        return;
      }

      setSucesso("Ocorrência atualizada com sucesso.");
    } else {
      const { error } = await supabase.from("ocorrencias").insert([
        {
          ...payload,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("ERRO AO SALVAR:", error);
        setErro("Não foi possível salvar a ocorrência: " + error.message);
        setSalvando(false);
        return;
      }

      setSucesso("Ocorrência cadastrada com sucesso.");
    }

    limparFormulario();
    await carregarOcorrencias();
    setSalvando(false);
  }

  function editarOcorrencia(ocorrencia: Ocorrencia) {
    setForm({
      titulo: ocorrencia.titulo || "",
      descricao: ocorrencia.descricao || "",
      tipo_ocorrencia: ocorrencia.tipo_ocorrencia || "Não conformidade",
      setor_origem: ocorrencia.setor_origem || "",
      setor_destino: ocorrencia.setor_destino || "",
      gravidade: ocorrencia.gravidade || "Leve",
      responsavel: ocorrencia.responsavel || "",
      prazo: ocorrencia.prazo || "",
      acao_imediata: ocorrencia.acao_imediata || "",
      causa_raiz: ocorrencia.causa_raiz || "",
      what_5w2h: ocorrencia.what_5w2h || "",
      why_5w2h: ocorrencia.why_5w2h || "",
      where_5w2h: ocorrencia.where_5w2h || "",
      when_5w2h: ocorrencia.when_5w2h || "",
      who_5w2h: ocorrencia.who_5w2h || "",
      how_5w2h: ocorrencia.how_5w2h || "",
      how_much_5w2h: ocorrencia.how_much_5w2h || "",
      historico_tratativas: ocorrencia.historico_tratativas || "",
      conclusao_tratativa: ocorrencia.conclusao_tratativa || "",
      validado: !!ocorrencia.validado,
    });

    setEditandoId(ocorrencia.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirOcorrencia(id?: number) {
    if (!id) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir esta ocorrência?"
    );
    if (!confirmar) return;

    setErro("");
    setSucesso("");

    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);

    if (error) {
      console.error("ERRO AO EXCLUIR:", error);
      setErro("Não foi possível excluir a ocorrência: " + error.message);
      return;
    }

    setSucesso("Ocorrência excluída com sucesso.");
    await carregarOcorrencias();
  }

  async function validarOcorrencia(ocorrencia: Ocorrencia) {
    if (!ocorrencia.id) return;

    setErro("");
    setSucesso("");

    const payload = {
      validado: true,
      status: calcularStatus({ ...ocorrencia, validado: true }),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("ocorrencias")
      .update(payload)
      .eq("id", ocorrencia.id);

    if (error) {
      console.error("ERRO AO VALIDAR:", error);
      setErro("Não foi possível validar a ocorrência: " + error.message);
      return;
    }

    setSucesso("Ocorrência validada com sucesso.");
    await carregarOcorrencias();
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = busca.toLowerCase().trim();

      const bateBusca =
        !texto ||
        item.titulo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.responsavel?.toLowerCase().includes(texto) ||
        item.setor_origem?.toLowerCase().includes(texto) ||
        item.setor_destino?.toLowerCase().includes(texto);

      const bateSetor =
        !filtroSetor ||
        item.setor_origem === filtroSetor ||
        item.setor_destino === filtroSetor;

      const bateStatus = !filtroStatus || item.status === filtroStatus;
      const bateGravidade =
        !filtroGravidade || item.gravidade === filtroGravidade;

      return bateBusca && bateSetor && bateStatus && bateGravidade;
    });
  }, [ocorrencias, busca, filtroSetor, filtroStatus, filtroGravidade]);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "Aberta").length,
      analise: ocorrencias.filter((o) => o.status === "Em análise").length,
      tratativa: ocorrencias.filter((o) => o.status === "Em tratativa").length,
      validacao: ocorrencias.filter((o) => o.status === "Aguardando validação")
        .length,
      concluidas: ocorrencias.filter((o) => o.status === "Concluída").length,
      atrasadas: ocorrencias.filter((o) => o.status === "Atrasada").length,
    };
  }, [ocorrencias]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                  Sistema hospitalar
                </p>
                <h1 className="mt-2 text-3xl font-bold">
                  Gestão de Ocorrências
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Registro, acompanhamento, tratativa e validação de ocorrências
                  assistenciais e administrativas com fluxo padronizado.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <div className="font-semibold">Visão executiva</div>
                <div className="mt-1 text-slate-300">
                  Painel consolidado para apresentação institucional.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-7">
            <CardIndicador titulo="Total" valor={indicadores.total} />
            <CardIndicador titulo="Abertas" valor={indicadores.abertas} />
            <CardIndicador titulo="Em análise" valor={indicadores.analise} />
            <CardIndicador titulo="Em tratativa" valor={indicadores.tratativa} />
            <CardIndicador titulo="Validação" valor={indicadores.validacao} />
            <CardIndicador titulo="Concluídas" valor={indicadores.concluidas} />
            <CardIndicador titulo="Atrasadas" valor={indicadores.atrasadas} />
          </div>
        </header>

        {erro && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sucesso}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <form
            onSubmit={salvarOcorrencia}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Registro principal
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-800">
                  {editandoId ? "Editar ocorrência" : "Nova ocorrência"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preenchimento estruturado para análise e plano de ação.
                </p>
              </div>

              {editandoId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <section className="mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Dados da ocorrência
                </h3>
                <p className="text-sm text-slate-500">
                  Identificação, classificação e distribuição inicial.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Título"
                  value={form.titulo}
                  onChange={(v) => atualizarCampo("titulo", v)}
                  placeholder="Ex.: Falha no preparo de sala cirúrgica"
                  required
                />

                <CampoSelect
                  label="Tipo da ocorrência"
                  value={form.tipo_ocorrencia}
                  onChange={(v) => atualizarCampo("tipo_ocorrencia", v)}
                  options={tiposOcorrencia}
                />

                <div className="md:col-span-2">
                  <CampoTextarea
                    label="Descrição"
                    value={form.descricao}
                    onChange={(v) => atualizarCampo("descricao", v)}
                    placeholder="Descreva a ocorrência de forma objetiva e clara."
                    required
                  />
                </div>

                <CampoSelect
                  label="Setor de origem"
                  value={form.setor_origem}
                  onChange={(v) => atualizarCampo("setor_origem", v)}
                  options={setores}
                  placeholder="Selecione"
                />

                <CampoSelect
                  label="Setor responsável"
                  value={form.setor_destino}
                  onChange={(v) => atualizarCampo("setor_destino", v)}
                  options={setores}
                  placeholder="Selecione"
                />

                <CampoSelect
                  label="Gravidade"
                  value={form.gravidade}
                  onChange={(v) => atualizarCampo("gravidade", v as Gravidade)}
                  options={gravidades}
                />

                <CampoTexto
                  label="Responsável pela tratativa"
                  value={form.responsavel}
                  onChange={(v) => atualizarCampo("responsavel", v)}
                  placeholder="Nome do responsável"
                />

                <CampoData
                  label="Prazo"
                  value={form.prazo}
                  onChange={(v) => atualizarCampo("prazo", v)}
                />
              </div>
            </section>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Análise da ocorrência
                </h3>
                <p className="text-sm text-slate-500">
                  Registro da resposta imediata e identificação da causa raiz.
                </p>
              </div>

              <div className="grid gap-4">
                <CampoTextarea
                  label="Ação imediata"
                  value={form.acao_imediata}
                  onChange={(v) => atualizarCampo("acao_imediata", v)}
                  placeholder="Informe a ação imediata adotada no momento da identificação."
                />

                <CampoTextarea
                  label="Causa raiz"
                  value={form.causa_raiz}
                  onChange={(v) => atualizarCampo("causa_raiz", v)}
                  placeholder="Descreva a análise da causa raiz."
                />
              </div>
            </section>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">Plano 5W2H</h3>
                <p className="text-sm text-slate-500">
                  Planejamento de ação corretiva e acompanhamento.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="What"
                  value={form.what_5w2h}
                  onChange={(v) => atualizarCampo("what_5w2h", v)}
                  placeholder="O que será feito?"
                />
                <CampoTexto
                  label="Why"
                  value={form.why_5w2h}
                  onChange={(v) => atualizarCampo("why_5w2h", v)}
                  placeholder="Por que será feito?"
                />
                <CampoTexto
                  label="Where"
                  value={form.where_5w2h}
                  onChange={(v) => atualizarCampo("where_5w2h", v)}
                  placeholder="Onde será feito?"
                />
                <CampoTexto
                  label="When"
                  value={form.when_5w2h}
                  onChange={(v) => atualizarCampo("when_5w2h", v)}
                  placeholder="Quando será feito?"
                />
                <CampoTexto
                  label="Who"
                  value={form.who_5w2h}
                  onChange={(v) => atualizarCampo("who_5w2h", v)}
                  placeholder="Quem executará?"
                />
                <CampoTexto
                  label="How"
                  value={form.how_5w2h}
                  onChange={(v) => atualizarCampo("how_5w2h", v)}
                  placeholder="Como será executado?"
                />
                <div className="md:col-span-2">
                  <CampoTexto
                    label="How much"
                    value={form.how_much_5w2h}
                    onChange={(v) => atualizarCampo("how_much_5w2h", v)}
                    placeholder="Qual o custo estimado?"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Tratativas e validação
                </h3>
                <p className="text-sm text-slate-500">
                  Histórico de execução, conclusão e encerramento.
                </p>
              </div>

              <div className="grid gap-4">
                <CampoTextarea
                  label="Histórico de tratativas"
                  value={form.historico_tratativas}
                  onChange={(v) => atualizarCampo("historico_tratativas", v)}
                  placeholder="Ex.: 20/03 - Reunião com setor. 21/03 - Ajuste de fluxo realizado."
                />

                <CampoTextarea
                  label="Conclusão da tratativa"
                  value={form.conclusao_tratativa}
                  onChange={(v) => atualizarCampo("conclusao_tratativa", v)}
                  placeholder="Registre a conclusão encaminhada para validação."
                />

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.validado}
                    onChange={(e) => atualizarCampo("validado", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Validado pela Qualidade
                </label>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Atualizar ocorrência"
                  : "Salvar ocorrência"}
              </button>

              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar formulário
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Painel lateral
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-800">
                  Filtros de consulta
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Busca rápida para acompanhamento executivo.
                </p>
              </div>

              <div className="grid gap-4">
                <CampoTexto
                  label="Buscar"
                  value={busca}
                  onChange={setBusca}
                  placeholder="Título, descrição, setor ou responsável"
                />

                <CampoSelect
                  label="Setor"
                  value={filtroSetor}
                  onChange={setFiltroSetor}
                  options={setores}
                  placeholder="Todos"
                />

                <CampoSelect
                  label="Status"
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  options={[
                    "Aberta",
                    "Em análise",
                    "Em tratativa",
                    "Aguardando validação",
                    "Concluída",
                    "Atrasada",
                  ]}
                  placeholder="Todos"
                />

                <CampoSelect
                  label="Gravidade"
                  value={filtroGravidade}
                  onChange={setFiltroGravidade}
                  options={gravidades}
                  placeholder="Todas"
                />

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setFiltroSetor("");
                    setFiltroStatus("");
                    setFiltroGravidade("");
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  Padrão de fluxo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Evolução automática do status da ocorrência.
                </p>
              </div>

              <div className="space-y-3">
                <ResumoLinha titulo="1. Abertura" valor="Ocorrência registrada no sistema" />
                <ResumoLinha titulo="2. Análise" valor="Responsável definido" />
                <ResumoLinha titulo="3. Tratativa" valor="Ações e histórico iniciados" />
                <ResumoLinha titulo="4. Validação" valor="Conclusão registrada" />
                <ResumoLinha titulo="5. Encerramento" valor="Validação final pela Qualidade" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  Resumo institucional
                </h2>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <ResumoLinha
                  titulo="Modelo de uso"
                  valor="Registro e acompanhamento de não conformidades, eventos e falhas de processo."
                />
                <ResumoLinha
                  titulo="Foco"
                  valor="Qualidade hospitalar com organização leve, limpa e profissional."
                />
                <ResumoLinha
                  titulo="Situação atual"
                  valor="Base funcional publicada, pronta para evolução do projeto."
                />
              </div>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Acompanhamento
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">
                Lista de ocorrências
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {ocorrenciasFiltradas.length} registro(s) encontrado(s).
              </p>
            </div>
          </div>

          {carregando ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
              Carregando ocorrências...
            </div>
          ) : ocorrenciasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-slate-500">
              Nenhuma ocorrência encontrada.
            </div>
          ) : (
            <div className="space-y-4">
              {ocorrenciasFiltradas.map((item) => {
                const status = item.status || calcularStatus(item);
                const expandido = expandidoId === item.id;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                  >
                    <div className="p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-800">
                              {item.titulo}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeGravidade(
                                item.gravidade
                              )}`}
                            >
                              {item.gravidade}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {item.descricao}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <Info titulo="Tipo" texto={item.tipo_ocorrencia || "-"} />
                            <Info titulo="Origem" texto={item.setor_origem || "-"} />
                            <Info titulo="Responsável" texto={item.responsavel || "-"} />
                            <Info titulo="Prazo" texto={formatarData(item.prazo)} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandidoId(expandido ? null : item.id || null)
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            {expandido ? "Ocultar" : "Detalhar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => editarOcorrencia(item)}
                            className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                          >
                            Editar
                          </button>

                          {status === "Aguardando validação" && !item.validado && (
                            <button
                              type="button"
                              onClick={() => validarOcorrencia(item)}
                              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Validar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => excluirOcorrencia(item.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandido && (
                      <div className="border-t border-slate-200 bg-white p-5">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <BlocoDetalhe
                            titulo="Setor responsável"
                            valor={item.setor_destino}
                          />
                          <BlocoDetalhe
                            titulo="Criado em"
                            valor={formatarDataHora(item.created_at)}
                          />
                          <BlocoDetalhe
                            titulo="Atualizado em"
                            valor={formatarDataHora(item.updated_at)}
                          />
                          <BlocoDetalhe
                            titulo="Ação imediata"
                            valor={item.acao_imediata}
                          />
                          <BlocoDetalhe
                            titulo="Causa raiz"
                            valor={item.causa_raiz}
                          />
                          <BlocoDetalhe
                            titulo="Validação"
                            valor={item.validado ? "Sim" : "Não"}
                          />
                          <BlocoDetalhe titulo="What" valor={item.what_5w2h} />
                          <BlocoDetalhe titulo="Why" valor={item.why_5w2h} />
                          <BlocoDetalhe titulo="Where" valor={item.where_5w2h} />
                          <BlocoDetalhe titulo="When" valor={item.when_5w2h} />
                          <BlocoDetalhe titulo="Who" valor={item.who_5w2h} />
                          <BlocoDetalhe titulo="How" valor={item.how_5w2h} />

                          <div className="md:col-span-2 xl:col-span-3">
                            <BlocoDetalhe
                              titulo="How much"
                              valor={item.how_much_5w2h}
                            />
                          </div>

                          <div className="md:col-span-2 xl:col-span-3">
                            <BlocoDetalhe
                              titulo="Histórico de tratativas"
                              valor={item.historico_tratativas}
                            />
                          </div>

                          <div className="md:col-span-2 xl:col-span-3">
                            <BlocoDetalhe
                              titulo="Conclusão da tratativa"
                              valor={item.conclusao_tratativa}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CardIndicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-2xl font-bold text-slate-800">{valor}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </div>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function CampoTextarea({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
      />
    </label>
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
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
      >
        <option value="">{placeholder || "Selecione"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function CampoData({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function Info({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {titulo}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-700">{texto}</div>
    </div>
  );
}

function ResumoLinha({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-semibold text-slate-700">{titulo}</div>
      <div className="mt-1 text-sm text-slate-500">{valor}</div>
    </div>
  );
}

function BlocoDetalhe({
  titulo,
  valor,
}: {
  titulo: string;
  valor?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {valor?.trim() ? valor : "-"}
      </p>
    </div>
  );
}