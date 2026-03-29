"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from './lib/supabase'

type Aba =
  | "dashboard"
  | "cadastro"
  | "gestao"
  | "qualidade"
  | "lider";

type Ocorrencia = {
  id: number;
  codigo: string | null;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string | null;
  gravidade: string;
  classificacao: string;
  status: string;
  avaliado_qualidade: boolean;
  encerrada_qualidade: boolean;
  prazo_final: string | null;
  data_ocorrencia: string;
  created_at: string;
  updated_at?: string;
};

type Responsavel = {
  id: number;
  ocorrencia_id: number;
  nome_responsavel: string;
  setor: string;
  funcao: string | null;
  prazo: string | null;
  situacao: string;
  observacao: string | null;
  created_at?: string;
};

type Tratativa = {
  id: number;
  ocorrencia_id: number;
  tipo_tratativa: string;
  descricao: string;
  responsavel: string | null;
  data_tratativa: string;
  created_at?: string;
};

type Plano5W2H = {
  id: number;
  ocorrencia_id: number;
  what_acao: string | null;
  why_motivo: string | null;
  where_local: string | null;
  when_prazo: string | null;
  who_responsavel: string | null;
  how_como: string | null;
  how_much_custo: string | null;
  concluido: boolean;
  observacao: string | null;
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
  "Incidente",
  "Queixa",
  "Reclamação",
  "Falha de processo",
  "Falha assistencial",
  "Desvio de rotina",
  "Oportunidade de melhoria",
];

const gravidades = ["Leve", "Moderada", "Grave", "Sentinela"];

const classificacoes = [
  "Não classificada",
  "Assistencial",
  "Administrativa",
  "Processo",
  "Segurança do paciente",
  "Infraestrutura",
  "Medicamentos / OPME",
  "Documentação",
];

const situacoesResponsavel = ["Pendente", "Em andamento", "Concluído"];

const tiposTratativa = [
  "Registro",
  "Orientação",
  "Ação imediata",
  "Análise",
  "Reunião",
  "Correção",
  "Encaminhamento",
  "Validação",
];

const statusFluxo = [
  "Aberta",
  "Em análise",
  "Em tratativa",
  "Plano de ação ativo",
  "Concluída",
  "Encerrada",
];

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function classStatus(status: string) {
  switch (status) {
    case "Encerrada":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Concluída":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Plano de ação ativo":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Em tratativa":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Em análise":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }
}

function classGravidade(gravidade: string) {
  switch (gravidade) {
    case "Sentinela":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Grave":
      return "bg-red-50 text-red-700 border-red-200";
    case "Moderada":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function Badge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function TituloSecao({
  titulo,
  subtitulo,
  direita,
}: {
  titulo: string;
  subtitulo?: string;
  direita?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-black text-slate-800">{titulo}</h2>
        {subtitulo ? (
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        ) : null}
      </div>
      {direita}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 ${props.className || ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 ${props.className || ""}`}
    />
  );
}

function Botao({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "dark" | "success";
  disabled?: boolean;
}) {
  const base =
    "rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

  const styles = {
    primary: "bg-cyan-700 text-white hover:bg-cyan-800",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
    success: "bg-emerald-700 text-white hover:bg-emerald-800",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function Barra({
  titulo,
  valor,
  total,
}: {
  titulo: string;
  valor: number;
  total: number;
}) {
  const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{titulo}</span>
        <span className="text-slate-500">
          {valor} ({percentual}%)
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full bg-cyan-600"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

function imprimirOcorrencia(
  ocorrencia: Ocorrencia | null,
  responsaveis: Responsavel[],
  tratativas: Tratativa[],
  plano: Plano5W2H | null
) {
  if (!ocorrencia) return;

  const html = `
    <html>
      <head>
        <title>Ocorrência ${ocorrencia.codigo || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; }
          h1,h2,h3 { margin: 0 0 10px 0; }
          .bloco { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .linha { margin-bottom: 8px; }
          .titulo { font-size: 22px; font-weight: bold; margin-bottom: 12px; }
          .sub { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          ul { padding-left: 18px; }
        </style>
      </head>
      <body>
        <div class="titulo">Relatório de Ocorrência ${ocorrencia.codigo || ""}</div>

        <div class="bloco">
          <div class="sub">Dados principais</div>
          <div class="linha"><strong>Título:</strong> ${ocorrencia.titulo}</div>
          <div class="linha"><strong>Descrição:</strong> ${ocorrencia.descricao}</div>
          <div class="linha"><strong>Tipo:</strong> ${ocorrencia.tipo_ocorrencia}</div>
          <div class="linha"><strong>Gravidade:</strong> ${ocorrencia.gravidade}</div>
          <div class="linha"><strong>Classificação:</strong> ${ocorrencia.classificacao}</div>
          <div class="linha"><strong>Status:</strong> ${ocorrencia.status}</div>
          <div class="linha"><strong>Setor origem:</strong> ${ocorrencia.setor_origem}</div>
          <div class="linha"><strong>Setor destino:</strong> ${ocorrencia.setor_destino || "-"}</div>
          <div class="linha"><strong>Data ocorrência:</strong> ${formatarData(ocorrencia.data_ocorrencia)}</div>
          <div class="linha"><strong>Prazo final:</strong> ${formatarData(ocorrencia.prazo_final)}</div>
        </div>

        <div class="bloco">
          <div class="sub">Responsáveis</div>
          ${
            responsaveis.length === 0
              ? "<div>Nenhum responsável vinculado.</div>"
              : `<ul>${responsaveis
                  .map(
                    (r) =>
                      `<li><strong>${r.nome_responsavel}</strong> - ${r.setor} - ${r.situacao} - prazo: ${formatarData(
                        r.prazo
                      )}</li>`
                  )
                  .join("")}</ul>`
          }
        </div>

        <div class="bloco">
          <div class="sub">Tratativas</div>
          ${
            tratativas.length === 0
              ? "<div>Nenhuma tratativa registrada.</div>"
              : `<ul>${tratativas
                  .map(
                    (t) =>
                      `<li><strong>${t.tipo_tratativa}</strong> - ${formatarDataHora(
                        t.data_tratativa
                      )}<br/>${t.descricao}<br/><em>Responsável: ${
                        t.responsavel || "-"
                      }</em></li>`
                  )
                  .join("")}</ul>`
          }
        </div>

        <div class="bloco">
          <div class="sub">Plano 5W2H</div>
          ${
            !plano
              ? "<div>Plano 5W2H não cadastrado.</div>"
              : `
                <div class="linha"><strong>What:</strong> ${plano.what_acao || "-"}</div>
                <div class="linha"><strong>Why:</strong> ${plano.why_motivo || "-"}</div>
                <div class="linha"><strong>Where:</strong> ${plano.where_local || "-"}</div>
                <div class="linha"><strong>When:</strong> ${formatarData(plano.when_prazo)}</div>
                <div class="linha"><strong>Who:</strong> ${plano.who_responsavel || "-"}</div>
                <div class="linha"><strong>How:</strong> ${plano.how_como || "-"}</div>
                <div class="linha"><strong>How much:</strong> ${plano.how_much_custo || "-"}</div>
                <div class="linha"><strong>Observação:</strong> ${plano.observacao || "-"}</div>
                <div class="linha"><strong>Concluído:</strong> ${plano.concluido ? "Sim" : "Não"}</div>
              `
          }
        </div>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export default function SistemaMasterPage() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [planos, setPlanos] = useState<Plano5W2H[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [setorLider, setSetorLider] = useState("Centro Cirúrgico");

  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState<Ocorrencia | null>(null);

  const [formOcorrencia, setFormOcorrencia] = useState({
    titulo: "",
    descricao: "",
    tipo_ocorrencia: "Não conformidade",
    setor_origem: "Qualidade",
    setor_destino: "",
    gravidade: "Leve",
    classificacao: "Não classificada",
    avaliado_qualidade: false,
    encerrada_qualidade: false,
    prazo_final: "",
    data_ocorrencia: new Date().toISOString().slice(0, 10),
  });

  const [formResponsavel, setFormResponsavel] = useState({
    nome_responsavel: "",
    setor: "Qualidade",
    funcao: "",
    prazo: "",
    situacao: "Pendente",
    observacao: "",
  });

  const [formTratativa, setFormTratativa] = useState({
    tipo_tratativa: "Registro",
    descricao: "",
    responsavel: "",
  });

  const [formPlano, setFormPlano] = useState({
    what_acao: "",
    why_motivo: "",
    where_local: "",
    when_prazo: "",
    who_responsavel: "",
    how_como: "",
    how_much_custo: "",
    concluido: false,
    observacao: "",
  });

  async function carregarTudo() {
    try {
      setCarregando(true);
      setErro("");

      const [resOc, resResp, resTrat, resPlano] = await Promise.all([
        supabase
          .from("ocorrencias")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("ocorrencia_responsaveis")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("tratativas_ocorrencia")
          .select("*")
          .order("data_tratativa", { ascending: false }),
        supabase
          .from("plano_acao_5w2h")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (resOc.error) throw resOc.error;
      if (resResp.error) throw resResp.error;
      if (resTrat.error) throw resTrat.error;
      if (resPlano.error) throw resPlano.error;

      setOcorrencias((resOc.data as Ocorrencia[]) || []);
      setResponsaveis((resResp.data as Responsavel[]) || []);
      setTratativas((resTrat.data as Tratativa[]) || []);
      setPlanos((resPlano.data as Plano5W2H[]) || []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  function limparFormularioOcorrencia() {
    setOcorrenciaSelecionada(null);
    setFormOcorrencia({
      titulo: "",
      descricao: "",
      tipo_ocorrencia: "Não conformidade",
      setor_origem: "Qualidade",
      setor_destino: "",
      gravidade: "Leve",
      classificacao: "Não classificada",
      avaliado_qualidade: false,
      encerrada_qualidade: false,
      prazo_final: "",
      data_ocorrencia: new Date().toISOString().slice(0, 10),
    });

    setFormPlano({
      what_acao: "",
      why_motivo: "",
      where_local: "",
      when_prazo: "",
      who_responsavel: "",
      how_como: "",
      how_much_custo: "",
      concluido: false,
      observacao: "",
    });
  }

  function selecionarOcorrencia(oc: Ocorrencia) {
    setOcorrenciaSelecionada(oc);
    setAba("gestao");

    setFormOcorrencia({
      titulo: oc.titulo || "",
      descricao: oc.descricao || "",
      tipo_ocorrencia: oc.tipo_ocorrencia || "Não conformidade",
      setor_origem: oc.setor_origem || "Qualidade",
      setor_destino: oc.setor_destino || "",
      gravidade: oc.gravidade || "Leve",
      classificacao: oc.classificacao || "Não classificada",
      avaliado_qualidade: !!oc.avaliado_qualidade,
      encerrada_qualidade: !!oc.encerrada_qualidade,
      prazo_final: oc.prazo_final || "",
      data_ocorrencia: oc.data_ocorrencia || new Date().toISOString().slice(0, 10),
    });

    const plano = planos.find((p) => p.ocorrencia_id === oc.id);
    setFormPlano({
      what_acao: plano?.what_acao || "",
      why_motivo: plano?.why_motivo || "",
      where_local: plano?.where_local || "",
      when_prazo: plano?.when_prazo || "",
      who_responsavel: plano?.who_responsavel || "",
      how_como: plano?.how_como || "",
      how_much_custo: plano?.how_much_custo || "",
      concluido: !!plano?.concluido,
      observacao: plano?.observacao || "",
    });

    setErro("");
    setMensagem("");
  }

  async function salvarOcorrencia(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const payload = {
        titulo: formOcorrencia.titulo,
        descricao: formOcorrencia.descricao,
        tipo_ocorrencia: formOcorrencia.tipo_ocorrencia,
        setor_origem: formOcorrencia.setor_origem,
        setor_destino: formOcorrencia.setor_destino || null,
        gravidade: formOcorrencia.gravidade,
        classificacao: formOcorrencia.classificacao,
        avaliado_qualidade: formOcorrencia.avaliado_qualidade,
        encerrada_qualidade: formOcorrencia.encerrada_qualidade,
        prazo_final: formOcorrencia.prazo_final || null,
        data_ocorrencia: formOcorrencia.data_ocorrencia,
      };

      if (ocorrenciaSelecionada) {
        const { error } = await supabase
          .from("ocorrencias")
          .update(payload)
          .eq("id", ocorrenciaSelecionada.id);

        if (error) throw error;
        setMensagem("Ocorrência atualizada com sucesso.");
      } else {
        const { data, error } = await supabase
          .from("ocorrencias")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data) setOcorrenciaSelecionada(data as Ocorrencia);
        setMensagem("Ocorrência cadastrada com sucesso.");
      }

      await carregarTudo();
      setAba("gestao");
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar ocorrência.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirOcorrencia(id: number) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta ocorrência e todos os vínculos?"
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
      if (error) throw error;

      if (ocorrenciaSelecionada?.id === id) {
        limparFormularioOcorrencia();
      }

      setMensagem("Ocorrência excluída com sucesso.");
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao excluir ocorrência.");
    }
  }

  async function adicionarResponsavel(e: React.FormEvent) {
    e.preventDefault();
    if (!ocorrenciaSelecionada) {
      setErro("Selecione uma ocorrência antes de adicionar responsável.");
      return;
    }

    try {
      const { error } = await supabase.from("ocorrencia_responsaveis").insert({
        ocorrencia_id: ocorrenciaSelecionada.id,
        nome_responsavel: formResponsavel.nome_responsavel,
        setor: formResponsavel.setor,
        funcao: formResponsavel.funcao || null,
        prazo: formResponsavel.prazo || null,
        situacao: formResponsavel.situacao,
        observacao: formResponsavel.observacao || null,
      });

      if (error) throw error;

      setFormResponsavel({
        nome_responsavel: "",
        setor: "Qualidade",
        funcao: "",
        prazo: "",
        situacao: "Pendente",
        observacao: "",
      });

      setMensagem("Responsável adicionado com sucesso.");
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao adicionar responsável.");
    }
  }

  async function atualizarSituacaoResponsavel(id: number, situacao: string) {
    try {
      const { error } = await supabase
        .from("ocorrencia_responsaveis")
        .update({ situacao })
        .eq("id", id);

      if (error) throw error;
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao atualizar responsável.");
    }
  }

  async function excluirResponsavel(id: number) {
    const confirmar = window.confirm("Deseja excluir este responsável?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("ocorrencia_responsaveis")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao excluir responsável.");
    }
  }

  async function adicionarTratativa(e: React.FormEvent) {
    e.preventDefault();
    if (!ocorrenciaSelecionada) {
      setErro("Selecione uma ocorrência antes de registrar tratativa.");
      return;
    }

    try {
      const { error } = await supabase.from("tratativas_ocorrencia").insert({
        ocorrencia_id: ocorrenciaSelecionada.id,
        tipo_tratativa: formTratativa.tipo_tratativa,
        descricao: formTratativa.descricao,
        responsavel: formTratativa.responsavel || null,
      });

      if (error) throw error;

      setFormTratativa({
        tipo_tratativa: "Registro",
        descricao: "",
        responsavel: "",
      });

      setMensagem("Tratativa registrada com sucesso.");
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao registrar tratativa.");
    }
  }

  async function excluirTratativa(id: number) {
    const confirmar = window.confirm("Deseja excluir esta tratativa?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("tratativas_ocorrencia")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao excluir tratativa.");
    }
  }

  async function salvarPlano5W2H(e: React.FormEvent) {
    e.preventDefault();
    if (!ocorrenciaSelecionada) {
      setErro("Selecione uma ocorrência antes de salvar o plano 5W2H.");
      return;
    }

    try {
      const planoExistente = planos.find(
        (p) => p.ocorrencia_id === ocorrenciaSelecionada.id
      );

      const payload = {
        ocorrencia_id: ocorrenciaSelecionada.id,
        what_acao: formPlano.what_acao || null,
        why_motivo: formPlano.why_motivo || null,
        where_local: formPlano.where_local || null,
        when_prazo: formPlano.when_prazo || null,
        who_responsavel: formPlano.who_responsavel || null,
        how_como: formPlano.how_como || null,
        how_much_custo: formPlano.how_much_custo || null,
        concluido: formPlano.concluido,
        observacao: formPlano.observacao || null,
      };

      if (planoExistente) {
        const { error } = await supabase
          .from("plano_acao_5w2h")
          .update(payload)
          .eq("id", planoExistente.id);

        if (error) throw error;
        setMensagem("Plano 5W2H atualizado com sucesso.");
      } else {
        const { error } = await supabase.from("plano_acao_5w2h").insert(payload);
        if (error) throw error;
        setMensagem("Plano 5W2H salvo com sucesso.");
      }

      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar plano 5W2H.");
    }
  }

  async function excluirPlano5W2H() {
    if (!ocorrenciaSelecionada) return;

    const planoExistente = planos.find(
      (p) => p.ocorrencia_id === ocorrenciaSelecionada.id
    );

    if (!planoExistente) return;

    const confirmar = window.confirm("Deseja excluir o plano 5W2H?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("plano_acao_5w2h")
        .delete()
        .eq("id", planoExistente.id);

      if (error) throw error;

      setFormPlano({
        what_acao: "",
        why_motivo: "",
        where_local: "",
        when_prazo: "",
        who_responsavel: "",
        how_como: "",
        how_much_custo: "",
        concluido: false,
        observacao: "",
      });

      await carregarTudo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao excluir plano 5W2H.");
    }
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((o) => {
      const texto = busca.toLowerCase();

      const bateBusca =
        !texto ||
        (o.titulo || "").toLowerCase().includes(texto) ||
        (o.descricao || "").toLowerCase().includes(texto) ||
        (o.codigo || "").toLowerCase().includes(texto) ||
        (o.tipo_ocorrencia || "").toLowerCase().includes(texto);

      const bateStatus = !filtroStatus || o.status === filtroStatus;
      const bateSetor =
        !filtroSetor ||
        o.setor_origem === filtroSetor ||
        o.setor_destino === filtroSetor;
      const bateGravidade = !filtroGravidade || o.gravidade === filtroGravidade;
      const bateDataInicio =
        !filtroDataInicio || o.data_ocorrencia >= filtroDataInicio;
      const bateDataFim = !filtroDataFim || o.data_ocorrencia <= filtroDataFim;

      return (
        bateBusca &&
        bateStatus &&
        bateSetor &&
        bateGravidade &&
        bateDataInicio &&
        bateDataFim
      );
    });
  }, [
    ocorrencias,
    busca,
    filtroStatus,
    filtroSetor,
    filtroGravidade,
    filtroDataInicio,
    filtroDataFim,
  ]);

  const responsaveisDaOcorrencia = useMemo(() => {
    if (!ocorrenciaSelecionada) return [];
    return responsaveis.filter((r) => r.ocorrencia_id === ocorrenciaSelecionada.id);
  }, [responsaveis, ocorrenciaSelecionada]);

  const tratativasDaOcorrencia = useMemo(() => {
    if (!ocorrenciaSelecionada) return [];
    return tratativas.filter((t) => t.ocorrencia_id === ocorrenciaSelecionada.id);
  }, [tratativas, ocorrenciaSelecionada]);

  const planoDaOcorrencia = useMemo(() => {
    if (!ocorrenciaSelecionada) return null;
    return planos.find((p) => p.ocorrencia_id === ocorrenciaSelecionada.id) || null;
  }, [planos, ocorrenciaSelecionada]);

  const dashboard = useMemo(() => {
    const base = ocorrenciasFiltradas;

    return {
      total: base.length,
      abertas: base.filter((o) => o.status === "Aberta").length,
      emAnalise: base.filter((o) => o.status === "Em análise").length,
      emTratativa: base.filter((o) => o.status === "Em tratativa").length,
      planoAtivo: base.filter((o) => o.status === "Plano de ação ativo").length,
      concluidas: base.filter((o) => o.status === "Concluída").length,
      encerradas: base.filter((o) => o.status === "Encerrada").length,
      leve: base.filter((o) => o.gravidade === "Leve").length,
      moderada: base.filter((o) => o.gravidade === "Moderada").length,
      grave: base.filter((o) => o.gravidade === "Grave").length,
      sentinela: base.filter((o) => o.gravidade === "Sentinela").length,
      percentualConclusao:
        base.length > 0
          ? Math.round(
              ((base.filter(
                (o) => o.status === "Concluída" || o.status === "Encerrada"
              ).length /
                base.length) *
                100)
            )
          : 0,
    };
  }, [ocorrenciasFiltradas]);

  const porSetor = useMemo(() => {
    const mapa: Record<string, number> = {};
    ocorrenciasFiltradas.forEach((o) => {
      mapa[o.setor_origem] = (mapa[o.setor_origem] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([setor, quantidade]) => ({ setor, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [ocorrenciasFiltradas]);

  const porMes = useMemo(() => {
    const mapa: Record<string, number> = {};

    ocorrencias.forEach((o) => {
      const data = new Date(o.data_ocorrencia + "T00:00:00");
      const chave = `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
      mapa[chave] = (mapa[chave] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([mes, quantidade]) => ({ mes, quantidade }))
      .sort((a, b) => {
        const [ma, aa] = a.mes.split("/");
        const [mb, ab] = b.mes.split("/");
        return Number(`${aa}${ma}`) - Number(`${ab}${mb}`);
      })
      .slice(-6);
  }, [ocorrencias]);

  const ocorrenciasQualidade = useMemo(() => {
    return ocorrenciasFiltradas.filter(
      (o) =>
        o.setor_origem === "Qualidade" ||
        o.setor_destino === "Qualidade" ||
        o.avaliado_qualidade
    );
  }, [ocorrenciasFiltradas]);

  const ocorrenciasLider = useMemo(() => {
    return ocorrenciasFiltradas.filter(
      (o) => o.setor_origem === setorLider || o.setor_destino === setorLider
    );
  }, [ocorrenciasFiltradas, setorLider]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <p className="text-sm font-semibold text-slate-600">
              Carregando sistema master...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-white">
      <div className="border-b border-cyan-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">
              Qualidade Hospitalar
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-800">
              Sistema Master de Gestão de Ocorrências
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visão executiva, qualidade, liderança setorial, plano 5W2H e fluxo operacional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Botao
              variant={aba === "dashboard" ? "dark" : "secondary"}
              onClick={() => setAba("dashboard")}
            >
              Dashboard
            </Botao>
            <Botao
              variant={aba === "cadastro" ? "dark" : "secondary"}
              onClick={() => {
                limparFormularioOcorrencia();
                setAba("cadastro");
              }}
            >
              Nova ocorrência
            </Botao>
            <Botao
              variant={aba === "gestao" ? "dark" : "secondary"}
              onClick={() => setAba("gestao")}
            >
              Gestão
            </Botao>
            <Botao
              variant={aba === "qualidade" ? "dark" : "secondary"}
              onClick={() => setAba("qualidade")}
            >
              Qualidade
            </Botao>
            <Botao
              variant={aba === "lider" ? "dark" : "secondary"}
              onClick={() => setAba("lider")}
            >
              Líder do setor
            </Botao>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {erro ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        ) : null}

        {mensagem ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {mensagem}
          </div>
        ) : null}

        <Card className="mb-6">
          <TituloSecao
            titulo="Filtros executivos"
            subtitulo="Esses filtros impactam dashboard, qualidade, líder e gestão."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Input
              placeholder="Buscar por código, título, descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {statusFluxo.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>

            <Select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)}>
              <option value="">Todos os setores</option>
              {setores.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>

            <Select
              value={filtroGravidade}
              onChange={(e) => setFiltroGravidade(e.target.value)}
            >
              <option value="">Todas as gravidades</option>
              {gravidades.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>

            <Input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />

            <Input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Botao
              variant="secondary"
              onClick={() => {
                setBusca("");
                setFiltroStatus("");
                setFiltroSetor("");
                setFiltroGravidade("");
                setFiltroDataInicio("");
                setFiltroDataFim("");
              }}
            >
              Limpar filtros
            </Botao>
          </div>
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-8">
          <Card><p className="text-sm text-slate-500">Total</p><p className="mt-2 text-3xl font-black text-slate-800">{dashboard.total}</p></Card>
          <Card className="bg-cyan-50"><p className="text-sm text-cyan-700">Abertas</p><p className="mt-2 text-3xl font-black text-cyan-800">{dashboard.abertas}</p></Card>
          <Card className="bg-amber-50"><p className="text-sm text-amber-700">Em análise</p><p className="mt-2 text-3xl font-black text-amber-800">{dashboard.emAnalise}</p></Card>
          <Card className="bg-blue-50"><p className="text-sm text-blue-700">Em tratativa</p><p className="mt-2 text-3xl font-black text-blue-800">{dashboard.emTratativa}</p></Card>
          <Card className="bg-violet-50"><p className="text-sm text-violet-700">Plano ativo</p><p className="mt-2 text-3xl font-black text-violet-800">{dashboard.planoAtivo}</p></Card>
          <Card className="bg-emerald-50"><p className="text-sm text-emerald-700">Concluídas</p><p className="mt-2 text-3xl font-black text-emerald-800">{dashboard.concluidas}</p></Card>
          <Card className="bg-slate-50"><p className="text-sm text-slate-600">Encerradas</p><p className="mt-2 text-3xl font-black text-slate-800">{dashboard.encerradas}</p></Card>
          <Card><p className="text-sm text-slate-500">% conclusão</p><p className="mt-2 text-3xl font-black text-slate-800">{dashboard.percentualConclusao}%</p></Card>
        </div>

        {aba === "dashboard" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <Card>
                <TituloSecao
                  titulo="Distribuição por setor"
                  subtitulo="Setores com maior volume dentro do filtro atual."
                />
                <div className="space-y-4">
                  {porSetor.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Sem dados para exibir.
                    </div>
                  ) : (
                    porSetor.map((item) => (
                      <Barra
                        key={item.setor}
                        titulo={item.setor}
                        valor={item.quantidade}
                        total={dashboard.total}
                      />
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Indicadores mensais"
                  subtitulo="Volume dos últimos meses cadastrados."
                />
                <div className="space-y-4">
                  {porMes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Sem dados mensais.
                    </div>
                  ) : (
                    porMes.map((item) => (
                      <Barra
                        key={item.mes}
                        titulo={item.mes}
                        valor={item.quantidade}
                        total={Math.max(...porMes.map((x) => x.quantidade), 1)}
                      />
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Ocorrências recentes"
                  subtitulo="Abertura rápida dos registros mais atuais."
                />
                <div className="space-y-4">
                  {ocorrenciasFiltradas.slice(0, 6).map((oc) => (
                    <div
                      key={oc.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge label={oc.codigo || "Sem código"} className="bg-white text-slate-700 border-slate-200" />
                            <Badge label={oc.status} className={classStatus(oc.status)} />
                            <Badge label={oc.gravidade} className={classGravidade(oc.gravidade)} />
                          </div>
                          <p className="font-black text-slate-800">{oc.titulo}</p>
                          <p className="text-sm text-slate-500">{oc.setor_origem}</p>
                        </div>
                        <Botao variant="dark" onClick={() => selecionarOcorrencia(oc)}>
                          Abrir
                        </Botao>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <TituloSecao
                  titulo="Gravidade"
                  subtitulo="Composição da base filtrada."
                />
                <div className="space-y-4">
                  <Barra titulo="Leve" valor={dashboard.leve} total={dashboard.total} />
                  <Barra titulo="Moderada" valor={dashboard.moderada} total={dashboard.total} />
                  <Barra titulo="Grave" valor={dashboard.grave} total={dashboard.total} />
                  <Barra titulo="Sentinela" valor={dashboard.sentinela} total={dashboard.total} />
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Status operacional"
                  subtitulo="Fase atual das ocorrências."
                />
                <div className="space-y-4">
                  <Barra titulo="Aberta" valor={dashboard.abertas} total={dashboard.total} />
                  <Barra titulo="Em análise" valor={dashboard.emAnalise} total={dashboard.total} />
                  <Barra titulo="Em tratativa" valor={dashboard.emTratativa} total={dashboard.total} />
                  <Barra titulo="Plano de ação ativo" valor={dashboard.planoAtivo} total={dashboard.total} />
                  <Barra titulo="Concluída" valor={dashboard.concluidas} total={dashboard.total} />
                  <Barra titulo="Encerrada" valor={dashboard.encerradas} total={dashboard.total} />
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Leitura gerencial"
                  subtitulo="Resumo rápido para tomada de decisão."
                />
                <div className="space-y-3 text-sm text-slate-600">
                  <p><strong>Críticas:</strong> {dashboard.grave + dashboard.sentinela}</p>
                  <p><strong>Em acompanhamento:</strong> {dashboard.emAnalise + dashboard.emTratativa + dashboard.planoAtivo}</p>
                  <p><strong>Concluídas + encerradas:</strong> {dashboard.concluidas + dashboard.encerradas}</p>
                  <p><strong>Setor com maior volume:</strong> {porSetor[0]?.setor || "-"}</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {aba === "cadastro" && (
          <Card>
            <TituloSecao
              titulo={ocorrenciaSelecionada ? "Editar ocorrência" : "Nova ocorrência"}
              subtitulo="Cadastro técnico da ocorrência hospitalar."
            />

            <form onSubmit={salvarOcorrencia} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Título</label>
                <Input
                  value={formOcorrencia.titulo}
                  onChange={(e) =>
                    setFormOcorrencia({ ...formOcorrencia, titulo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Descrição</label>
                <TextArea
                  value={formOcorrencia.descricao}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      descricao: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Tipo</label>
                <Select
                  value={formOcorrencia.tipo_ocorrencia}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      tipo_ocorrencia: e.target.value,
                    })
                  }
                >
                  {tiposOcorrencia.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Gravidade</label>
                <Select
                  value={formOcorrencia.gravidade}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      gravidade: e.target.value,
                    })
                  }
                >
                  {gravidades.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Setor de origem</label>
                <Select
                  value={formOcorrencia.setor_origem}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      setor_origem: e.target.value,
                    })
                  }
                >
                  {setores.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Setor de destino</label>
                <Select
                  value={formOcorrencia.setor_destino}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      setor_destino: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione</option>
                  {setores.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Classificação</label>
                <Select
                  value={formOcorrencia.classificacao}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      classificacao: e.target.value,
                    })
                  }
                >
                  {classificacoes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Data da ocorrência</label>
                <Input
                  type="date"
                  value={formOcorrencia.data_ocorrencia}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      data_ocorrencia: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Prazo final</label>
                <Input
                  type="date"
                  value={formOcorrencia.prazo_final}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      prazo_final: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formOcorrencia.avaliado_qualidade}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      avaliado_qualidade: e.target.checked,
                    })
                  }
                />
                <span className="text-sm font-semibold text-slate-700">
                  Qualidade iniciou análise
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formOcorrencia.encerrada_qualidade}
                  onChange={(e) =>
                    setFormOcorrencia({
                      ...formOcorrencia,
                      encerrada_qualidade: e.target.checked,
                    })
                  }
                />
                <span className="text-sm font-semibold text-slate-700">
                  Encerrada pela qualidade
                </span>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Botao type="submit" variant="primary" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar ocorrência"}
                </Botao>
                <Botao variant="secondary" onClick={limparFormularioOcorrencia}>
                  Limpar formulário
                </Botao>
              </div>
            </form>
          </Card>
        )}

        {aba === "gestao" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <Card>
                <TituloSecao
                  titulo="Painel de ocorrências"
                  subtitulo="Lista operacional com abertura e exclusão."
                />
                <div className="space-y-4">
                  {ocorrenciasFiltradas.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      Nenhuma ocorrência encontrada.
                    </div>
                  ) : (
                    ocorrenciasFiltradas.map((oc) => (
                      <div
                        key={oc.id}
                        className={`rounded-2xl border p-4 transition ${
                          ocorrenciaSelecionada?.id === oc.id
                            ? "border-cyan-400 bg-cyan-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2">
                              <Badge label={oc.codigo || "Sem código"} className="bg-white text-slate-700 border-slate-200" />
                              <Badge label={oc.status} className={classStatus(oc.status)} />
                              <Badge label={oc.gravidade} className={classGravidade(oc.gravidade)} />
                            </div>

                            <h3 className="text-base font-black text-slate-800">
                              {oc.titulo}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">{oc.descricao}</p>

                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-2">
                              <p><strong>Origem:</strong> {oc.setor_origem}</p>
                              <p><strong>Destino:</strong> {oc.setor_destino || "-"}</p>
                              <p><strong>Data:</strong> {formatarData(oc.data_ocorrencia)}</p>
                              <p><strong>Prazo:</strong> {formatarData(oc.prazo_final)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Botao variant="dark" onClick={() => selecionarOcorrencia(oc)}>
                              Abrir
                            </Botao>
                            <Botao variant="danger" onClick={() => excluirOcorrencia(oc.id)}>
                              Excluir
                            </Botao>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <TituloSecao
                  titulo="Ocorrência selecionada"
                  subtitulo="Visão executiva detalhada."
                  direita={
                    ocorrenciaSelecionada ? (
                      <div className="flex gap-2">
                        <Botao variant="secondary" onClick={() => setAba("cadastro")}>
                          Editar
                        </Botao>
                        <Botao
                          variant="dark"
                          onClick={() =>
                            imprimirOcorrencia(
                              ocorrenciaSelecionada,
                              responsaveisDaOcorrencia,
                              tratativasDaOcorrencia,
                              planoDaOcorrencia
                            )
                          }
                        >
                          Imprimir
                        </Botao>
                      </div>
                    ) : null
                  }
                />

                {!ocorrenciaSelecionada ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    Selecione uma ocorrência.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge label={ocorrenciaSelecionada.codigo || "Sem código"} className="bg-white text-slate-700 border-slate-200" />
                        <Badge label={ocorrenciaSelecionada.status} className={classStatus(ocorrenciaSelecionada.status)} />
                        <Badge label={ocorrenciaSelecionada.gravidade} className={classGravidade(ocorrenciaSelecionada.gravidade)} />
                      </div>

                      <h3 className="text-lg font-black text-slate-800">
                        {ocorrenciaSelecionada.titulo}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {ocorrenciaSelecionada.descricao}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p><strong>Tipo:</strong> {ocorrenciaSelecionada.tipo_ocorrencia}</p>
                        <p><strong>Classificação:</strong> {ocorrenciaSelecionada.classificacao}</p>
                        <p><strong>Setor origem:</strong> {ocorrenciaSelecionada.setor_origem}</p>
                        <p><strong>Setor destino:</strong> {ocorrenciaSelecionada.setor_destino || "-"}</p>
                        <p><strong>Data ocorrência:</strong> {formatarData(ocorrenciaSelecionada.data_ocorrencia)}</p>
                        <p><strong>Criado em:</strong> {formatarDataHora(ocorrenciaSelecionada.created_at)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-bold text-slate-700">Fluxo do status</p>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {statusFluxo.map((s, index) => {
                          const ativo = ocorrenciaSelecionada.status === s;
                          const passou =
                            statusFluxo.indexOf(ocorrenciaSelecionada.status) >= index;

                          return (
                            <div
                              key={s}
                              className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                                ativo
                                  ? "border-cyan-500 bg-cyan-600 text-white"
                                  : passou
                                  ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                              }`}
                            >
                              {s}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Responsáveis</p>
                        <p className="mt-2 text-2xl font-black text-slate-800">
                          {responsaveisDaOcorrencia.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Tratativas</p>
                        <p className="mt-2 text-2xl font-black text-slate-800">
                          {tratativasDaOcorrencia.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Plano 5W2H</p>
                        <p className="mt-2 text-2xl font-black text-slate-800">
                          {planoDaOcorrencia ? "Ativo" : "Não"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <TituloSecao
                  titulo="Responsáveis"
                  subtitulo="Cadastro e andamento dos responsáveis."
                />

                <form onSubmit={adicionarResponsavel} className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Nome do responsável"
                    value={formResponsavel.nome_responsavel}
                    onChange={(e) =>
                      setFormResponsavel({
                        ...formResponsavel,
                        nome_responsavel: e.target.value,
                      })
                    }
                    disabled={!ocorrenciaSelecionada}
                    required
                  />
                  <Select
                    value={formResponsavel.setor}
                    onChange={(e) =>
                      setFormResponsavel({ ...formResponsavel, setor: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  >
                    {setores.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Função"
                    value={formResponsavel.funcao}
                    onChange={(e) =>
                      setFormResponsavel({ ...formResponsavel, funcao: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    type="date"
                    value={formResponsavel.prazo}
                    onChange={(e) =>
                      setFormResponsavel({ ...formResponsavel, prazo: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Select
                    value={formResponsavel.situacao}
                    onChange={(e) =>
                      setFormResponsavel({ ...formResponsavel, situacao: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  >
                    {situacoesResponsavel.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                  <TextArea
                    placeholder="Observação"
                    value={formResponsavel.observacao}
                    onChange={(e) =>
                      setFormResponsavel({
                        ...formResponsavel,
                        observacao: e.target.value,
                      })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Botao type="submit" variant="primary" disabled={!ocorrenciaSelecionada}>
                    Adicionar responsável
                  </Botao>
                </form>

                <div className="mt-5 space-y-3">
                  {responsaveisDaOcorrencia.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Nenhum responsável vinculado.
                    </div>
                  ) : (
                    responsaveisDaOcorrencia.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-black text-slate-800">{r.nome_responsavel}</p>
                            <p className="text-sm text-slate-600">
                              {r.setor} {r.funcao ? `• ${r.funcao}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={r.situacao}
                              onChange={(e) =>
                                atualizarSituacaoResponsavel(r.id, e.target.value)
                              }
                              className="min-w-[170px]"
                            >
                              {situacoesResponsavel.map((item) => (
                                <option key={item}>{item}</option>
                              ))}
                            </Select>
                            <Botao variant="danger" onClick={() => excluirResponsavel(r.id)}>
                              Excluir
                            </Botao>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <p><strong>Prazo:</strong> {formatarData(r.prazo)}</p>
                          <p><strong>Situação:</strong> {r.situacao}</p>
                          <p className="md:col-span-2"><strong>Observação:</strong> {r.observacao || "-"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Timeline de tratativas"
                  subtitulo="Histórico cronológico da ocorrência."
                />

                <form onSubmit={adicionarTratativa} className="grid grid-cols-1 gap-3">
                  <Select
                    value={formTratativa.tipo_tratativa}
                    onChange={(e) =>
                      setFormTratativa({
                        ...formTratativa,
                        tipo_tratativa: e.target.value,
                      })
                    }
                    disabled={!ocorrenciaSelecionada}
                  >
                    {tiposTratativa.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>

                  <Input
                    placeholder="Responsável da tratativa"
                    value={formTratativa.responsavel}
                    onChange={(e) =>
                      setFormTratativa({
                        ...formTratativa,
                        responsavel: e.target.value,
                      })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />

                  <TextArea
                    placeholder="Descrição da tratativa"
                    value={formTratativa.descricao}
                    onChange={(e) =>
                      setFormTratativa({
                        ...formTratativa,
                        descricao: e.target.value,
                      })
                    }
                    disabled={!ocorrenciaSelecionada}
                    required
                  />

                  <Botao type="submit" variant="dark" disabled={!ocorrenciaSelecionada}>
                    Registrar tratativa
                  </Botao>
                </form>

                <div className="mt-5 space-y-4">
                  {tratativasDaOcorrencia.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Nenhuma tratativa registrada.
                    </div>
                  ) : (
                    tratativasDaOcorrencia.map((t, index) => (
                      <div key={t.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-cyan-700" />
                          {index < tratativasDaOcorrencia.length - 1 ? (
                            <div className="mt-1 h-full min-h-[60px] w-[2px] bg-cyan-200" />
                          ) : null}
                        </div>

                        <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-black text-slate-800">{t.tipo_tratativa}</p>
                              <p className="text-sm text-slate-500">
                                {formatarDataHora(t.data_tratativa)}
                              </p>
                            </div>

                            <Botao variant="danger" onClick={() => excluirTratativa(t.id)}>
                              Excluir
                            </Botao>
                          </div>

                          <p className="mt-3 text-sm text-slate-700">{t.descricao}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            <strong>Responsável:</strong> {t.responsavel || "-"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <TituloSecao
                  titulo="Plano de ação 5W2H"
                  subtitulo="Planejamento estruturado da resposta."
                />

                <form onSubmit={salvarPlano5W2H} className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="What - O que será feito?"
                    value={formPlano.what_acao}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, what_acao: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    placeholder="Why - Por que será feito?"
                    value={formPlano.why_motivo}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, why_motivo: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    placeholder="Where - Onde será feito?"
                    value={formPlano.where_local}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, where_local: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    type="date"
                    value={formPlano.when_prazo}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, when_prazo: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    placeholder="Who - Responsável"
                    value={formPlano.who_responsavel}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, who_responsavel: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <TextArea
                    placeholder="How - Como será executado?"
                    value={formPlano.how_como}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, how_como: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <Input
                    placeholder="How much - Custo / recurso"
                    value={formPlano.how_much_custo}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, how_much_custo: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <TextArea
                    placeholder="Observação"
                    value={formPlano.observacao}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, observacao: e.target.value })
                    }
                    disabled={!ocorrenciaSelecionada}
                  />
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={formPlano.concluido}
                      onChange={(e) =>
                        setFormPlano({ ...formPlano, concluido: e.target.checked })
                      }
                      disabled={!ocorrenciaSelecionada}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Plano concluído
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Botao type="submit" variant="success" disabled={!ocorrenciaSelecionada}>
                      Salvar plano 5W2H
                    </Botao>
                    <Botao
                      variant="danger"
                      onClick={excluirPlano5W2H}
                      disabled={!ocorrenciaSelecionada}
                    >
                      Excluir plano
                    </Botao>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {aba === "qualidade" && (
          <Card>
            <TituloSecao
              titulo="Painel da Qualidade"
              subtitulo="Ocorrências em avaliação ou vinculadas ao setor Qualidade."
            />

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Qualidade</p>
                <p className="mt-2 text-2xl font-black text-slate-800">
                  {ocorrenciasQualidade.length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Em análise</p>
                <p className="mt-2 text-2xl font-black text-amber-800">
                  {ocorrenciasQualidade.filter((o) => o.status === "Em análise").length}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Em tratativa</p>
                <p className="mt-2 text-2xl font-black text-blue-800">
                  {
                    ocorrenciasQualidade.filter(
                      (o) =>
                        o.status === "Em tratativa" ||
                        o.status === "Plano de ação ativo"
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Críticas</p>
                <p className="mt-2 text-2xl font-black text-rose-800">
                  {
                    ocorrenciasQualidade.filter(
                      (o) => o.gravidade === "Grave" || o.gravidade === "Sentinela"
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {ocorrenciasQualidade.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhuma ocorrência da Qualidade no filtro atual.
                </div>
              ) : (
                ocorrenciasQualidade.map((oc) => (
                  <div key={oc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge label={oc.codigo || "Sem código"} className="bg-white text-slate-700 border-slate-200" />
                          <Badge label={oc.status} className={classStatus(oc.status)} />
                          <Badge label={oc.gravidade} className={classGravidade(oc.gravidade)} />
                        </div>
                        <h3 className="font-black text-slate-800">{oc.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-600">{oc.descricao}</p>
                      </div>
                      <Botao variant="dark" onClick={() => selecionarOcorrencia(oc)}>
                        Abrir na gestão
                      </Botao>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {aba === "lider" && (
          <Card>
            <TituloSecao
              titulo="Painel do Líder do Setor"
              subtitulo="Visão focal por setor."
              direita={
                <div className="min-w-[260px]">
                  <Select value={setorLider} onChange={(e) => setSetorLider(e.target.value)}>
                    {setores.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
              }
            />

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total do setor</p>
                <p className="mt-2 text-2xl font-black text-slate-800">
                  {ocorrenciasLider.length}
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="text-sm text-cyan-700">Abertas</p>
                <p className="mt-2 text-2xl font-black text-cyan-800">
                  {ocorrenciasLider.filter((o) => o.status === "Aberta").length}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Em acompanhamento</p>
                <p className="mt-2 text-2xl font-black text-blue-800">
                  {
                    ocorrenciasLider.filter(
                      (o) =>
                        o.status === "Em análise" ||
                        o.status === "Em tratativa" ||
                        o.status === "Plano de ação ativo"
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Finalizadas</p>
                <p className="mt-2 text-2xl font-black text-emerald-800">
                  {
                    ocorrenciasLider.filter(
                      (o) => o.status === "Concluída" || o.status === "Encerrada"
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {ocorrenciasLider.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhuma ocorrência encontrada para este setor.
                </div>
              ) : (
                ocorrenciasLider.map((oc) => (
                  <div key={oc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge label={oc.codigo || "Sem código"} className="bg-white text-slate-700 border-slate-200" />
                          <Badge label={oc.status} className={classStatus(oc.status)} />
                          <Badge label={oc.gravidade} className={classGravidade(oc.gravidade)} />
                        </div>
                        <h3 className="font-black text-slate-800">{oc.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-600">{oc.descricao}</p>
                      </div>
                      <Botao variant="dark" onClick={() => selecionarOcorrencia(oc)}>
                        Abrir na gestão
                      </Botao>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}