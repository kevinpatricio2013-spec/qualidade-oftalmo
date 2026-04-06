export type StatusOcorrencia =
  | "Aberta"
  | "Em análise pela Qualidade"
  | "Direcionada para Liderança"
  | "Em tratativa pela Liderança"
  | "Aguardando validação da Qualidade"
  | "Encerrada"
  | string;

export type Ocorrencia = {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  setor_origem?: string | null;
  setor_responsavel?: string | null;
  gravidade?: string | null;
  tipo_ocorrencia?: string | null;
  status?: StatusOcorrencia | null;
  created_at?: string | null;
  prazo?: string | null;
};

export const STATUS_FLUXO: StatusOcorrencia[] = [
  "Aberta",
  "Em análise pela Qualidade",
  "Direcionada para Liderança",
  "Em tratativa pela Liderança",
  "Aguardando validação da Qualidade",
  "Encerrada",
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
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

export function diasParaVencimento(data?: string | null) {
  if (!data) return null;

  const hoje = new Date();
  const prazo = new Date(data);

  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  const diffMs = prazo.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function contarPorStatus(ocorrencias: Ocorrencia[]) {
  return ocorrencias.reduce<Record<string, number>>((acc, item) => {
    const chave = item.status || "Sem status";
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
}

export function contarPorGravidade(ocorrencias: Ocorrencia[]) {
  return ocorrencias.reduce<Record<string, number>>((acc, item) => {
    const chave = item.gravidade || "Não informada";
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
}

export function contarPorSetor(ocorrencias: Ocorrencia[]) {
  return ocorrencias.reduce<Record<string, number>>((acc, item) => {
    const chave = item.setor_responsavel || item.setor_origem || "Não informado";
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
}

export function obterIndicadores(ocorrencias: Ocorrencia[]) {
  return {
    total: ocorrencias.length,
    abertas: ocorrencias.filter((item) => item.status === "Aberta").length,
    emAnalise: ocorrencias.filter(
      (item) => item.status === "Em análise pela Qualidade"
    ).length,
    direcionadas: ocorrencias.filter(
      (item) => item.status === "Direcionada para Liderança"
    ).length,
    emTratativa: ocorrencias.filter(
      (item) => item.status === "Em tratativa pela Liderança"
    ).length,
    aguardandoValidacao: ocorrencias.filter(
      (item) => item.status === "Aguardando validação da Qualidade"
    ).length,
    encerradas: ocorrencias.filter((item) => item.status === "Encerrada").length,
  };
}

export function statusAnterior(status: StatusOcorrencia) {
  const index = STATUS_FLUXO.indexOf(status);
  if (index <= 0) return status;
  return STATUS_FLUXO[index - 1];
}

export function statusSeguinte(status: StatusOcorrencia) {
  const index = STATUS_FLUXO.indexOf(status);
  if (index < 0 || index >= STATUS_FLUXO.length - 1) return status;
  return STATUS_FLUXO[index + 1];
}