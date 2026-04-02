import { supabase } from "./supabase";

type UUID = string;
type ID = number;

export async function atribuirResponsavelQualidade(
  ocorrenciaId: ID,
  responsavelQualidadeId: UUID
) {
  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      responsavel_qualidade_id: responsavelQualidadeId,
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function encaminharParaLideranca(params: {
  ocorrenciaId: ID;
  responsavelQualidadeId: UUID;
  responsavelLiderId: UUID;
  setorDestino: string;
}) {
  const {
    ocorrenciaId,
    responsavelQualidadeId,
    responsavelLiderId,
    setorDestino,
  } = params;

  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      responsavel_qualidade_id: responsavelQualidadeId,
      responsavel_lider_id: responsavelLiderId,
      setor_destino: setorDestino,
      encaminhada_lideranca_em: new Date().toISOString(),
      lideranca_assumiu_em: null,
      enviada_validacao_qualidade_em: null,
      validada_qualidade_em: null,
      encerrada_em: null,
      reaberta_em: null,
      finalizada_lideranca: false,
      aguardando_validacao_qualidade: false,
      validada_qualidade: false,
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assumirPelaLideranca(
  ocorrenciaId: ID,
  responsavelLiderId: UUID
) {
  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      responsavel_lider_id: responsavelLiderId,
      lideranca_assumiu_em: new Date().toISOString(),
      finalizada_lideranca: false,
      aguardando_validacao_qualidade: false,
      validada_qualidade: false,
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function enviarParaValidacaoDaQualidade(
  ocorrenciaId: ID
) {
  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      finalizada_lideranca: true,
      aguardando_validacao_qualidade: true,
      enviada_validacao_qualidade_em: new Date().toISOString(),
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validarConclusaoPelaQualidade(
  ocorrenciaId: ID
) {
  const agora = new Date().toISOString();

  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      validada_qualidade: true,
      validada_qualidade_em: agora,
      encerrada_em: agora,
      aguardando_validacao_qualidade: false,
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reabrirOcorrencia(
  ocorrenciaId: ID
) {
  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      reaberta_em: new Date().toISOString(),
      validada_qualidade: false,
      validada_qualidade_em: null,
      encerrada_em: null,
      aguardando_validacao_qualidade: false,
      finalizada_lideranca: false,
      lideranca_assumiu_em: null,
      enviada_validacao_qualidade_em: null,
    })
    .eq("id", ocorrenciaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
