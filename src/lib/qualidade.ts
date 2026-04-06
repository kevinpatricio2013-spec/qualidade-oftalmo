import type { Ocorrencia } from "../types/ocorrencia";

export function traduzirStatus(status?: string | null) {
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
      return "Não definido";
  }
}

export function formatarData(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleString("pt-BR");
}

export function formatarDataCurta(data?: string | null) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

export function gravidadeClasses(gravidade?: string | null) {
  const valor = gravidade?.toLowerCase();

  if (valor?.includes("alta") || valor?.includes("grave") || valor?.includes("crítica")) {
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

export function statusClasses(status?: string | null) {
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

export function calcularDiasEmAberto(dataCriacao?: string | null) {
  if (!dataCriacao) return 0;

  const inicio = new Date(dataCriacao).getTime();
  const agora = Date.now();

  const diferenca = agora - inicio;
  return Math.max(0, Math.floor(diferenca / (1000 * 60 * 60 * 24)));
}

export function verificarSlaVencido(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return false;
  if (ocorrencia.status === "CONCLUIDA") return false;

  return new Date(ocorrencia.data_limite).getTime() < Date.now();
}

export function calcularDiasAtraso(ocorrencia: Ocorrencia) {
  if (!ocorrencia.data_limite) return 0;
  if (!verificarSlaVencido(ocorrencia)) return 0;

  const limite = new Date(ocorrencia.data_limite).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - limite) / (1000 * 60 * 60 * 24)));
}