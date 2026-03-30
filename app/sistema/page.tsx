"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type StatusOcorrencia =
  | "Aberta"
  | "Em análise pela Qualidade"
  | "Direcionada ao setor"
  | "Em tratativa"
  | "Aguardando validação"
  | "Concluída";

type PerfilVisual = "Qualidade" | "Liderança";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string;
  gravidade: string;
  status: StatusOcorrencia;
  responsavel?: string | null;
  prazo?: string | null;
  acao_imediata?: string | null;
  analise_causa?: string | null;
  tratativa?: string | null;
  validacao_qualidade?: string | null;
  what_5w2h?: string | null;
  why_5w2h?: string | null;
  where_5w2h?: string | null;
  when_5w2h?: string | null;
  who_5w2h?: string | null;
  how_5w2h?: string | null;
  how_much_5w2h?: string | null;
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

const statusList: StatusOcorrencia[] = [
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
  responsavel: "",
  prazo: "",
};

const initialDetalhes = {
  acao_imediata: "",
  analise_causa: "",
  tratativa: "",
  validacao_qualidade: "",
  what_5w2h: "",
  why_5w2h: "",
  where_5w2h: "",
  when_5w2h: "",
  who_5w2h: "",
  how_5w2h: "",
  how_much_5w2h: "",
};

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroSetor, setFiltroSetor] = useState("Todos");

  const [perfilVisual, setPerfilVisual] = useState<PerfilVisual>("Qualidade");
  const [setorLideranca, setSetorLideranca] = useState("Centro Cirúrgico");

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [formEdicao, setFormEdicao] = useState(initialForm);

  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);
  const [detalhesForm, setDetalhesForm] = useState(initialDetalhes);

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
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarCampoEdicao(campo: string, valor: string) {
    setFormEdicao((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarCampoDetalhes(campo: string, valor: string) {
    setDetalhesForm((prev) => ({ ...prev, [campo]: valor }));
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
      responsavel: form.responsavel.trim() || null,
      prazo: form.prazo || null,
      status: "Aberta",
    };

    const { data, error } = await supabase
      .from("ocorrencias")
      .insert([payload])
      .select();

    if (error) {
      console.error("ERRO AO INSERIR:", error);
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
    setModalNovoAberto(false);
    setSalvando(false);
  }

  function abrirEdicao(item: Ocorrencia) {
    setOcorrenciaSelecionada(item);
    setFormEdicao({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      tipo_ocorrencia: item.tipo_ocorrencia || "Não conformidade",
      setor_origem: item.setor_origem || "",
      setor_destino: item.setor_destino || "",
      gravidade: item.gravidade || "Leve",
      responsavel: item.responsavel || "",
      prazo: item.prazo || "",
    });
    setModalEditarAberto(true);
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!ocorrenciaSelecionada) return;

    setErro("");
    setSucesso("");
    setAtualizandoId(ocorrenciaSelecionada.id);

    const { data, error } = await supabase
      .from("ocorrencias")
      .update({
        titulo: formEdicao.titulo.trim(),
        descricao: formEdicao.descricao.trim(),
        tipo_ocorrencia: formEdicao.tipo_ocorrencia,
        setor_origem: formEdicao.setor_origem,
        setor_destino: formEdicao.setor_destino,
        gravidade: formEdicao.gravidade,
        responsavel: formEdicao.responsavel.trim() || null,
        prazo: formEdicao.prazo || null,
      })
      .eq("id", ocorrenciaSelecionada.id)
      .select();

    if (error) {
      console.error("ERRO AO EDITAR:", error);
      setErro("Não foi possível salvar a edição: " + error.message);
      setAtualizandoId(null);
      return;
    }

    if (data && data.length > 0) {
      const atualizada = data[0] as Ocorrencia;
      setOcorrencias((prev) =>
        prev.map((item) => (item.id === atualizada.id ? atualizada : item))
      );
    }

    setSucesso("Ocorrência atualizada com sucesso.");
    setAtualizandoId(null);
    setModalEditarAberto(false);
  }

  async function excluirOcorrencia(id: number) {
    const confirmado = window.confirm("Deseja realmente excluir esta ocorrência?");
    if (!confirmado) return;

    setErro("");
    setSucesso("");
    setExcluindoId(id);

    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);

    if (error) {
      console.error("ERRO AO EXCLUIR:", error);
      setErro("Não foi possível excluir a ocorrência: " + error.message);
      setExcluindoId(null);
      return;
    }

    setOcorrencias((prev) => prev.filter((item) => item.id !== id));
    setSucesso("Ocorrência excluída com sucesso.");
    setExcluindoId(null);
  }

  function abrirDetalhes(item: Ocorrencia) {
    setOcorrenciaSelecionada(item);
    setDetalhesForm({
      acao_imediata: item.acao_imediata || "",
      analise_causa: item.analise_causa || "",
      tratativa: item.tratativa || "",
      validacao_qualidade: item.validacao_qualidade || "",
      what_5w2h: item.what_5w2h || "",
      why_5w2h: item.why_5w2h || "",
      where_5w2h: item.where_5w2h || "",
      when_5w2h: item.when_5w2h || "",
      who_5w2h: item.who_5w2h || "",
      how_5w2h: item.how_5w2h || "",
      how_much_5w2h: item.how_much_5w2h || "",
    });
    setModalDetalhesAberto(true);
  }

  async function salvarDetalhes() {
    if (!ocorrenciaSelecionada) return;

    setErro("");
    setSucesso("");
    setAtualizandoId(ocorrenciaSelecionada.id);

    const { data, error } = await supabase
      .from("ocorrencias")
      .update({
        acao_imediata: detalhesForm.acao_imediata,
        analise_causa: detalhesForm.analise_causa,
        tratativa: detalhesForm.tratativa,
        validacao_qualidade: detalhesForm.validacao_qualidade,
        what_5w2h: detalhesForm.what_5w2h,
        why_5w2h: detalhesForm.why_5w2h,
        where_5w2h: detalhesForm.where_5w2h,
        when_5w2h: detalhesForm.when_5w2h,
        who_5w2h: detalhesForm.who_5w2h,
        how_5w2h: detalhesForm.how_5w2h,
        how_much_5w2h: detalhesForm.how_much_5w2h,
      })
      .eq("id", ocorrenciaSelecionada.id)
      .select();

    if (error) {
      console.error("ERRO AO SALVAR DETALHES:", error);
      setErro("Não foi possível salvar os detalhes: " + error.message);
      setAtualizandoId(null);
      return;
    }

    if (data && data.length > 0) {
      const atualizada = data[0] as Ocorrencia;
      setOcorrencias((prev) =>
        prev.map((item) => (item.id === atualizada.id ? atualizada : item))
      );
      setOcorrenciaSelecionada(atualizada);
    }

    setSucesso("Detalhes atualizados com sucesso.");
    setAtualizandoId(null);
    setModalDetalhesAberto(false);
  }

  function proximoStatusQualidade(statusAtual: StatusOcorrencia): StatusOcorrencia | null {
    if (statusAtual === "Aberta") return "Em análise pela Qualidade";
    if (statusAtual === "Em análise pela Qualidade") return "Direcionada ao setor";
    if (statusAtual === "Aguardando validação") return "Concluída";
    return null;
  }

  function proximoStatusLideranca(statusAtual: StatusOcorrencia): StatusOcorrencia | null {
    if (statusAtual === "Direcionada ao setor") return "Em tratativa";
    if (statusAtual === "Em tratativa") return "Aguardando validação";
    return null;
  }

  function labelAcaoQualidade(statusAtual: StatusOcorrencia): string {
    if (statusAtual === "Aberta") return "Iniciar análise";
    if (statusAtual === "Em análise pela Qualidade") return "Direcionar ao setor";
    if (statusAtual === "Aguardando validação") return "Concluir ocorrência";
    return "Avançar";
  }

  function labelAcaoLideranca(statusAtual: StatusOcorrencia): string {
    if (statusAtual === "Direcionada ao setor") return "Assumir tratativa";
    if (statusAtual === "Em tratativa") return "Enviar para validação";
    return "Atualizar";
  }

  async function atualizarStatus(ocorrencia: Ocorrencia, novoStatus: StatusOcorrencia) {
    setErro("");
    setSucesso("");
    setAtualizandoId(ocorrencia.id);

    const { data, error } = await supabase
      .from("ocorrencias")
      .update({ status: novoStatus })
      .eq("id", ocorrencia.id)
      .select();

    if (error) {
      console.error("ERRO AO ATUALIZAR STATUS:", error);
      setErro("Não foi possível atualizar o status: " + error.message);
      setAtualizandoId(null);
      return;
    }

    if (data && data.length > 0) {
      const atualizada = data[0] as Ocorrencia;
      setOcorrencias((prev) =>
        prev.map((item) => (item.id === atualizada.id ? atualizada : item))
      );
    }

    setSucesso(`Status atualizado para "${novoStatus}".`);
    setAtualizandoId(null);
  }

  function calcularPrazoStatus(prazo?: string | null) {
    if (!prazo) return { label: "Sem prazo", classe: "bg-slate-50 text-slate-700 border-slate-200" };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataPrazo = new Date(`${prazo}T00:00:00`);
    const diff = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
      return { label: "Vencido", classe: "bg-red-50 text-red-700 border-red-200" };
    }

    if (diff <= 3) {
      return { label: "Próximo do vencimento", classe: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    return { label: "No prazo", classe: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  const ocorrenciasBase = useMemo(() => {
    if (perfilVisual === "Qualidade") return ocorrencias;
    return ocorrencias.filter((item) => item.setor_destino === setorLideranca);
  }, [ocorrencias, perfilVisual, setorLideranca]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrenciasBase.filter((item) => {
      const texto = busca.toLowerCase();

      const matchBusca =
        item.titulo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.setor_origem?.toLowerCase().includes(texto) ||
        item.setor_destino?.toLowerCase().includes(texto) ||
        item.responsavel?.toLowerCase().includes(texto);

      const matchStatus = filtroStatus === "Todos" || item.status === filtroStatus;
      const matchSetor =
        filtroSetor === "Todos" ||
        item.setor_origem === filtroSetor ||
        item.setor_destino === filtroSetor;

      return matchBusca && matchStatus && matchSetor;
    });
  }, [ocorrenciasBase, busca, filtroStatus, filtroSetor]);

  const indicadores = useMemo(() => {
    const base = ocorrenciasBase;
    return {
      total: base.length,
      abertas: base.filter((o) => o.status === "Aberta").length,
      emAnalise: base.filter((o) => o.status === "Em análise pela Qualidade").length,
      direcionadas: base.filter((o) => o.status === "Direcionada ao setor").length,
      emTratativa: base.filter((o) => o.status === "Em tratativa").length,
      validacao: base.filter((o) => o.status === "Aguardando validação").length,
      concluidas: base.filter((o) => o.status === "Concluída").length,
      vencidas: base.filter((o) => calcularPrazoStatus(o.prazo).label === "Vencido").length,
    };
  }, [ocorrenciasBase]);

  const dashboardSetor = useMemo(() => {
    const mapa = new Map<string, number>();
    ocorrenciasBase.forEach((item) => {
      const chave = item.setor_destino || "Não informado";
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [ocorrenciasBase]);

  const dashboardGravidade = useMemo(() => {
    const mapa = new Map<string, number>();
    ocorrenciasBase.forEach((item) => {
      const chave = item.gravidade || "Não informada";
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [ocorrenciasBase]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Sistema de Gestão de Qualidade
              </h1>
              <p className="mt-2 text-sm text-slate-600">Gestão de ocorrências hospitalares</p>
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
                onClick={() => setModalNovoAberto(true)}
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

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Perfil visual</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPerfilVisual("Qualidade")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  perfilVisual === "Qualidade"
                    ? "bg-teal-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Qualidade
              </button>

              <button
                type="button"
                onClick={() => setPerfilVisual("Liderança")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  perfilVisual === "Liderança"
                    ? "bg-teal-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Liderança
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Visão operacional</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{perfilVisual}</p>
            <p className="mt-2 text-sm text-slate-600">
              {perfilVisual === "Qualidade"
                ? "Acompanha todas as ocorrências, valida e direciona os fluxos."
                : "Acompanha as ocorrências do setor e executa a tratativa."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Setor da liderança</p>
            <select
              value={setorLideranca}
              onChange={(e) => setSetorLideranca(e.target.value)}
              disabled={perfilVisual !== "Liderança"}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {setores.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
          <CardIndicador titulo="Total" valor={indicadores.total} />
          <CardIndicador titulo="Abertas" valor={indicadores.abertas} />
          <CardIndicador titulo="Em análise" valor={indicadores.emAnalise} />
          <CardIndicador titulo="Direcionadas" valor={indicadores.direcionadas} />
          <CardIndicador titulo="Em tratativa" valor={indicadores.emTratativa} />
          <CardIndicador titulo="Validação" valor={indicadores.validacao} />
          <CardIndicador titulo="Concluídas" valor={indicadores.concluidas} />
          <CardIndicador titulo="Vencidas" valor={indicadores.vencidas} />
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências por setor</h2>
            <div className="mt-4 space-y-3">
              {dashboardSetor.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados.</p>
              ) : (
                dashboardSetor.slice(0, 8).map((item) => (
                  <div key={item.nome} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.nome}</span>
                    <span className="text-sm font-bold text-slate-900">{item.total}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências por gravidade</h2>
            <div className="mt-4 space-y-3">
              {dashboardGravidade.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados.</p>
              ) : (
                dashboardGravidade.map((item) => (
                  <div key={item.nome} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.nome}</span>
                    <span className="text-sm font-bold text-slate-900">{item.total}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Buscar</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Título, descrição, setor ou responsável"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
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
              <label className="mb-2 block text-sm font-medium text-slate-700">Setor</label>
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
            <h2 className="text-lg font-semibold text-slate-900">
              {perfilVisual === "Qualidade" ? "Painel da Qualidade" : `Painel da Liderança — ${setorLideranca}`}
            </h2>
          </div>

          {carregando ? (
            <div className="p-8 text-sm text-slate-500">Carregando...</div>
          ) : ocorrenciasFiltradas.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">Nenhuma ocorrência encontrada.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ocorrenciasFiltradas.map((item) => {
                const proximoQualidade = proximoStatusQualidade(item.status);
                const proximoLideranca = proximoStatusLideranca(item.status);

                const podeQualidade = perfilVisual === "Qualidade" && proximoQualidade !== null;
                const podeLideranca =
                  perfilVisual === "Liderança" &&
                  item.setor_destino === setorLideranca &&
                  proximoLideranca !== null;

                const prazoStatus = calcularPrazoStatus(item.prazo);

                return (
                  <div key={item.id} className="p-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            #{item.id} — {item.titulo}
                          </h3>
                          <BadgeStatus status={item.status} />
                          <BadgeGravidade gravidade={item.gravidade} />
                          <BadgePrazo label={prazoStatus.label} classe={prazoStatus.classe} />
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">{item.descricao}</p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-6">
                          <Info label="Tipo" valor={item.tipo_ocorrencia} />
                          <Info label="Setor origem" valor={item.setor_origem} />
                          <Info label="Setor destino" valor={item.setor_destino} />
                          <Info label="Responsável" valor={item.responsavel || "-"} />
                          <Info label="Prazo" valor={item.prazo ? new Date(`${item.prazo}T00:00:00`).toLocaleDateString("pt-BR") : "-"} />
                          <Info label="Status atual" valor={item.status} />
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <ResumoBloco titulo="Ação imediata" valor={item.acao_imediata} />
                          <ResumoBloco titulo="Análise de causa" valor={item.analise_causa} />
                          <ResumoBloco titulo="Tratativa" valor={item.tratativa} />
                          <ResumoBloco titulo="Validação da Qualidade" valor={item.validacao_qualidade} />
                        </div>
                      </div>

                      <div className="w-full xl:w-[320px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-800">Ações da ocorrência</p>

                          <div className="mt-4 space-y-3">
                            <button
                              type="button"
                              onClick={() => abrirDetalhes(item)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Abrir tratativa / 5W2H
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirEdicao(item)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Editar ocorrência
                            </button>

                            {podeQualidade && proximoQualidade && (
                              <button
                                type="button"
                                disabled={atualizandoId === item.id}
                                onClick={() => atualizarStatus(item, proximoQualidade)}
                                className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {atualizandoId === item.id ? "Atualizando..." : labelAcaoQualidade(item.status)}
                              </button>
                            )}

                            {podeLideranca && proximoLideranca && (
                              <button
                                type="button"
                                disabled={atualizandoId === item.id}
                                onClick={() => atualizarStatus(item, proximoLideranca)}
                                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {atualizandoId === item.id ? "Atualizando..." : labelAcaoLideranca(item.status)}
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={excluindoId === item.id}
                              onClick={() => excluirOcorrencia(item.id)}
                              className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {excluindoId === item.id ? "Excluindo..." : "Excluir ocorrência"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalNovoAberto && (
        <ModalBase
          titulo="Nova ocorrência"
          subtitulo="Cadastro de ocorrência"
          onClose={() => setModalNovoAberto(false)}
        >
          <form onSubmit={criarOcorrencia} className="p-6">
            <FormularioOcorrencia
              form={form}
              onChange={atualizarCampo}
            />

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
                  onClick={() => setModalNovoAberto(false)}
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
        </ModalBase>
      )}

      {modalEditarAberto && ocorrenciaSelecionada && (
        <ModalBase
          titulo={`Editar ocorrência #${ocorrenciaSelecionada.id}`}
          subtitulo="Atualização de dados principais"
          onClose={() => setModalEditarAberto(false)}
        >
          <form onSubmit={salvarEdicao} className="p-6">
            <FormularioOcorrencia
              form={formEdicao}
              onChange={atualizarCampoEdicao}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalEditarAberto(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={atualizandoId === ocorrenciaSelecionada.id}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {atualizandoId === ocorrenciaSelecionada.id ? "Salvando..." : "Salvar edição"}
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {modalDetalhesAberto && ocorrenciaSelecionada && (
        <ModalBase
          titulo={`Ocorrência #${ocorrenciaSelecionada.id}`}
          subtitulo="Tratativa, análise e plano 5W2H"
          onClose={() => setModalDetalhesAberto(false)}
          large
        >
          <div className="p-6">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{ocorrenciaSelecionada.titulo}</h3>
                <BadgeStatus status={ocorrenciaSelecionada.status} />
                <BadgeGravidade gravidade={ocorrenciaSelecionada.gravidade} />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{ocorrenciaSelecionada.descricao}</p>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <CampoTextarea
                  label="Ação imediata"
                  value={detalhesForm.acao_imediata}
                  onChange={(v) => atualizarCampoDetalhes("acao_imediata", v)}
                  placeholder="Descreva a contenção inicial adotada."
                />

                <CampoTextarea
                  label="Análise de causa"
                  value={detalhesForm.analise_causa}
                  onChange={(v) => atualizarCampoDetalhes("analise_causa", v)}
                  placeholder="Descreva a causa identificada."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <CampoTextarea
                  label="Tratativa"
                  value={detalhesForm.tratativa}
                  onChange={(v) => atualizarCampoDetalhes("tratativa", v)}
                  placeholder="Descreva a tratativa executada."
                />

                <CampoTextarea
                  label="Validação da Qualidade"
                  value={detalhesForm.validacao_qualidade}
                  onChange={(v) => atualizarCampoDetalhes("validacao_qualidade", v)}
                  placeholder="Registrar a avaliação final."
                />
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Plano 5W2H</h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <CampoTexto
                    label="What (O que será feito)"
                    value={detalhesForm.what_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("what_5w2h", v)}
                    placeholder="Ex.: Revisar protocolo"
                  />

                  <CampoTexto
                    label="Why (Por que)"
                    value={detalhesForm.why_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("why_5w2h", v)}
                    placeholder="Ex.: Reduzir recorrência"
                  />

                  <CampoTexto
                    label="Where (Onde)"
                    value={detalhesForm.where_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("where_5w2h", v)}
                    placeholder="Ex.: Centro Cirúrgico"
                  />

                  <CampoTexto
                    label="When (Quando)"
                    value={detalhesForm.when_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("when_5w2h", v)}
                    placeholder="Ex.: Até 20/04/2026"
                  />

                  <CampoTexto
                    label="Who (Quem)"
                    value={detalhesForm.who_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("who_5w2h", v)}
                    placeholder="Ex.: Enfermeiro líder"
                  />

                  <CampoTexto
                    label="How (Como)"
                    value={detalhesForm.how_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("how_5w2h", v)}
                    placeholder="Ex.: Treinamento e revisão"
                  />

                  <CampoTexto
                    label="How much (Quanto custa)"
                    value={detalhesForm.how_much_5w2h}
                    onChange={(v) => atualizarCampoDetalhes("how_much_5w2h", v)}
                    placeholder="Ex.: Sem custo adicional"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalDetalhesAberto(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={atualizandoId === ocorrenciaSelecionada.id}
                onClick={salvarDetalhes}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {atualizandoId === ocorrenciaSelecionada.id ? "Salvando..." : "Salvar detalhes"}
              </button>
            </div>
          </div>
        </ModalBase>
      )}
    </main>
  );
}

function ModalBase({
  titulo,
  subtitulo,
  onClose,
  children,
  large = false,
}: {
  titulo: string;
  subtitulo: string;
  onClose: () => void;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
      <div className={`mx-auto w-full ${large ? "max-w-5xl" : "max-w-3xl"} rounded-3xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
            <p className="text-sm text-slate-500">{subtitulo}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormularioOcorrencia({
  form,
  onChange,
}: {
  form: {
    titulo: string;
    descricao: string;
    tipo_ocorrencia: string;
    setor_origem: string;
    setor_destino: string;
    gravidade: string;
    responsavel: string;
    prazo: string;
  };
  onChange: (campo: string, valor: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <CampoTexto
          label="Título *"
          value={form.titulo}
          onChange={(v) => onChange("titulo", v)}
          placeholder="Digite o título"
        />

        <CampoSelect
          label="Tipo de ocorrência *"
          value={form.tipo_ocorrencia}
          onChange={(v) => onChange("tipo_ocorrencia", v)}
          options={tipos}
        />
      </div>

      <CampoTextarea
        label="Descrição *"
        value={form.descricao}
        onChange={(v) => onChange("descricao", v)}
        placeholder="Descreva a ocorrência"
      />

      <div className="grid gap-5 md:grid-cols-2">
        <CampoSelect
          label="Setor de origem *"
          value={form.setor_origem}
          onChange={(v) => onChange("setor_origem", v)}
          options={setores}
          placeholder="Selecione"
        />

        <CampoSelect
          label="Setor de destino *"
          value={form.setor_destino}
          onChange={(v) => onChange("setor_destino", v)}
          options={setores}
          placeholder="Selecione"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <CampoSelect
          label="Gravidade *"
          value={form.gravidade}
          onChange={(v) => onChange("gravidade", v)}
          options={gravidades}
        />

        <CampoTexto
          label="Responsável"
          value={form.responsavel}
          onChange={(v) => onChange("responsavel", v)}
          placeholder="Ex.: Enfermeiro líder"
        />

        <CampoData
          label="Prazo"
          value={form.prazo}
          onChange={(v) => onChange("prazo", v)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Status inicial</label>
        <input
          value="Aberta"
          disabled
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
        />
      </div>
    </div>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{valor || "-"}</p>
    </div>
  );
}

function ResumoBloco({
  titulo,
  valor,
}: {
  titulo: string;
  valor?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {valor && valor.trim() ? valor : "Não preenchido."}
      </p>
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

  return <span className={`${base} ${styles[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{status}</span>;
}

function BadgeGravidade({ gravidade }: { gravidade: string }) {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold border";
  const styles: Record<string, string> = {
    Leve: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderada: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Grave: "bg-orange-50 text-orange-700 border-orange-200",
    Crítica: "bg-red-50 text-red-700 border-red-200",
  };

  return <span className={`${base} ${styles[gravidade] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{gravidade}</span>;
}

function BadgePrazo({ label, classe }: { label: string; classe: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${classe}`}>{label}</span>;
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

function CampoData({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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