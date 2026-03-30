export type StatusOcorrencia =
  | "Aberta"
  | "Em análise pela Qualidade"
  | "Direcionada ao setor"
  | "Em tratativa"
  | "Aguardando validação"
  | "Concluída";

export type GravidadeOcorrencia =
  | "Leve"
  | "Moderada"
  | "Alta"
  | "Grave"
  | "Sentinela"
  | string;

export interface Ocorrencia {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_destino: string | null;
  gravidade: GravidadeOcorrencia | null;
  status: StatusOcorrencia;
  responsavel: string | null;
  prazo: string | null;
  tratativa: string | null;
  analise_causa: string | null;
  acao_imediata: string | null;
  validacao_qualidade: string | null;
  o_que: string | null;
  por_que: string | null;
  onde: string | null;
  quando: string | null;
  quem: string | null;
  como: string | null;
  quanto: string | null;
  created_at: string;
  updated_at: string | null;
}