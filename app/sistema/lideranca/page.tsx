"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";

type Role = "qualidade" | "lider" | "diretoria" | string;

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: Role | null;
  setor: string | null;
};

type Ocorrencia = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  status: string | null;
  resposta_lideranca: string | null;
  data_resposta_lideranca: string | null;
  validado_qualidade: boolean | null;
  data_validacao_qualidade: string | null;
  observacao_qualidade: string | null;
  encaminhado_por_qualidade: boolean | null;
};

type FormResposta = {
  resposta_lideranca: string;
};

export default function LiderancaPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [formularios, setFormularios] = useState<Record<number, FormResposta>>({});

  useEffect(() => {
    carregarPagina();
  }, []);

  async function carregarPagina() {
    try {
      setCarregando(true);
      setErro(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, email, role, setor")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const perfil = profileData as Profile;
      setProfile(perfil);

      if (perfil.role !== "lider") {
        router.replace("/sistema");
        return;
      }

      if (!perfil.setor || !perfil.setor.trim()) {
        setErro(
          "Seu perfil de liderança está sem setor vinculado. Cadastre o setor no profile para visualizar as ocorrências."
        );
        setOcorrencias([]);
        return;
      }

      const { data, error } = await supabase
        .from("ocorrencias")
        .select(`
          id,
          titulo,
          descricao,
          setor_origem,
          setor_responsavel,
          gravidade,
          status,
          resposta_lideranca,
          data_resposta_lideranca,
          validado_qualidade,
          data_validacao_qualidade,
          observacao_qualidade,
          encaminhado_por_qualidade
        `)
        .eq("setor_responsavel", perfil.setor)
        .order("id", { ascending: false });

      if (error) throw error;

      const lista = (data || []) as Ocorrencia[];
      setOcorrencias(lista);

      const formulariosIniciais: Record<number, FormResposta> = {};
      lista.forEach((item) => {
        formulariosIniciais[item.id] = {
          resposta_lideranca: item.resposta_lideranca || "",
        };
      });
      setFormularios(formulariosIniciais);
    } catch (error: any) {
      console.error("Erro ao carregar painel da liderança:", error);
      setErro(error?.message || "Não foi possível carregar o painel da liderança.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarFormulario(ocorrenciaId: number, valor: string) {
    setFormularios((prev) => ({
      ...prev,
      [ocorrenciaId]: {
        resposta_lideranca: valor,
      },
    }));
  }

  async function responderOcorrencia(ocorrenciaId: number) {
    const resposta = formularios[ocorrenciaId]?.resposta_lideranca?.trim();

    if (!resposta) {
      setErro("Preencha a resposta da liderança antes de enviar.");
      setSucesso(null);
      return;
    }

    try {
      setSalvandoId(ocorrenciaId);
      setErro(null);
      setSucesso(null);

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          resposta_lideranca: resposta,
          data_resposta_lideranca: new Date().toISOString(),
          validado_qualidade: false,
          data_validacao_qualidade: null,
          status: "Em validação pela Qualidade",
        })
        .eq("id", ocorrenciaId);

      if (error) throw error;

      setSucesso(`Resposta da ocorrência #${ocorrenciaId} enviada para validação da Qualidade.`);
      await carregarPagina();
    } catch (error: any) {
      console.error("Erro ao responder ocorrência:", error);
      setErro(error?.message || "Não foi possível enviar a resposta da liderança.");
    } finally {
      setSalvandoId(null);
    }
  }

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const termo = busca.trim().toLowerCase();

      const matchBusca =
        !termo ||
        String(item.id).includes(termo) ||
        (item.titulo || "").toLowerCase().includes(termo) ||
        (item.descricao || "").toLowerCase().includes(termo) ||
        (item.setor_origem || "").toLowerCase().includes(termo) ||
        (item.setor_responsavel || "").toLowerCase().includes(termo) ||
        (item.gravidade || "").toLowerCase().includes(termo) ||
        (item.status || "").toLowerCase().includes(termo);

      const matchStatus =
        filtroStatus === "Todos" ? true : (item.status || "") === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [ocorrencias, busca, filtroStatus]);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const aguardandoResposta = ocorrencias.filter(
      (o) => o.status === "Encaminhada para tratativa"
    ).length;
    const emValidacao = ocorrencias.filter(
      (o) => o.status === "Em validação pela Qualidade"
    ).length;
    const devolvidas = ocorrencias.filter(
      (o) => o.status === "Devolvida para ajuste"
    ).length;
    const concluidas = ocorrencias.filter((o) => o.status === "Concluída").length;

    return {
      total,
      aguardandoResposta,
      emValidacao,
      devolvidas,
      concluidas,
    };
  }, [ocorrencias]);

  function badgeStatus(status?: string | null) {
    const valor = status || "Sem status";

    if (valor === "Concluída") {
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    }

    if (valor === "Encaminhada para tratativa") {
      return "bg-cyan-100 text-cyan-800 border border-cyan-200";
    }

    if (valor === "Em validação pela Qualidade") {
      return "bg-amber-100 text-amber-800 border border-amber-200";
    }

    if (valor === "Devolvida para ajuste") {
      return "bg-red-100 text-red-800 border border-red-200";
    }

    return "bg-slate-100 text-slate-700 border border-slate-200";
  }

  function badgeGravidade(gravidade?: string | null) {
    const valor = (gravidade || "").toLowerCase();

    if (valor.includes("grave") || valor.includes("alta")) {
      return "bg-red-100 text-red-800 border border-red-200";
    }

    if (valor.includes("moder")) {
      return "bg-amber-100 text-amber-800 border border-amber-200";
    }

    return "bg-cyan-100 text-cyan-800 border border-cyan-200";
  }

  function podeResponder(item: Ocorrencia) {
    return (
      item.status === "Encaminhada para tratativa" ||
      item.status === "Devolvida para ajuste"
    );
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <h1 className="text-xl font-bold text-slate-800">Carregando painel da Liderança</h1>
          <p className="mt-2 text-sm text-slate-500">
            Aguarde enquanto preparamos as ocorrências do seu setor.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Módulo da Liderança</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Tratativa das ocorrências do setor
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-500">
                Esta área exibe somente as ocorrências encaminhadas ao seu setor.
                A liderança responde a tratativa e o caso retorna automaticamente
                para a Qualidade validar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/sistema")}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar ao sistema
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Ir para dashboard
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Liderança logada
              </p>
              <p className="mt-2 text-base font-bold text-slate-800">
                {profile?.nome || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Perfil
              </p>
              <p className="mt-2 text-base font-bold text-slate-800">
                {profile?.role || "Não informado"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Setor vinculado
              </p>
              <p className="mt-2 text-base font-bold text-slate-800">
                {profile?.setor || "Não informado"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          <CardIndicador titulo="Total do setor" valor={indicadores.total} />
          <CardIndicador titulo="Aguardando resposta" valor={indicadores.aguardandoResposta} />
          <CardIndicador titulo="Em validação" valor={indicadores.emValidacao} />
          <CardIndicador titulo="Devolvidas" valor={indicadores.devolvidas} />
          <CardIndicador titulo="Concluídas" valor={indicadores.concluidas} />
        </section>

        {erro ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {sucesso}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Ocorrências do setor</h2>
              <p className="mt-1 text-sm text-slate-500">
                Responda somente as ocorrências encaminhadas ao seu setor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full lg:w-auto">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, gravidade, setor ou status"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 min-w-[260px]"
              />

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="Todos">Todos os status</option>
                <option value="Encaminhada para tratativa">Encaminhada para tratativa</option>
                <option value="Em validação pela Qualidade">Em validação pela Qualidade</option>
                <option value="Devolvida para ajuste">Devolvida para ajuste</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>
          </div>
        </section>

        {ocorrenciasFiltradas.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">Nenhuma ocorrência encontrada</h3>
            <p className="mt-2 text-sm text-slate-500">
              Não há ocorrências vinculadas ao seu setor com os filtros aplicados.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {ocorrenciasFiltradas.map((item) => {
              const form = formularios[item.id] || {
                resposta_lideranca: item.resposta_lideranca || "",
              };

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Ocorrência #{item.id}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(item.status)}`}>
                            {item.status || "Sem status"}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeGravidade(item.gravidade)}`}>
                            Gravidade: {item.gravidade || "Não informada"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-800">
                            {item.titulo || "Ocorrência sem título"}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500 whitespace-pre-line">
                            {item.descricao || "Sem descrição informada."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                          <InfoCard titulo="Setor de origem" valor={item.setor_origem} />
                          <InfoCard titulo="Setor responsável" valor={item.setor_responsavel} />
                          <InfoCard titulo="Observação da Qualidade" valor={item.observacao_qualidade} />
                          <InfoCard
                            titulo="Data da última resposta"
                            valor={formatarData(item.data_resposta_lideranca)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Resposta da liderança
                      </label>
                      <textarea
                        rows={6}
                        value={form.resposta_lideranca}
                        onChange={(e) => atualizarFormulario(item.id, e.target.value)}
                        disabled={!podeResponder(item)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 resize-none disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Descreva a análise do setor, causa identificada, ação adotada, responsável e devolutiva para a Qualidade"
                      />
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="text-sm text-slate-500">
                        {item.status === "Em validação pela Qualidade" ? (
                          <span>
                            Esta ocorrência já foi respondida e está aguardando validação da Qualidade.
                          </span>
                        ) : item.status === "Concluída" ? (
                          <span>
                            Esta ocorrência já foi concluída pela Qualidade.
                          </span>
                        ) : item.status === "Devolvida para ajuste" ? (
                          <span>
                            A Qualidade devolveu esta ocorrência para complemento da liderança.
                          </span>
                        ) : (
                          <span>
                            Após enviar a resposta, a ocorrência retornará automaticamente para validação da Qualidade.
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => responderOcorrencia(item.id)}
                        disabled={salvandoId === item.id || !podeResponder(item)}
                        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {salvandoId === item.id ? "Enviando..." : "Enviar para validação da Qualidade"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function CardIndicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-800">{valor}</h3>
    </div>
  );
}

function InfoCard({ titulo, valor }: { titulo: string; valor?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
        {valor && String(valor).trim() !== "" ? valor : "Não informado"}
      </p>
    </div>
  );
}

function formatarData(valor?: string | null) {
  if (!valor) return "Não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "Não informada";

  return data.toLocaleString("pt-BR");
}