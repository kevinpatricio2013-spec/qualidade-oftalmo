"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { supabase } from "../../../src/lib/supabase";

type Ocorrencia = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  status: string | null;
  resposta_lideranca: string | null;
  data_resposta_lideranca: string | null;
  validado_qualidade: boolean | null;
  data_validacao_qualidade: string | null;
  observacao_qualidade: string | null;
  encaminhado_por_qualidade: string | null;
  prazo_dias: number | null;
  data_limite: string | null;
  concluido_em: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

const SETORES = [
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

function traduzirStatus(status?: string | null) {
  switch (status) {
    case "EM_ANALISE_QUALIDADE":
      return "Em análise pela Qualidade";
    case "DIRECIONADA":
      return "Direcionada para Liderança";
    case "EM_TRATATIVA":
      return "Em tratativa pela Liderança";
    case "AGUARDANDO_VALIDACAO":
      return "Aguardando validação da Qualidade";
    case "CONCLUIDA":
      return "Encerrada";
    default:
      return status || "Não definido";
  }
}

function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleString("pt-BR");
}

function formatarDataCurta(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function statusClasses(status?: string | null) {
  switch (status) {
    case "EM_ANALISE_QUALIDADE":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "DIRECIONADA":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "EM_TRATATIVA":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "AGUARDANDO_VALIDACAO":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CONCLUIDA":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function gravidadeClasses(gravidade?: string | null) {
  const valor = gravidade?.toLowerCase();

  if (
    valor?.includes("alta") ||
    valor?.includes("grave") ||
    valor?.includes("crítica") ||
    valor?.includes("critica")
  ) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (valor?.includes("média") || valor?.includes("media")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (valor?.includes("baixa")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function calcularDiasEmAberto(dataCriacao?: string | null) {
  if (!dataCriacao) return 0;

  const inicio = new Date(dataCriacao).getTime();
  const agora = Date.now();
  const diferenca = agora - inicio;

  return Math.max(0, Math.floor(diferenca / (1000 * 60 * 60 * 24)));
}

function verificarSlaVencido(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return false;
  if (ocorrencia.status === "CONCLUIDA") return false;

  return new Date(ocorrencia.data_limite).getTime() < Date.now();
}

function calcularDiasAtraso(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return 0;
  if (!verificarSlaVencido(ocorrencia)) return 0;

  const limite = new Date(ocorrencia.data_limite).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - limite) / (1000 * 60 * 60 * 24)));
}

export default function QualidadePage() {
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState("TODAS");
  const [somenteVencidas, setSomenteVencidas] = useState(false);

  const [setoresSelecionados, setSetoresSelecionados] = useState<Record<string, string>>({});
  const [prazosSelecionados, setPrazosSelecionados] = useState<Record<string, string>>({});
  const [observacoesQualidade, setObservacoesQualidade] = useState<Record<string, string>>({});

  async function carregarDados() {
    setLoading(true);
    setErro(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfilData) {
        setErro("Perfil não encontrado.");
        setLoading(false);
        return;
      }

      setPerfil(perfilData as Profile);

      const role = (perfilData.role || "").toUpperCase();
      if (role !== "QUALIDADE" && role !== "DIRETORIA") {
        setErro("Acesso permitido somente para Qualidade ou Diretoria.");
        setLoading(false);
        return;
      }

      const { data: ocorrenciasData, error: ocorrenciasError } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("created_at", { ascending: false });

      if (ocorrenciasError) {
        throw ocorrenciasError;
      }

      const lista = (ocorrenciasData as Ocorrencia[]) || [];
      setOcorrencias(lista);

      const setoresIniciais: Record<string, string> = {};
      const prazosIniciais: Record<string, string> = {};
      const observacoesIniciais: Record<string, string> = {};

      for (const item of lista) {
        setoresIniciais[item.id] = item.setor_responsavel || "";
        prazosIniciais[item.id] = item.prazo_dias ? String(item.prazo_dias) : "3";
        observacoesIniciais[item.id] = item.observacao_qualidade || "";
      }

      setSetoresSelecionados(setoresIniciais);
      setPrazosSelecionados(prazosIniciais);
      setObservacoesQualidade(observacoesIniciais);
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao carregar ocorrências.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emAnalise = ocorrencias.filter((o) => o.status === "EM_ANALISE_QUALIDADE").length;
    const direcionadas = ocorrencias.filter((o) => o.status === "DIRECIONADA").length;
    const emTratativa = ocorrencias.filter((o) => o.status === "EM_TRATATIVA").length;
    const aguardandoValidacao = ocorrencias.filter((o) => o.status === "AGUARDANDO_VALIDACAO").length;
    const concluidas = ocorrencias.filter((o) => o.status === "CONCLUIDA").length;
    const vencidas = ocorrencias.filter((o) => verificarSlaVencido(o)).length;

    return {
      total,
      emAnalise,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
      concluidas,
      vencidas,
    };
  }, [ocorrencias]);

  const setoresDisponiveis = useMemo(() => {
    const valores = new Set<string>();

    ocorrencias.forEach((item) => {
      if (item.setor_responsavel) valores.add(item.setor_responsavel);
      if (item.setor_origem) valores.add(item.setor_origem);
    });

    return Array.from(valores).sort((a, b) => a.localeCompare(b));
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const termo = busca.trim().toLowerCase();

      const bateBusca =
        termo.length === 0 ||
        item.titulo?.toLowerCase().includes(termo) ||
        item.descricao?.toLowerCase().includes(termo) ||
        item.setor_origem?.toLowerCase().includes(termo) ||
        item.setor_responsavel?.toLowerCase().includes(termo) ||
        item.tipo_ocorrencia?.toLowerCase().includes(termo);

      const bateStatus = filtroStatus === "TODOS" || item.status === filtroStatus;

      const bateSetor =
        filtroSetor === "TODOS" ||
        item.setor_responsavel === filtroSetor ||
        item.setor_origem === filtroSetor;

      const gravidade = item.gravidade?.toLowerCase() || "";
      const bateGravidade =
        filtroGravidade === "TODAS" ||
        (filtroGravidade === "ALTA" &&
          (gravidade.includes("alta") ||
            gravidade.includes("grave") ||
            gravidade.includes("crítica") ||
            gravidade.includes("critica"))) ||
        (filtroGravidade === "MEDIA" &&
          (gravidade.includes("média") || gravidade.includes("media"))) ||
        (filtroGravidade === "BAIXA" && gravidade.includes("baixa"));

      const bateVencida = !somenteVencidas || verificarSlaVencido(item);

      return bateBusca && bateStatus && bateSetor && bateGravidade && bateVencida;
    });
  }, [ocorrencias, busca, filtroStatus, filtroSetor, filtroGravidade, somenteVencidas]);

  async function direcionarOcorrencia(ocorrencia: Ocorrencia) {
    const setor = setoresSelecionados[ocorrencia.id];
    const prazo = prazosSelecionados[ocorrencia.id];

    if (!setor) {
      setErro("Selecione o setor responsável antes de direcionar.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvandoId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          setor_responsavel: setor,
          prazo_dias: prazo ? Number(prazo) : null,
          encaminhado_por_qualidade: perfil?.nome || "Qualidade",
          status: "DIRECIONADA",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ocorrencia.id);

      if (error) throw error;

      setSucesso("Ocorrência direcionada com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao direcionar ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function validarOcorrencia(ocorrencia: Ocorrencia) {
    setErro(null);
    setSucesso(null);
    setSalvandoId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          validado_qualidade: true,
          data_validacao_qualidade: new Date().toISOString(),
          observacao_qualidade: observacoesQualidade[ocorrencia.id] || null,
          status: "CONCLUIDA",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ocorrencia.id);

      if (error) throw error;

      setSucesso("Ocorrência validada e encerrada com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error?.message || "Erro ao validar ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">Carregando painel da Qualidade...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                Gestão da Qualidade
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Central da Qualidade
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Tela operacional para triagem, direcionamento, acompanhamento do SLA e validação final das ocorrências.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Usuário atual</p>
              <p className="text-sm font-semibold text-slate-900">
                {perfil?.nome || "Qualidade"}
              </p>
              <p className="text-xs text-slate-600">
                {perfil?.role || "Perfil"} {perfil?.setor ? `• ${perfil.setor}` : ""}
              </p>
            </div>
          </div>
        </section>

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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardIndicador
            titulo="Total de ocorrências"
            valor={indicadores.total}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Em análise"
            valor={indicadores.emAnalise}
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="Aguardando validação"
            valor={indicadores.aguardandoValidacao}
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <CardIndicador
            titulo="SLA vencido"
            valor={indicadores.vencidas}
            icon={<Siren className="h-5 w-5" />}
            destaque
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Filtros operacionais</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Busca
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por título, descrição, setor ou tipo..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="TODOS">Todos</option>
                <option value="EM_ANALISE_QUALIDADE">Em análise</option>
                <option value="DIRECIONADA">Direcionada</option>
                <option value="EM_TRATATIVA">Em tratativa</option>
                <option value="AGUARDANDO_VALIDACAO">Aguardando validação</option>
                <option value="CONCLUIDA">Encerrada</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Setor
              </label>
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="TODOS">Todos</option>
                {setoresDisponiveis.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gravidade
              </label>
              <select
                value={filtroGravidade}
                onChange={(e) => setFiltroGravidade(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="TODAS">Todas</option>
                <option value="ALTA">Alta / Grave</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={somenteVencidas}
                onChange={(e) => setSomenteVencidas(e.target.checked)}
                className="h-4 w-4"
              />
              Mostrar somente vencidas
            </label>

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              {ocorrenciasFiltradas.length} ocorrência(s) encontrada(s)
            </span>
          </div>
        </section>

        <section className="space-y-4">
          {ocorrenciasFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Nenhuma ocorrência encontrada com os filtros selecionados.
              </p>
            </div>
          ) : (
            ocorrenciasFiltradas.map((ocorrencia) => {
              const slaVencido = verificarSlaVencido(ocorrencia);
              const podeDirecionar = ocorrencia.status === "EM_ANALISE_QUALIDADE";
              const podeValidar = ocorrencia.status === "AGUARDANDO_VALIDACAO";

              return (
                <div
                  key={ocorrencia.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(ocorrencia.status)}`}>
                          {traduzirStatus(ocorrencia.status)}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gravidadeClasses(ocorrencia.gravidade)}`}>
                          {ocorrencia.gravidade || "Sem gravidade"}
                        </span>

                        {slaVencido && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            SLA vencido
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {ocorrencia.titulo}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {ocorrencia.descricao || "Sem descrição informada."}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                          label="Tipo"
                          value={ocorrencia.tipo_ocorrencia || "Não informado"}
                        />
                        <InfoBox
                          label="Setor de origem"
                          value={ocorrencia.setor_origem || "Não informado"}
                        />
                        <InfoBox
                          label="Setor responsável"
                          value={ocorrencia.setor_responsavel || "Aguardando direcionamento"}
                        />
                        <InfoBox
                          label="Dias em aberto"
                          value={`${calcularDiasEmAberto(ocorrencia.created_at)} dia(s)`}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                          label="Data de abertura"
                          value={formatarDataCurta(ocorrencia.created_at)}
                        />
                        <InfoBox
                          label="Prazo"
                          value={
                            ocorrencia.prazo_dias
                              ? `${ocorrencia.prazo_dias} dia(s)`
                              : "Não definido"
                          }
                        />
                        <InfoBox
                          label="Data limite"
                          value={formatarDataCurta(ocorrencia.data_limite)}
                        />
                        <InfoBox
                          label="Atraso"
                          value={
                            slaVencido
                              ? `${calcularDiasAtraso(ocorrencia)} dia(s)`
                              : "Dentro do prazo"
                          }
                          destaque={slaVencido}
                        />
                      </div>

                      {ocorrencia.resposta_lideranca && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Resposta da liderança
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {ocorrencia.resposta_lideranca}
                          </p>
                          {ocorrencia.data_resposta_lideranca && (
                            <p className="mt-2 text-xs text-slate-500">
                              Registrado em {formatarData(ocorrencia.data_resposta_lideranca)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-full xl:max-w-md">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Ações da Qualidade
                        </p>

                        {podeDirecionar && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Setor responsável
                              </label>
                              <select
                                value={setoresSelecionados[ocorrencia.id] || ""}
                                onChange={(e) =>
                                  setSetoresSelecionados((prev) => ({
                                    ...prev,
                                    [ocorrencia.id]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
                              >
                                <option value="">Selecione</option>
                                {SETORES.map((setor) => (
                                  <option key={setor} value={setor}>
                                    {setor}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Prazo em dias
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={prazosSelecionados[ocorrencia.id] || "3"}
                                onChange={(e) =>
                                  setPrazosSelecionados((prev) => ({
                                    ...prev,
                                    [ocorrencia.id]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
                              />
                            </div>

                            <button
                              onClick={() => direcionarOcorrencia(ocorrencia)}
                              disabled={salvandoId === ocorrencia.id}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Direcionando...
                                </>
                              ) : (
                                <>
                                  Direcionar ocorrência
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {podeValidar && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observação da Qualidade
                              </label>
                              <textarea
                                rows={5}
                                value={observacoesQualidade[ocorrencia.id] || ""}
                                onChange={(e) =>
                                  setObservacoesQualidade((prev) => ({
                                    ...prev,
                                    [ocorrencia.id]: e.target.value,
                                  }))
                                }
                                placeholder="Descreva a validação final da Qualidade..."
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            </div>

                            <button
                              onClick={() => validarOcorrencia(ocorrencia)}
                              disabled={salvandoId === ocorrencia.id}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {salvandoId === ocorrencia.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Validando...
                                </>
                              ) : (
                                <>
                                  Validar e encerrar
                                  <CheckCircle2 className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {!podeDirecionar && !podeValidar && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm leading-6 text-slate-600">
                              Esta ocorrência está em acompanhamento. A ação principal neste momento está vinculada ao fluxo atual.
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/ocorrencia/${ocorrencia.id}`}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Ver detalhe completo
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function CardIndicador({
  titulo,
  valor,
  icon,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            destaque ? "bg-white text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {icon}
        </div>

        <span className={`text-3xl font-bold ${destaque ? "text-red-700" : "text-slate-900"}`}>
          {valor}
        </span>
      </div>

      <p className={`mt-4 text-sm font-semibold ${destaque ? "text-red-700" : "text-slate-900"}`}>
        {titulo}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  destaque = false,
}: {
  label: string;
  value: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${destaque ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-sm font-medium ${destaque ? "text-red-700" : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}