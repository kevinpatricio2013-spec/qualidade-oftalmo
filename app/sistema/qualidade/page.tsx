"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { getAuthenticatedProfile } from "@/src/lib/auth";
import DashboardCards from "@/src/components/sistema/DashboardCards";
import OcorrenciaList from "@/src/components/sistema/OcorrenciaList";
import type { Ocorrencia } from "@/src/types/ocorrencia";
import type { Profile } from "@/src/types/profile";

export default function SistemaQualidadePage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const { profile: profileAtual, error } = await getAuthenticatedProfile();

      if (error) {
        throw new Error(error);
      }

      if (!profileAtual) {
        throw new Error("Perfil do usuário não encontrado.");
      }

      if (profileAtual.role !== "QUALIDADE") {
        throw new Error("Acesso permitido apenas para perfil de Qualidade.");
      }

      setProfile(profileAtual);

      const { data, error: errorOcorrencias } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("created_at", { ascending: false });

      if (errorOcorrencias) {
        throw errorOcorrencias;
      }

      setOcorrencias((data || []) as Ocorrencia[]);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar a visão da Qualidade.");
      setOcorrencias([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filaQualidade = useMemo(
    () =>
      ocorrencias.filter((item) =>
        ["Aberta", "Em análise pela Qualidade", "Aguardando validação"].includes(item.status)
      ),
    [ocorrencias]
  );

  const aguardandoDirecionamento = useMemo(
    () =>
      ocorrencias.filter(
        (item) =>
          (item.status === "Aberta" || item.status === "Em análise pela Qualidade") &&
          !item.setor_destino
      ),
    [ocorrencias]
  );

  const aguardandoValidacao = useMemo(
    () => ocorrencias.filter((item) => item.status === "Aguardando validação"),
    [ocorrencias]
  );

  if (carregando) {
    return <div className="text-sm text-slate-500">Carregando visão da Qualidade...</div>;
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        {erro}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Módulo Qualidade
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Análise, classificação e governança do fluxo
        </h2>

        <p className="mt-3 max-w-4xl text-slate-600">
          Painel central para triagem das ocorrências, definição de gravidade,
          encaminhamento ao setor responsável e validação final das ações corretivas.
        </p>

        {profile ? (
          <div className="mt-5">
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              Usuário: {profile.nome || profile.email || "—"}
            </span>
          </div>
        ) : null}
      </section>

      <DashboardCards
        items={[
          { titulo: "Fila da Qualidade", valor: filaQualidade.length },
          { titulo: "Sem direcionamento", valor: aguardandoDirecionamento.length },
          { titulo: "Aguardando validação", valor: aguardandoValidacao.length },
          { titulo: "Total monitorado", valor: ocorrencias.length },
        ]}
      />

      <OcorrenciaList
        titulo="Fila da Qualidade"
        descricao="Ocorrências que exigem análise, classificação, direcionamento ou validação."
        ocorrencias={filaQualidade}
      />

      <OcorrenciaList
        titulo="Pendentes de direcionamento"
        descricao="Registros ainda sem definição de setor destino."
        ocorrencias={aguardandoDirecionamento}
        vazioTexto="Não há ocorrências pendentes de direcionamento."
      />

      <OcorrenciaList
        titulo="Aguardando validação da Qualidade"
        descricao="Ocorrências que retornaram do setor para conferência e encerramento."
        ocorrencias={aguardandoValidacao}
        vazioTexto="Não há ocorrências aguardando validação."
      />
    </div>
  );
}