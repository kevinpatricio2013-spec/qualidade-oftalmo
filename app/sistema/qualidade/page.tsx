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

type FormDirecionamento = {
  setor_responsavel: string;
  observacao_qualidade: string;
};

const setoresDisponiveis = [
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
  "Farmácia/OPME",
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

export default function QualidadePage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroFila, setFiltroFila] = useState("Todas");

  const [formularios, setFormularios] = useState<Record<number, FormDirecionamento>>({});

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

      if (perfil.role !== "qualidade" && perfil.role !== "diretoria") {
        router.replace("/sistema");
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
        .order("id", { ascending: false });

      if (error) throw error;

      const lista = (data || []) as Ocorrencia[];
      setOcorrencias(lista);

      const formulariosIniciais: Record<number, FormDirecionamento> = {};
      lista.forEach((item) => {
        formulariosIniciais[item.id] = {
          setor_responsavel: item.setor_responsavel || "",
          observacao_qualidade: item.observacao_qualidade || "",
        };
      });
      setFormularios(formulariosIniciais);
    } catch (error: any) {
      console.error("Erro ao carregar painel da qualidade:", error);
      setErro(error?.message || "Não foi possível carregar o painel da qualidade.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarFormulario(
    ocorrenciaId: number,
    campo: keyof FormDirecionamento,
    valor: string
  ) {
    setFormularios((prev) => ({
      ...prev,
      [ocorrenciaId]: {
        ...(prev[ocorrenciaId] || { setor_responsavel: "", observacao_qualidade: "" }),
        [campo]: valor,
      },
    }));
  }

  async function encaminharParaSetor(ocorrenciaId: number) {
    const form = formularios[ocorrenciaId];

    if (!form?.setor_responsavel) {
      setErro("Selecione o setor responsável antes de encaminhar.");
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
          setor_responsavel: form.setor_responsavel,
          observacao_qualidade: form.observacao_qualidade || null,
          encaminhado_por_qualidade: true,
          validado_qualidade: false,
          data_validacao_qualidade: null,
          status: "Encaminhada para tratativa",
        })
        .eq("id", ocorrenciaId);

      if (error) throw error;

      setSucesso(`Ocorrência #${ocorrenciaId} encaminhada com sucesso.`);
      await carregarPagina();
    } catch (error: any) {
      console.error("Erro ao encaminhar ocorrência:", error);
      setErro(error?.message || "Não foi possível encaminhar a ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function devolverParaAjuste(ocorrenciaId: number) {
    const form = formularios[ocorrenciaId];

    try {
      setSalvandoId(ocorrenciaId);
      setErro(null);
      setSucesso(null);

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          observacao_qualidade: form?.observacao_qualidade || null,
          validado_qualidade: false,
          data_validacao_qualidade: null,
          status: "Devolvida para ajuste",
        })
        .eq("id", ocorrenciaId);

      if (error) throw error;

      setSucesso(`Ocorrência #${ocorrenciaId} devolvida para ajuste.`);
      await carregarPagina();
    } catch (error: any) {
      console.error("Erro ao devolver ocorrência:", error);
      setErro(error?.message || "Não foi possível devolver a ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function validarConclusao(ocorrenciaId: number) {
    const form = formularios[ocorrenciaId];

    try {
      setSalvandoId(ocorrenciaId);
      setErro(null);
      setSucesso(null);

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          observacao_qualidade: form?.observacao_qualidade || null,
          validado_qualidade: true,
          data_validacao_qualidade: new Date().toISOString(),
          status: "Concluída",
        })
        .eq("id", ocorrenciaId);

      if (error) throw error;

      setSucesso(`Ocorrência #${ocorrenciaId} validada e concluída.`);
      await carregarPagina();
    } catch (error: any) {
      console.error("Erro ao validar ocorrência:", error);
      setErro(error?.message || "Não foi possível validar a ocorrência.");
    } finally {
      setSalvandoId(null);
    }
  }

  function filaDaOcorrencia(item: Ocorrencia) {
    const status = item.status || "";

    if (!item.encaminhado_por_qualidade && !item.setor_responsavel) {
      return "Triagem da Qualidade";
    }

    if (status === "Encaminhada para tratativa") {
      return "Com a Liderança";
    }

    if (
      status === "Em validação pela Qualidade" ||
      status === "Concluída" ||
      status === "Devolvida para ajuste"
    ) {
      return "Validação da Qualidade";
    }

    if (item.resposta_lideranca) {
      return "Validação da Qualidade";
    }

    return "Triagem da Qualidade";
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

      const fila = filaDaOcorrencia(item);
      const matchFila = filtroFila === "Todas" ? true : fila === filtroFila;

      return matchBusca && matchStatus && matchFila;
    });
  }, [ocorrencias, busca, filtroStatus, filtroFila]);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const triagem = ocorrencias.filter((o) => filaDaOcorrencia(o) === "Triagem da Qualidade").length;
    const lideranca = ocorrencias.filter((o) => filaDaOcorrencia(o) === "Com a Liderança").length;
    const validacao = ocorrencias.filter((o) => filaDaOcorrencia(o) === "Validação da Qualidade").length;
    const concluidas = ocorrencias.filter((o) => o.status === "Concluída").length;

    return { total, triagem, lideranca, validacao, concluidas };
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

  function badgeFila(fila: string) {
    if (fila === "Triagem da Qualidade") {
      return "bg-violet-100 text-violet-800 border border-violet-200";
    }

    if (fila === "Com a Liderança") {
      return "bg-cyan-100 text-cyan-800 border border-cyan-200";
    }

    return "bg-amber-100 text-amber-800 border border-amber-200";
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <h1 className="text-xl font-bold text-slate-800">Carregando painel da Qualidade</h1>
          <p className="mt-2 text-sm text-slate-500">
            Aguarde enquanto preparamos as ocorrências.
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
              <p className="text-sm font-semibold text-emerald-700">Módulo da Qualidade</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800">Triagem e validação das ocorrências</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-500">
                A Qualidade analisa as ocorrências, define o setor responsável pela tratativa,
                acompanha o retorno da liderança e realiza a validação final.
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
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          <CardIndicador titulo="Total" valor={indicadores.total} />
          <CardIndicador titulo="Triagem Qualidade" valor={indicadores.triagem} />
          <CardIndicador titulo="Com a Liderança" valor={indicadores.lideranca} />
          <CardIndicador titulo="Em validação" valor={indicadores.validacao} />
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
              <h2 className="text-xl font-bold text-slate-800">Ocorrências</h2>
              <p className="mt-1 text-sm text-slate-500">
                Direcione, acompanhe retorno da liderança e valide a conclusão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, setor, gravidade ou status"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 min-w-[260px]"
              />

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="Todos">Todos os status</option>
                <option value="Aberta">Aberta</option>
                <option value="Em análise pela Qualidade">Em análise pela Qualidade</option>
                <option value="Encaminhada para tratativa">Encaminhada para tratativa</option>
                <option value="Em validação pela Qualidade">Em validação pela Qualidade</option>
                <option value="Concluída">Concluída</option>
                <option value="Devolvida para ajuste">Devolvida para ajuste</option>
              </select>

              <select
                value={filtroFila}
                onChange={(e) => setFiltroFila(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="Todas">Todas as filas</option>
                <option value="Triagem da Qualidade">Triagem da Qualidade</option>
                <option value="Com a Liderança">Com a Liderança</option>
                <option value="Validação da Qualidade">Validação da Qualidade</option>
              </select>
            </div>
          </div>
        </section>

        {ocorrenciasFiltradas.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">Nenhuma ocorrência encontrada</h3>
            <p className="mt-2 text-sm text-slate-500">
              Ajuste os filtros ou aguarde novos registros.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {ocorrenciasFiltradas.map((item) => {
              const fila = filaDaOcorrencia(item);
              const form = formularios[item.id] || {
                setor_responsavel: item.setor_responsavel || "",
                observacao_qualidade: item.observacao_qualidade || "",
              };

              const temRespostaLideranca = !!item.resposta_lideranca?.trim();

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Ocorrência #{item.id}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(item.status)}`}>
                          {item.status || "Sem status"}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeFila(fila)}`}>
                          {fila}
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
                        <InfoCard titulo="Validado pela Qualidade" valor={item.validado_qualidade ? "Sim" : "Não"} />
                        <InfoCard
                          titulo="Resposta da liderança"
                          valor={item.resposta_lideranca || "Aguardando retorno do setor responsável"}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Setor responsável
                          </label>
                          <select
                            value={form.setor_responsavel}
                            onChange={(e) =>
                              atualizarFormulario(item.id, "setor_responsavel", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                          >
                            <option value="">Selecione o setor</option>
                            {setoresDisponiveis.map((setor) => (
                              <option key={setor} value={setor}>
                                {setor}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Observação da Qualidade
                          </label>
                          <textarea
                            rows={4}
                            value={form.observacao_qualidade}
                            onChange={(e) =>
                              atualizarFormulario(item.id, "observacao_qualidade", e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 resize-none"
                            placeholder="Oriente o setor responsável ou registre observações da validação"
                          />
                        </div>
                      </div>

                      {temRespostaLideranca ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-semibold text-amber-800">
                            Retorno da liderança recebido
                          </p>
                          <p className="mt-2 text-sm text-amber-700 whitespace-pre-line">
                            {item.resposta_lideranca}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[220px]">
                      <button
                        type="button"
                        disabled={salvandoId === item.id}
                        onClick={() => encaminharParaSetor(item.id)}
                        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {salvandoId === item.id ? "Salvando..." : "Encaminhar para setor"}
                      </button>

                      <button
                        type="button"
                        disabled={salvandoId === item.id || !temRespostaLideranca}
                        onClick={() => devolverParaAjuste(item.id)}
                        className="rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Devolver para ajuste
                      </button>

                      <button
                        type="button"
                        disabled={salvandoId === item.id || !temRespostaLideranca}
                        onClick={() => validarConclusao(item.id)}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Validar e concluir
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