import type { Ocorrencia, StatusOcorrencia } from "@/src/types/ocorrencia";

export const STATUS_FLUXO: StatusOcorrencia[] = [
  "Aberta",
  "Em análise pela Qualidade",
  "Direcionada ao setor",
  "Em tratativa",
  "Aguardando validação",
  "Concluída",
];

export const SETORES = [
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

export function formatarData(data?: string | null) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data?: string | null) {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR");
}

export function diasParaVencimento(prazo?: string | null) {
  if (!prazo) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataPrazo = new Date(prazo);
  dataPrazo.setHours(0, 0, 0, 0);

  const diff = dataPrazo.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function statusSeguinte(status: StatusOcorrencia): StatusOcorrencia | null {
  const indice = STATUS_FLUXO.indexOf(status);
  if (indice === -1 || indice === STATUS_FLUXO.length - 1) return null;
  return STATUS_FLUXO[indice + 1];
}

export function statusAnterior(status: StatusOcorrencia): StatusOcorrencia | null {
  const indice = STATUS_FLUXO.indexOf(status);
  if (indice <= 0) return null;
  return STATUS_FLUXO[indice - 1];
}

export function contarPorStatus(ocorrencias: Ocorrencia[]) {
  return STATUS_FLUXO.map((status) => ({
    status,
    total: ocorrencias.filter((item) => item.status === status).length,
  }));
}

export function contarPorGravidade(ocorrencias: Ocorrencia[]) {
  const mapa = new Map<string, number>();

  ocorrencias.forEach((item) => {
    const chave = item.gravidade || "Não classificada";
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  });

  return Array.from(mapa.entries()).map(([gravidade, total]) => ({
    gravidade,
    total,
  }));
}

export function contarPorSetor(ocorrencias: Ocorrencia[]) {
  const mapa = new Map<string, number>();

  ocorrencias.forEach((item) => {
    const chave = item.setor_destino || "Não direcionado";
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  });

  return Array.from(mapa.entries())
    .map(([setor, total]) => ({ setor, total }))
    .sort((a, b) => b.total - a.total);
}

export function obterIndicadores(ocorrencias: Ocorrencia[]) {
  const total = ocorrencias.length;
  const abertas = ocorrencias.filter((i) => i.status === "Aberta").length;
  const emTratativa = ocorrencias.filter((i) => i.status === "Em tratativa").length;
  const aguardandoValidacao = ocorrencias.filter(
    (i) => i.status === "Aguardando validação"
  ).length;
  const concluidas = ocorrencias.filter((i) => i.status === "Concluída").length;

  const vencidas = ocorrencias.filter((i) => {
    const dias = diasParaVencimento(i.prazo);
    return dias !== null && dias < 0 && i.status !== "Concluída";
  }).length;

  return {
    total,
    abertas,
    emTratativa,
    aguardandoValidacao,
    concluidas,
    vencidas,
  };
}