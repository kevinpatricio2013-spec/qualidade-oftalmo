"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { getAuthenticatedProfile } from "@/src/lib/auth";
import DashboardCards from "@/src/components/sistema/DashboardCards";
import OcorrenciaList from "@/src/components/sistema/OcorrenciaList";
import { SETORES } from "@/src/lib/qualidade";
import type { Ocorrencia } from "@/src/types/ocorrencia";
import type { Profile } from "@/src/types/profile";

export default function SistemaLiderancaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [setorSelecionado, setSetorSelecionado] = useState("Centro Cirúrgico");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      // ✅ NOVO PADRÃO
      const { profile: profileAtual, error } = await getAuthenticatedProfile();

      if (error) {
        throw new Error(error);
      }

      if (!profileAtual) {
        throw new Error("Perfil do usuário não encontrado.");
      }

      setProfile(profileAtual);

      let setorFiltro = "Centro Cirúrgico";

      // ✅ REGRA DE NEGÓCIO
      if (profileAtual.role === "LIDERANCA") {
        setorFiltro = profileAtual.setor || "";
        setSetorSelecionado(profileAtual.setor || "");
      }

      const { data, error: errorOcorrencias } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("created_at", { ascending: false });

      if (errorOcorrencias) {
        throw errorOcorrencias;
      }

      const lista = (data || []) as Ocorrencia[];

      // ✅ FILTRO POR PERFIL
      if (profileAtual.role === "LIDERANCA") {
        setOcorrencias(
          lista.filter((item) => item.setor_destino === setorFiltro)
        );
      } else {
        setOcorrencias(lista);
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar a visão da Liderança.");
      setOcorrencias([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const listaFiltrada = useMemo(() => {
    if (!profile) return [];

    if (profile.role === "LIDERANCA") {
      return ocorrencias;
    }

    return ocorrencias.filter(
      (item) => item.setor_destino === setorSelecionado
    );
  }, [ocorrencias, setorSelecionado, profile]);

  const emTratativa = useMemo(
    () => listaFiltrada.filter((item) => item.status === "Em tratativa"),
    [listaFiltrada]
  );

  const direcionadas = useMemo(
    () =>
      listaFiltrada.filter(
        (item) => item.status === "Direcionada ao setor"
      ),
    [listaFiltrada]
  );

  const aguardandoValidacao = useMemo(
    () =>
      listaFiltrada.filter(
        (item) => item.status === "Aguardando validação"
      ),
    [listaFiltrada]
  );

  if (carregando) {
    return (
      <div className="text-sm text-slate-500">
        Carregando visão da Liderança...
      </div>
    );
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
          Módulo Liderança
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Gestão setorial de tratativas e prazos
        </h2>

        <p className="mt-3 max-w-4xl text-slate-600">
          Ambiente para que cada liderança acompanhe apenas as ocorrências
          direcionadas ao seu setor, com visão prática do andamento da tratativa.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            Perfil: {profile?.role || "—"}
          </span>

          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            Setor: {profile?.setor || "—"}
          </span>
        </div>

        {/* ✅ QUALIDADE pode escolher setor */}
        {profile?.role === "QUALIDADE" && (
          <div className="mt-6 max-w-md">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Selecionar setor
            </label>

            <select
              value={setorSelecionado}
              onChange={(e) => setSetorSelecionado(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600"
            >
              {SETORES.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <DashboardCards
        items={[
          { titulo: "Total do setor", valor: listaFiltrada.length },
          { titulo: "Direcionadas ao setor", valor: direcionadas.length },
          { titulo: "Em tratativa", valor: emTratativa.length },
          { titulo: "Aguardando validação", valor: aguardandoValidacao.length },
        ]}
      />

      <OcorrenciaList
        titulo={`Ocorrências do setor: ${
          profile?.role === "LIDERANCA"
            ? profile?.setor || "—"
            : setorSelecionado
        }`}
        descricao="Fila operacional do setor selecionado."
        ocorrencias={listaFiltrada}
        vazioTexto="Não há ocorrências para este setor."
      />
    </div>
  );
}