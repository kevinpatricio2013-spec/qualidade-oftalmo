export type StatusOcorrencia =
  | "EM_ANALISE_QUALIDADE"
  | "DIRECIONADA"
  | "EM_TRATATIVA"
  | "AGUARDANDO_VALIDACAO"
  | "CONCLUIDA";

export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_ocorrencia: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  status: StatusOcorrencia | null;

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