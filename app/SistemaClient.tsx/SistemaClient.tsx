"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from './lib/supabase'

type StatusOcorrencia =
  | "aberta"
  | "em_triagem_qualidade"
  | "direcionada_ao_setor"
  | "em_analise"
  | "plano_de_acao"
  | "aguardando_validacao_qualidade"
  | "encerrada"
  | "reaberta"
  | "cancelada";

type TipoRegistro =
  | "nao_conformidade"
  | "ocorrencia"
  | "evento_adverso"
  | "quase_falha"
  | "reclamacao";

type Severidade = "leve" | "moderada" | "grave" | "sentinela" | "";
type ModoAbertura = "anonima" | "identificada";
type DecisaoValidacao = "pendente" | "aprovado" | "reabrir";
type ForcaIntervencao = "fraca" | "intermediaria" | "forte";

type Setor = {
  id: string;
  nome: string;
};

type RelacaoSetor = {
  nome: string;
} | null;

type Ocorrencia = {
  id: number;
  codigo: string | null;
  titulo: string;
  descricao: string;
  tipo_registro: TipoRegistro;
  modo_abertura: ModoAbertura;
  status: StatusOcorrencia;
  severidade: Severidade;
  created_at: string;
  updated_at: string;
  data_ocorrencia: string | null;
  prazo_tratativa: string | null;
  paciente_nome: string | null;
  prontuario: string | null;
  local_ocorrencia: string | null;
  triagem_observacoes: string | null;
  observacao_validacao: string | null;
  decisao_validacao: DecisaoValidacao;
  recebido_qualidade_em: string | null;
  triado_por_qualidade_id: string | null;
  validado_qualidade_em: string | null;
  setor_origem_id: string | null;
  setor_destino_id: string | null;
  aberta_por_setor_id: string | null;
  setor_origem?: RelacaoSetor;
  setor_destino?: RelacaoSetor;
  setor_abertura?: RelacaoSetor;
};

type Tratativa = {
  id: number;
  ocorrencia_id: number;
  descricao: string;
  created_at: string;
};

type AnaliseCausaRaiz = {
  id?: number;
  ocorrencia_id: number;
  problema_descrito: string | null;
  causa_imediata: string | null;
  causa_raiz: string | null;
  fatores_contribuintes: string | null;
  barreiras_falhas: string | null;
};

type ProtocoloLondres = {
  id?: number;
  ocorrencia_id: number;
  resumo_evento: string | null;
  fatores_paciente: string | null;
  fatores_tarefa_tecnologia: string | null;
  fatores_profissional: string | null;
  fatores_equipe: string | null;
  fatores_ambiente: string | null;
  fatores_organizacionais: string | null;
  fatores_institucionais: string | null;
};

type BowTie = {
  id?: number;
  ocorrencia_id: number;
  perigo: string | null;
  evento_topo: string | null;
  consequencias: string | null;
  ameacas: string | null;
  barreiras_preventivas: string | null;
  barreiras_mitigadoras: string | null;
};

type Plano5W3H = {
  id: number;
  ocorrencia_id: number;
  what_acao: string;
  why_motivo: string | null;
  where_local: string | null;
  when_prazo: string | null;
  who_responsavel: string | null;
  how_como: string | null;
  how_much_custo: number | null;
  how_many_quantidade: string | null;
  concluido: boolean;
  observacao_conclusao: string | null;
};

type ForcaIntervencaoItem = {
  id: number;
  ocorrencia_id: number;
  descricao_acao: string;
  classificacao: ForcaIntervencao;
  justificativa: string | null;
};

const STATUS_LABEL: Record<StatusOcorrencia, string> = {
  aberta: "Aberta",
  em_triagem_qualidade: "Em triagem pela Qualidade",
  direcionada_ao_setor: "Direcionada ao setor",
  em_analise: "Em análise",
  plano_de_acao: "Plano de ação",
  aguardando_validacao_qualidade: "Aguardando validação da Qualidade",
  encerrada: "Encerrada",
  reaberta: "Reaberta",
  cancelada: "Cancelada",
};

const PERFIS_DEMO = [
  { value: "qualidade", label: "Qualidade" },
  { value: "lider_setor", label: "Líder de setor" },
  { value: "diretoria", label: "Diretoria" },
  { value: "anonimo", label: "Abertura anônima" },
] as const;

export default function SistemaOcorrenciasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [perfilVisual, setPerfilVisual] = useState<
    "qualidade" | "lider_setor" | "diretoria" | "anonimo"
  >("qualidade");

  const [setores, setSetores] = useState<Setor[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [selecionada, setSelecionada] = useState<Ocorrencia | null>(null);

  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [analise, setAnalise] = useState<AnaliseCausaRaiz | null>(null);
  const [londres, setLondres] = useState<ProtocoloLondres | null>(null);
  const [bowTie, setBowTie] = useState<BowTie | null>(null);
  const [planos, setPlanos] = useState<Plano5W3H[]>([]);
  const [forcas, setForcas] = useState<ForcaIntervencaoItem[]>([]);

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroSetorDestino, setFiltroSetorDestino] = useState("");

  const [novaOcorrencia, setNovaOcorrencia] = useState({
    tipo_registro: "nao_conformidade" as TipoRegistro,
    titulo: "",
    descricao: "",
    modo_abertura: "anonima" as ModoAbertura,
    paciente_nome: "",
    prontuario: "",
    data_ocorrencia: "",
    local_ocorrencia: "",
    aberta_por_setor_id: "",
    setor_origem_id: "",
    severidade: "" as Severidade,
    prazo_tratativa: "",
  });

  const [triagem, setTriagem] = useState({
    setor_destino_id: "",
    triagem_observacoes: "",
  });

  const [novaTratativa, setNovaTratativa] = useState("");
  const [novoPlano, setNovoPlano] = useState({
    what_acao: "",
    why_motivo: "",
    where_local: "",
    when_prazo: "",
    who_responsavel: "",
    how_como: "",
    how_much_custo: "",
    how_many_quantidade: "",
  });

  const [novaForca, setNovaForca] = useState({
    descricao_acao: "",
    classificacao: "intermediaria" as ForcaIntervencao,
    justificativa: "",
  });

  async function carregarDadosIniciais() {
    try {
      setLoading(true);
      setErro("");

      const { data: setoresData, error: setoresError } = await supabase
        .from("setores")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (setoresError) throw setoresError;

      setSetores(setoresData || []);
      await carregarOcorrencias();
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarOcorrencias() {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select(`
        id,
        codigo,
        titulo,
        descricao,
        tipo_registro,
        modo_abertura,
        status,
        severidade,
        created_at,
        updated_at,
        data_ocorrencia,
        prazo_tratativa,
        paciente_nome,
        prontuario,
        local_ocorrencia,
        triagem_observacoes,
        observacao_validacao,
        decisao_validacao,
        recebido_qualidade_em,
        triado_por_qualidade_id,
        validado_qualidade_em,
        setor_origem_id,
        setor_destino_id,
        aberta_por_setor_id,
        setor_origem:setor_origem_id ( nome ),
        setor_destino:setor_destino_id ( nome ),
        setor_abertura:aberta_por_setor_id ( nome )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const lista = (data || []) as unknown as Ocorrencia[];
    setOcorrencias(lista);

    if (selecionada) {
      const atualizada = lista.find((item) => item.id === selecionada.id) || null;
      setSelecionada(atualizada);

      if (atualizada) {
        await carregarDetalhesOcorrencia(atualizada.id);
      }
    }
  }

  async function carregarDetalhesOcorrencia(ocorrenciaId: number) {
    const [
      tratativasRes,
      analiseRes,
      londresRes,
      bowTieRes,
      planosRes,
      forcasRes,
    ] = await Promise.all([
      supabase
        .from("tratativas_ocorrencia")
        .select("id, ocorrencia_id, descricao, created_at")
        .eq("ocorrencia_id", ocorrenciaId)
        .order("created_at", { ascending: false }),

      supabase
        .from("analise_causa_raiz")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId)
        .maybeSingle(),

      supabase
        .from("protocolo_londres_ocorrencia")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId)
        .maybeSingle(),

      supabase
        .from("bow_tie_ocorrencia")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId)
        .maybeSingle(),

      supabase
        .from("plano_acao_5w3h")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId)
        .order("created_at", { ascending: false }),

      supabase
        .from("forca_intervencao_ocorrencia")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId)
        .order("created_at", { ascending: false }),
    ]);

    if (tratativasRes.error) throw tratativasRes.error;
    if (analiseRes.error) throw analiseRes.error;
    if (londresRes.error) throw londresRes.error;
    if (bowTieRes.error) throw bowTieRes.error;
    if (planosRes.error) throw planosRes.error;
    if (forcasRes.error) throw forcasRes.error;

    setTratativas((tratativasRes.data || []) as Tratativa[]);
    setAnalise(
      (analiseRes.data as AnaliseCausaRaiz | null) || {
        ocorrencia_id: ocorrenciaId,
        problema_descrito: "",
        causa_imediata: "",
        causa_raiz: "",
        fatores_contribuintes: "",
        barreiras_falhas: "",
      }
    );
    setLondres(
      (londresRes.data as ProtocoloLondres | null) || {
        ocorrencia_id: ocorrenciaId,
        resumo_evento: "",
        fatores_paciente: "",
        fatores_tarefa_tecnologia: "",
        fatores_profissional: "",
        fatores_equipe: "",
        fatores_ambiente: "",
        fatores_organizacionais: "",
        fatores_institucionais: "",
      }
    );
    setBowTie(
      (bowTieRes.data as BowTie | null) || {
        ocorrencia_id: ocorrenciaId,
        perigo: "",
        evento_topo: "",
        consequencias: "",
        ameacas: "",
        barreiras_preventivas: "",
        barreiras_mitigadoras: "",
      }
    );
    setPlanos((planosRes.data || []) as Plano5W3H[]);
    setForcas((forcasRes.data || []) as ForcaIntervencaoItem[]);
  }

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const busca = filtroBusca.trim().toLowerCase();

      const bateBusca =
        !busca ||
        item.titulo?.toLowerCase().includes(busca) ||
        item.descricao?.toLowerCase().includes(busca) ||
        item.codigo?.toLowerCase().includes(busca);

      const bateStatus = !filtroStatus || item.status === filtroStatus;
      const bateSetor =
        !filtroSetorDestino || item.setor_destino_id === filtroSetorDestino;

      if (perfilVisual === "diretoria") return bateBusca && bateStatus && bateSetor;
      if (perfilVisual === "qualidade") return bateBusca && bateStatus && bateSetor;

      if (perfilVisual === "anonimo") {
        return (
          item.modo_abertura === "anonima" &&
          bateBusca &&
          bateStatus &&
          bateSetor
        );
      }

      return bateBusca && bateStatus && bateSetor;
    });
  }, [ocorrencias, filtroBusca, filtroStatus, filtroSetorDestino, perfilVisual]);

  const indicadores = useMemo(() => {
    const total = ocorrenciasFiltradas.length;
    const abertas = ocorrenciasFiltradas.filter((o) => o.status === "aberta").length;
    const triagemCount = ocorrenciasFiltradas.filter(
      (o) => o.status === "em_triagem_qualidade"
    ).length;
    const analiseCount = ocorrenciasFiltradas.filter((o) =>
      ["direcionada_ao_setor", "em_analise", "plano_de_acao"].includes(o.status)
    ).length;
    const encerradas = ocorrenciasFiltradas.filter(
      (o) => o.status === "encerrada"
    ).length;

    return { total, abertas, triagemCount, analiseCount, encerradas };
  }, [ocorrenciasFiltradas]);

  async function criarOcorrencia() {
    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!novaOcorrencia.titulo.trim()) {
        throw new Error("Informe o título.");
      }

      if (!novaOcorrencia.descricao.trim()) {
        throw new Error("Informe a descrição.");
      }

      const payload = {
        tipo_registro: novaOcorrencia.tipo_registro,
        titulo: novaOcorrencia.titulo.trim(),
        descricao: novaOcorrencia.descricao.trim(),
        modo_abertura: novaOcorrencia.modo_abertura,
        paciente_nome: novaOcorrencia.paciente_nome || null,
        prontuario: novaOcorrencia.prontuario || null,
        data_ocorrencia: novaOcorrencia.data_ocorrencia || null,
        local_ocorrencia: novaOcorrencia.local_ocorrencia || null,
        aberta_por_setor_id: novaOcorrencia.aberta_por_setor_id || null,
        setor_origem_id: novaOcorrencia.setor_origem_id || null,
        severidade: novaOcorrencia.severidade || null,
        prazo_tratativa: novaOcorrencia.prazo_tratativa || null,
        recebido_qualidade_em: new Date().toISOString(),
      };

      const { error } = await supabase.from("ocorrencias").insert(payload);

      if (error) throw error;

      setSucesso("Registro salvo com sucesso.");
      setNovaOcorrencia({
        tipo_registro: "nao_conformidade",
        titulo: "",
        descricao: "",
        modo_abertura: "anonima",
        paciente_nome: "",
        prontuario: "",
        data_ocorrencia: "",
        local_ocorrencia: "",
        aberta_por_setor_id: "",
        setor_origem_id: "",
        severidade: "",
        prazo_tratativa: "",
      });

      await carregarOcorrencias();
    } catch (error: any) {
      setErro(error.message || "Erro ao registrar ocorrência.");
    } finally {
      setSaving(false);
    }
  }

  async function abrirDetalhe(item: Ocorrencia) {
    setSelecionada(item);
    setTriagem({
      setor_destino_id: item.setor_destino_id || "",
      triagem_observacoes: item.triagem_observacoes || "",
    });

    try {
      await carregarDetalhesOcorrencia(item.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar detalhes.");
    }
  }

  async function salvarTriagem() {
    if (!selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        recebido_qualidade_em:
          selecionada.recebido_qualidade_em || new Date().toISOString(),
        triado_por_qualidade_id:
          selecionada.triado_por_qualidade_id || "00000000-0000-0000-0000-000000000000",
        setor_destino_id: triagem.setor_destino_id || null,
        triagem_observacoes: triagem.triagem_observacoes || null,
      };

      const { error } = await supabase
        .from("ocorrencias")
        .update(payload)
        .eq("id", selecionada.id);

      if (error) throw error;

      setSucesso("Triagem salva com sucesso.");
      await carregarOcorrencias();
    } catch (error: any) {
      setErro(
        error.message ||
          "Erro ao salvar triagem. Depois podemos trocar o ID fixo pelo usuário autenticado."
      );
    } finally {
      setSaving(false);
    }
  }

  async function salvarAnaliseCausaRaiz() {
    if (!analise || !selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        ocorrencia_id: selecionada.id,
        problema_descrito: analise.problema_descrito || null,
        causa_imediata: analise.causa_imediata || null,
        causa_raiz: analise.causa_raiz || null,
        fatores_contribuintes: analise.fatores_contribuintes || null,
        barreiras_falhas: analise.barreiras_falhas || null,
      };

      const { error } = await supabase
        .from("analise_causa_raiz")
        .upsert(payload, { onConflict: "ocorrencia_id" });

      if (error) throw error;

      setSucesso("Análise de causa raiz salva.");
      await carregarOcorrencias();
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar análise.");
    } finally {
      setSaving(false);
    }
  }

  async function salvarProtocoloLondres() {
    if (!londres || !selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        ocorrencia_id: selecionada.id,
        resumo_evento: londres.resumo_evento || null,
        fatores_paciente: londres.fatores_paciente || null,
        fatores_tarefa_tecnologia: londres.fatores_tarefa_tecnologia || null,
        fatores_profissional: londres.fatores_profissional || null,
        fatores_equipe: londres.fatores_equipe || null,
        fatores_ambiente: londres.fatores_ambiente || null,
        fatores_organizacionais: londres.fatores_organizacionais || null,
        fatores_institucionais: londres.fatores_institucionais || null,
      };

      const { error } = await supabase
        .from("protocolo_londres_ocorrencia")
        .upsert(payload, { onConflict: "ocorrencia_id" });

      if (error) throw error;

      setSucesso("Protocolo de Londres salvo.");
      await carregarOcorrencias();
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar Protocolo de Londres.");
    } finally {
      setSaving(false);
    }
  }

  async function salvarBowTie() {
    if (!bowTie || !selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        ocorrencia_id: selecionada.id,
        perigo: bowTie.perigo || null,
        evento_topo: bowTie.evento_topo || null,
        consequencias: bowTie.consequencias || null,
        ameacas: bowTie.ameacas || null,
        barreiras_preventivas: bowTie.barreiras_preventivas || null,
        barreiras_mitigadoras: bowTie.barreiras_mitigadoras || null,
      };

      const { error } = await supabase
        .from("bow_tie_ocorrencia")
        .upsert(payload, { onConflict: "ocorrencia_id" });

      if (error) throw error;

      setSucesso("Bow Tie salvo.");
      await carregarOcorrencias();
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar Bow Tie.");
    } finally {
      setSaving(false);
    }
  }

  async function adicionarTratativa() {
    if (!selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!novaTratativa.trim()) {
        throw new Error("Digite a tratativa.");
      }

      const { error } = await supabase.from("tratativas_ocorrencia").insert({
        ocorrencia_id: selecionada.id,
        descricao: novaTratativa.trim(),
      });

      if (error) throw error;

      setNovaTratativa("");
      setSucesso("Tratativa adicionada.");
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao adicionar tratativa.");
    } finally {
      setSaving(false);
    }
  }

  async function adicionarPlano5W3H() {
    if (!selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!novoPlano.what_acao.trim()) {
        throw new Error("Informe a ação do 5W3H.");
      }

      const { error } = await supabase.from("plano_acao_5w3h").insert({
        ocorrencia_id: selecionada.id,
        what_acao: novoPlano.what_acao.trim(),
        why_motivo: novoPlano.why_motivo || null,
        where_local: novoPlano.where_local || null,
        when_prazo: novoPlano.when_prazo || null,
        who_responsavel: novoPlano.who_responsavel || null,
        how_como: novoPlano.how_como || null,
        how_much_custo: novoPlano.how_much_custo
          ? Number(novoPlano.how_much_custo)
          : null,
        how_many_quantidade: novoPlano.how_many_quantidade || null,
      });

      if (error) throw error;

      setNovoPlano({
        what_acao: "",
        why_motivo: "",
        where_local: "",
        when_prazo: "",
        who_responsavel: "",
        how_como: "",
        how_much_custo: "",
        how_many_quantidade: "",
      });

      setSucesso("Item do 5W3H adicionado.");
      await carregarOcorrencias();
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao adicionar plano 5W3H.");
    } finally {
      setSaving(false);
    }
  }

  async function concluirPlano(item: Plano5W3H, concluido: boolean) {
    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const { error } = await supabase
        .from("plano_acao_5w3h")
        .update({
          concluido,
          concluido_em: concluido ? new Date().toISOString() : null,
        })
        .eq("id", item.id);

      if (error) throw error;

      setSucesso("Plano atualizado.");
      if (selecionada) {
        await carregarOcorrencias();
        await carregarDetalhesOcorrencia(selecionada.id);
      }
    } catch (error: any) {
      setErro(error.message || "Erro ao atualizar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function adicionarForcaIntervencao() {
    if (!selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!novaForca.descricao_acao.trim()) {
        throw new Error("Informe a ação da força de intervenção.");
      }

      const { error } = await supabase
        .from("forca_intervencao_ocorrencia")
        .insert({
          ocorrencia_id: selecionada.id,
          descricao_acao: novaForca.descricao_acao.trim(),
          classificacao: novaForca.classificacao,
          justificativa: novaForca.justificativa || null,
        });

      if (error) throw error;

      setNovaForca({
        descricao_acao: "",
        classificacao: "intermediaria",
        justificativa: "",
      });

      setSucesso("Força da intervenção registrada.");
      await carregarDetalhesOcorrencia(selecionada.id);
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar força da intervenção.");
    } finally {
      setSaving(false);
    }
  }

  async function validarPelaQualidade(decisao: DecisaoValidacao) {
    if (!selecionada) return;

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          decisao_validacao: decisao,
          validado_qualidade_em: new Date().toISOString(),
          observacao_validacao:
            decisao === "aprovado"
              ? "Validação final aprovada pela Qualidade."
              : "Ocorrência devolvida para reabertura e nova tratativa.",
        })
        .eq("id", selecionada.id);

      if (error) throw error;

      setSucesso(
        decisao === "aprovado"
          ? "Ocorrência validada e encerrada."
          : "Ocorrência reaberta com sucesso."
      );

      await carregarOcorrencias();
    } catch (error: any) {
      setErro(error.message || "Erro ao validar ocorrência.");
    } finally {
      setSaving(false);
    }
  }

  function nomeSetor(id: string | null | undefined) {
    if (!id) return "Não informado";
    return setores.find((s) => s.id === id)?.nome || "Não informado";
  }

  function corStatus(status: StatusOcorrencia) {
    switch (status) {
      case "encerrada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "aguardando_validacao_qualidade":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "plano_de_acao":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "em_analise":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "em_triagem_qualidade":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "cancelada":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "reaberta":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm text-slate-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">
                Gestão de Qualidade
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                Sistema de Gestão de Qualidade
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200">
                Plataforma profissional para gestão de ocorrências, não
                conformidades, eventos adversos e tratativas, com fluxo
                estruturado pela Qualidade, direcionamento por setor, análise e
                validação final.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-100">
                Perfil em visualização
              </label>
              <select
                value={perfilVisual}
                onChange={(e) =>
                  setPerfilVisual(
                    e.target.value as
                      | "qualidade"
                      | "lider_setor"
                      | "diretoria"
                      | "anonimo"
                  )
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
              >
                {PERFIS_DEMO.map((perfil) => (
                  <option
                    key={perfil.value}
                    value={perfil.value}
                    className="text-slate-900"
                  >
                    {perfil.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {erro ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sucesso}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CardIndicador titulo="Total" valor={indicadores.total} />
          <CardIndicador titulo="Abertas" valor={indicadores.abertas} />
          <CardIndicador titulo="Triagem" valor={indicadores.triagemCount} />
          <CardIndicador titulo="Em tratamento" valor={indicadores.analiseCount} />
          <CardIndicador titulo="Encerradas" valor={indicadores.encerradas} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Novo registro da qualidade
                  </h2>
                  <p className="text-sm text-slate-500">
                    Cadastro estruturado de ocorrência, não conformidade ou evento
                    para análise da Qualidade.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <CampoSelect
                    label="Tipo de registro"
                    value={novaOcorrencia.tipo_registro}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        tipo_registro: value as TipoRegistro,
                      }))
                    }
                    options={[
                      ["nao_conformidade", "Não conformidade"],
                      ["ocorrencia", "Ocorrência"],
                      ["evento_adverso", "Evento adverso"],
                      ["quase_falha", "Quase falha"],
                      ["reclamacao", "Reclamação"],
                    ]}
                  />

                  <CampoSelect
                    label="Modo de abertura"
                    value={novaOcorrencia.modo_abertura}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        modo_abertura: value as ModoAbertura,
                      }))
                    }
                    options={[
                      ["anonima", "Anônima"],
                      ["identificada", "Identificada"],
                    ]}
                  />
                </div>

                <CampoTexto
                  label="Título"
                  value={novaOcorrencia.titulo}
                  onChange={(value) =>
                    setNovaOcorrencia((prev) => ({ ...prev, titulo: value }))
                  }
                  placeholder="Ex.: Falha no checklist de cirurgia segura"
                />

                <CampoTextarea
                  label="Descrição"
                  value={novaOcorrencia.descricao}
                  onChange={(value) =>
                    setNovaOcorrencia((prev) => ({ ...prev, descricao: value }))
                  }
                  placeholder="Descreva o fato, contexto, impacto e setor envolvido..."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoSelect
                    label="Setor que abriu"
                    value={novaOcorrencia.aberta_por_setor_id}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        aberta_por_setor_id: value,
                      }))
                    }
                    options={[
                      ["", "Selecione"],
                      ...setores.map((setor) => [setor.id, setor.nome]),
                    ]}
                  />

                  <CampoSelect
                    label="Setor de origem"
                    value={novaOcorrencia.setor_origem_id}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        setor_origem_id: value,
                      }))
                    }
                    options={[
                      ["", "Selecione"],
                      ...setores.map((setor) => [setor.id, setor.nome]),
                    ]}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoSelect
                    label="Severidade"
                    value={novaOcorrencia.severidade}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        severidade: value as Severidade,
                      }))
                    }
                    options={[
                      ["", "Selecione"],
                      ["leve", "Leve"],
                      ["moderada", "Moderada"],
                      ["grave", "Grave"],
                      ["sentinela", "Sentinela"],
                    ]}
                  />

                  <CampoTexto
                    label="Local da ocorrência"
                    value={novaOcorrencia.local_ocorrencia}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        local_ocorrencia: value,
                      }))
                    }
                    placeholder="Ex.: Centro Cirúrgico 2"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoTexto
                    label="Paciente"
                    value={novaOcorrencia.paciente_nome}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        paciente_nome: value,
                      }))
                    }
                    placeholder="Opcional"
                  />

                  <CampoTexto
                    label="Prontuário"
                    value={novaOcorrencia.prontuario}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        prontuario: value,
                      }))
                    }
                    placeholder="Opcional"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoData
                    label="Data da ocorrência"
                    value={novaOcorrencia.data_ocorrencia}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        data_ocorrencia: value,
                      }))
                    }
                  />

                  <CampoData
                    label="Prazo da tratativa"
                    value={novaOcorrencia.prazo_tratativa}
                    onChange={(value) =>
                      setNovaOcorrencia((prev) => ({
                        ...prev,
                        prazo_tratativa: value,
                      }))
                    }
                  />
                </div>

                <button
                  onClick={criarOcorrencia}
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Registrar ocorrência"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Painel da Qualidade
                </h2>
                <p className="text-sm text-slate-500">
                  Visualização, filtros e acompanhamento dos registros para análise
                  completa.
                </p>
              </div>

              <div className="grid gap-3">
                <CampoTexto
                  label="Buscar"
                  value={filtroBusca}
                  onChange={setFiltroBusca}
                  placeholder="Título, descrição ou código"
                />

                <CampoSelect
                  label="Status"
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  options={[
                    ["", "Todos"],
                    ...Object.entries(STATUS_LABEL).map(([value, label]) => [
                      value,
                      label,
                    ]),
                  ]}
                />

                <CampoSelect
                  label="Setor destino"
                  value={filtroSetorDestino}
                  onChange={setFiltroSetorDestino}
                  options={[
                    ["", "Todos"],
                    ...setores.map((setor) => [setor.id, setor.nome]),
                  ]}
                />
              </div>

              <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {ocorrenciasFiltradas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  ocorrenciasFiltradas.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => abrirDetalhe(item)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selecionada?.id === item.id
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {item.codigo || `OC-${item.id}`}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {item.titulo}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${corStatus(
                            item.status
                          )}`}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-600">
                        {item.descricao}
                      </p>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500">
                        <span>
                          <strong>Origem:</strong>{" "}
                          {item.setor_origem?.nome ||
                            nomeSetor(item.setor_origem_id)}
                        </span>
                        <span>
                          <strong>Destino:</strong>{" "}
                          {item.setor_destino?.nome ||
                            nomeSetor(item.setor_destino_id)}
                        </span>
                        <span>
                          <strong>Modo:</strong>{" "}
                          {item.modo_abertura === "anonima"
                            ? "Anônima"
                            : "Identificada"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {!selecionada ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Detalhamento do registro
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Selecione um registro no painel à esquerda para abrir a triagem,
                  análises, plano de ação e validação final.
                </p>
              </section>
            ) : (
              <>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                        {selecionada.codigo || `OC-${selecionada.id}`}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        {selecionada.titulo}
                      </h2>
                      <p className="mt-3 text-sm text-slate-600">
                        {selecionada.descricao}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${corStatus(
                        selecionada.status
                      )}`}
                    >
                      {STATUS_LABEL[selecionada.status]}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Info titulo="Tipo" valor={selecionada.tipo_registro} />
                    <Info
                      titulo="Abertura"
                      valor={
                        selecionada.modo_abertura === "anonima"
                          ? "Anônima"
                          : "Identificada"
                      }
                    />
                    <Info
                      titulo="Setor origem"
                      valor={
                        selecionada.setor_origem?.nome ||
                        nomeSetor(selecionada.setor_origem_id)
                      }
                    />
                    <Info
                      titulo="Setor destino"
                      valor={
                        selecionada.setor_destino?.nome ||
                        nomeSetor(selecionada.setor_destino_id)
                      }
                    />
                    <Info
                      titulo="Paciente"
                      valor={selecionada.paciente_nome || "Não informado"}
                    />
                    <Info
                      titulo="Prontuário"
                      valor={selecionada.prontuario || "Não informado"}
                    />
                    <Info
                      titulo="Local"
                      valor={selecionada.local_ocorrencia || "Não informado"}
                    />
                    <Info
                      titulo="Severidade"
                      valor={selecionada.severidade || "Não informada"}
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Triagem pela Qualidade
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Direcionamento do registro para o setor responsável.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <CampoSelect
                      label="Setor destino"
                      value={triagem.setor_destino_id}
                      onChange={(value) =>
                        setTriagem((prev) => ({
                          ...prev,
                          setor_destino_id: value,
                        }))
                      }
                      options={[
                        ["", "Selecione"],
                        ...setores.map((setor) => [setor.id, setor.nome]),
                      ]}
                    />

                    <CampoTextarea
                      label="Observações da triagem"
                      value={triagem.triagem_observacoes}
                      onChange={(value) =>
                        setTriagem((prev) => ({
                          ...prev,
                          triagem_observacoes: value,
                        }))
                      }
                      placeholder="Descreva avaliação inicial, risco, impacto e encaminhamento..."
                    />

                    <button
                      onClick={salvarTriagem}
                      disabled={saving}
                      className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
                    >
                      Salvar triagem
                    </button>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Análise de causa raiz
                    </h3>
                    <div className="mt-4 grid gap-4">
                      <CampoTextarea
                        label="Problema descrito"
                        value={analise?.problema_descrito || ""}
                        onChange={(value) =>
                          setAnalise((prev) =>
                            prev ? { ...prev, problema_descrito: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Causa imediata"
                        value={analise?.causa_imediata || ""}
                        onChange={(value) =>
                          setAnalise((prev) =>
                            prev ? { ...prev, causa_imediata: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Causa raiz"
                        value={analise?.causa_raiz || ""}
                        onChange={(value) =>
                          setAnalise((prev) =>
                            prev ? { ...prev, causa_raiz: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores contribuintes"
                        value={analise?.fatores_contribuintes || ""}
                        onChange={(value) =>
                          setAnalise((prev) =>
                            prev
                              ? { ...prev, fatores_contribuintes: value }
                              : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Barreiras falhas"
                        value={analise?.barreiras_falhas || ""}
                        onChange={(value) =>
                          setAnalise((prev) =>
                            prev ? { ...prev, barreiras_falhas: value } : prev
                          )
                        }
                      />

                      <button
                        onClick={salvarAnaliseCausaRaiz}
                        disabled={saving}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        Salvar causa raiz
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Protocolo de Londres
                    </h3>
                    <div className="mt-4 grid gap-4">
                      <CampoTextarea
                        label="Resumo do evento"
                        value={londres?.resumo_evento || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev ? { ...prev, resumo_evento: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores do paciente"
                        value={londres?.fatores_paciente || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev ? { ...prev, fatores_paciente: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores da tarefa e tecnologia"
                        value={londres?.fatores_tarefa_tecnologia || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev
                              ? { ...prev, fatores_tarefa_tecnologia: value }
                              : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores do profissional"
                        value={londres?.fatores_profissional || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev
                              ? { ...prev, fatores_profissional: value }
                              : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores da equipe"
                        value={londres?.fatores_equipe || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev ? { ...prev, fatores_equipe: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores do ambiente"
                        value={londres?.fatores_ambiente || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev ? { ...prev, fatores_ambiente: value } : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores organizacionais"
                        value={londres?.fatores_organizacionais || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev
                              ? { ...prev, fatores_organizacionais: value }
                              : prev
                          )
                        }
                      />
                      <CampoTextarea
                        label="Fatores institucionais"
                        value={londres?.fatores_institucionais || ""}
                        onChange={(value) =>
                          setLondres((prev) =>
                            prev
                              ? { ...prev, fatores_institucionais: value }
                              : prev
                          )
                        }
                      />

                      <button
                        onClick={salvarProtocoloLondres}
                        disabled={saving}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        Salvar Protocolo de Londres
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Bow Tie</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <CampoTextarea
                      label="Perigo"
                      value={bowTie?.perigo || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev ? { ...prev, perigo: value } : prev
                        )
                      }
                    />
                    <CampoTextarea
                      label="Evento topo"
                      value={bowTie?.evento_topo || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev ? { ...prev, evento_topo: value } : prev
                        )
                      }
                    />
                    <CampoTextarea
                      label="Ameaças"
                      value={bowTie?.ameacas || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev ? { ...prev, ameacas: value } : prev
                        )
                      }
                    />
                    <CampoTextarea
                      label="Consequências"
                      value={bowTie?.consequencias || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev ? { ...prev, consequencias: value } : prev
                        )
                      }
                    />
                    <CampoTextarea
                      label="Barreiras preventivas"
                      value={bowTie?.barreiras_preventivas || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev
                            ? { ...prev, barreiras_preventivas: value }
                            : prev
                        )
                      }
                    />
                    <CampoTextarea
                      label="Barreiras mitigadoras"
                      value={bowTie?.barreiras_mitigadoras || ""}
                      onChange={(value) =>
                        setBowTie((prev) =>
                          prev
                            ? { ...prev, barreiras_mitigadoras: value }
                            : prev
                        )
                      }
                    />
                  </div>

                  <button
                    onClick={salvarBowTie}
                    disabled={saving}
                    className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    Salvar Bow Tie
                  </button>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tratativas
                    </h3>

                    <div className="mt-4 grid gap-4">
                      <CampoTextarea
                        label="Nova tratativa"
                        value={novaTratativa}
                        onChange={setNovaTratativa}
                        placeholder="Registre evolução, decisão, ação imediata ou devolutiva..."
                      />

                      <button
                        onClick={adicionarTratativa}
                        disabled={saving}
                        className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                      >
                        Adicionar tratativa
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {tratativas.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhuma tratativa lançada.
                        </p>
                      ) : (
                        tratativas.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <p className="text-sm text-slate-700">{item.descricao}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Força da intervenção
                    </h3>

                    <div className="mt-4 grid gap-4">
                      <CampoTextarea
                        label="Descrição da ação"
                        value={novaForca.descricao_acao}
                        onChange={(value) =>
                          setNovaForca((prev) => ({
                            ...prev,
                            descricao_acao: value,
                          }))
                        }
                      />

                      <CampoSelect
                        label="Classificação"
                        value={novaForca.classificacao}
                        onChange={(value) =>
                          setNovaForca((prev) => ({
                            ...prev,
                            classificacao: value as ForcaIntervencao,
                          }))
                        }
                        options={[
                          ["fraca", "Fraca"],
                          ["intermediaria", "Intermediária"],
                          ["forte", "Forte"],
                        ]}
                      />

                      <CampoTextarea
                        label="Justificativa"
                        value={novaForca.justificativa}
                        onChange={(value) =>
                          setNovaForca((prev) => ({
                            ...prev,
                            justificativa: value,
                          }))
                        }
                      />

                      <button
                        onClick={adicionarForcaIntervencao}
                        disabled={saving}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        Salvar força da intervenção
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {forcas.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhuma classificação registrada.
                        </p>
                      ) : (
                        forcas.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.descricao_acao}
                              </p>
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                                {item.classificacao}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {item.justificativa || "Sem justificativa."}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Plano de ação 5W3H
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Estruture a resposta do setor e acompanhe a conclusão.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <CampoTexto
                      label="What"
                      value={novoPlano.what_acao}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({ ...prev, what_acao: value }))
                      }
                      placeholder="Ação"
                    />
                    <CampoTexto
                      label="Why"
                      value={novoPlano.why_motivo}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({ ...prev, why_motivo: value }))
                      }
                      placeholder="Motivo"
                    />
                    <CampoTexto
                      label="Where"
                      value={novoPlano.where_local}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({ ...prev, where_local: value }))
                      }
                      placeholder="Local"
                    />
                    <CampoData
                      label="When"
                      value={novoPlano.when_prazo}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({ ...prev, when_prazo: value }))
                      }
                    />
                    <CampoTexto
                      label="Who"
                      value={novoPlano.who_responsavel}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({
                          ...prev,
                          who_responsavel: value,
                        }))
                      }
                      placeholder="Responsável"
                    />
                    <CampoTexto
                      label="How"
                      value={novoPlano.how_como}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({ ...prev, how_como: value }))
                      }
                      placeholder="Como será feito"
                    />
                    <CampoTexto
                      label="How much"
                      value={novoPlano.how_much_custo}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({
                          ...prev,
                          how_much_custo: value,
                        }))
                      }
                      placeholder="Custo"
                    />
                    <CampoTexto
                      label="How many"
                      value={novoPlano.how_many_quantidade}
                      onChange={(value) =>
                        setNovoPlano((prev) => ({
                          ...prev,
                          how_many_quantidade: value,
                        }))
                      }
                      placeholder="Quantidade"
                    />
                  </div>

                  <button
                    onClick={adicionarPlano5W3H}
                    disabled={saving}
                    className="mt-4 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                  >
                    Adicionar item 5W3H
                  </button>

                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
                      <thead className="bg-slate-100">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
                          <th className="px-4 py-3">Ação</th>
                          <th className="px-4 py-3">Responsável</th>
                          <th className="px-4 py-3">Prazo</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {planos.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-5 text-sm text-slate-500"
                            >
                              Nenhum item do plano cadastrado.
                            </td>
                          </tr>
                        ) : (
                          planos.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {item.what_acao}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {item.who_responsavel || "-"}
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-700">
                                {item.when_prazo
                                  ? new Date(item.when_prazo).toLocaleDateString(
                                      "pt-BR"
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    item.concluido
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {item.concluido ? "Concluído" : "Pendente"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() =>
                                    concluirPlano(item, !item.concluido)
                                  }
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {item.concluido
                                    ? "Marcar pendente"
                                    : "Marcar concluído"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Validação final da Qualidade
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Após análise e conclusão do plano de ação, a Qualidade pode
                    encerrar ou reabrir o registro.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => validarPelaQualidade("aprovado")}
                      disabled={saving}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Aprovar e encerrar
                    </button>

                    <button
                      onClick={() => validarPelaQualidade("reabrir")}
                      disabled={saving}
                      className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                      Reabrir registro
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{valor}</h3>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{valor}</p>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400"
      />
    </div>
  );
}

function CampoTextarea({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400"
      >
        {options.map(([valueOption, labelOption]) => (
          <option key={valueOption + labelOption} value={valueOption}>
            {labelOption}
          </option>
        ))}
      </select>
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400"
      />
    </div>
  );
}