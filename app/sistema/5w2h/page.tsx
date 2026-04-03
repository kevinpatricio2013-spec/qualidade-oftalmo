"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo?: string | null;
  descricao?: string | null;
  setor_origem?: string | null;
  gravidade?: string | null;
  status?: string | null;
};

type Plano5W2H = {
  id: number;
  ocorrencia_id: number;
  what: string;
  why: string | null;
  where_field: string | null;
  when_field: string | null;
  who: string | null;
  how: string | null;
  how_much: string | null;
  status: "Pendente" | "Em andamento" | "Concluído";
  created_at?: string;
  updated_at?: string;
  ocorrencias?: {
    id: number;
    titulo?: string | null;
    descricao?: string | null;
    setor_origem?: string | null;
    gravidade?: string | null;
    status?: string | null;
  } | null;
};

type FormState = {
  ocorrencia_id: string;
  what: string;
  why: string;
  where_field: string;
  when_field: string;
  who: string;
  how: string;
  how_much: string;
  status: "Pendente" | "Em andamento" | "Concluído";
};

const initialForm: FormState = {
  ocorrencia_id: "",
  what: "",
  why: "",
  where_field: "",
  when_field: "",
  who: "",
  how: "",
  how_much: "",
  status: "Pendente",
};

export default function Plano5W2HPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [planos, setPlanos] = useState<Plano5W2H[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("Todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    verificarUsuario();
    carregarTudo();
  }, []);

  async function verificarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/");
    }
  }

  async function carregarTudo() {
    try {
      setCarregando(true);
      setErro(null);

      const [ocorrenciasResponse, planosResponse] = await Promise.all([
        supabase
          .from("ocorrencias")
          .select("id, titulo, descricao, setor_origem, gravidade, status")
          .order("id", { ascending: false }),

        supabase
          .from("plano_acao_5w2h")
          .select(`
            id,
            ocorrencia_id,
            what,
            why,
            where_field,
            when_field,
            who,
            how,
            how_much,
            status,
            created_at,
            updated_at,
            ocorrencias:ocorrencia_id (
              id,
              titulo,
              descricao,
              setor_origem,
              gravidade,
              status
            )
          `)
          .order("id", { ascending: false }),
      ]);

      if (ocorrenciasResponse.error) throw ocorrenciasResponse.error;
      if (planosResponse.error) throw planosResponse.error;

      setOcorrencias((ocorrenciasResponse.data || []) as Ocorrencia[]);
      setPlanos((planosResponse.data || []) as unknown as Plano5W2H[]);
    } catch (error: any) {
      console.error("Erro ao carregar 5W2H:", error);
      setErro(error?.message || "Não foi possível carregar os dados do 5W2H.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(initialForm);
    setEditandoId(null);
    setErro(null);
    setSucesso(null);
  }

  async function salvarPlano(e: React.FormEvent) {
    e.preventDefault();

    if (!form.ocorrencia_id || !form.what.trim()) {
      setErro("Preencha a ocorrência e o campo O que será feito.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);
      setSucesso(null);

      const payload = {
        ocorrencia_id: Number(form.ocorrencia_id),
        what: form.what.trim(),
        why: form.why.trim() || null,
        where_field: form.where_field.trim() || null,
        when_field: form.when_field || null,
        who: form.who.trim() || null,
        how: form.how.trim() || null,
        how_much: form.how_much.trim() || null,
        status: form.status,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("plano_acao_5w2h")
          .update(payload)
          .eq("id", editandoId);

        if (error) throw error;

        setSucesso("Plano 5W2H atualizado com sucesso.");
      } else {
        const { error } = await supabase
          .from("plano_acao_5w2h")
          .insert([payload]);

        if (error) throw error;

        setSucesso("Plano 5W2H criado com sucesso.");
      }

      limparFormulario();
      await carregarTudo();
    } catch (error: any) {
      console.error("Erro ao salvar plano 5W2H:", error);
      setErro(error?.message || "Não foi possível salvar o plano 5W2H.");
    } finally {
      setSalvando(false);
    }
  }

  function editarPlano(plano: Plano5W2H) {
    setEditandoId(plano.id);
    setErro(null);
    setSucesso(null);

    setForm({
      ocorrencia_id: String(plano.ocorrencia_id),
      what: plano.what || "",
      why: plano.why || "",
      where_field: plano.where_field || "",
      when_field: plano.when_field || "",
      who: plano.who || "",
      how: plano.how || "",
      how_much: plano.how_much || "",
      status: plano.status || "Pendente",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirPlano(id: number) {
    const confirmar = window.confirm("Deseja realmente excluir este plano 5W2H?");
    if (!confirmar) return;

    try {
      setErro(null);
      setSucesso(null);

      const { error } = await supabase
        .from("plano_acao_5w2h")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (editandoId === id) {
        limparFormulario();
      }

      setSucesso("Plano 5W2H excluído com sucesso.");
      await carregarTudo();
    } catch (error: any) {
      console.error("Erro ao excluir plano:", error);
      setErro(error?.message || "Não foi possível excluir o plano.");
    }
  }

  const planosFiltrados = useMemo(() => {
    return planos.filter((plano) => {
      const termo = busca.trim().toLowerCase();

      const matchBusca =
        !termo ||
        plano.what?.toLowerCase().includes(termo) ||
        plano.why?.toLowerCase().includes(termo) ||
        plano.who?.toLowerCase().includes(termo) ||
        plano.ocorrencias?.titulo?.toLowerCase().includes(termo) ||
        plano.ocorrencias?.descricao?.toLowerCase().includes(termo) ||
        plano.ocorrencias?.setor_origem?.toLowerCase().includes(termo) ||
        plano.ocorrencias?.gravidade?.toLowerCase().includes(termo) ||
        String(plano.ocorrencia_id).includes(termo);

      const matchStatus =
        filtroStatus === "Todos" ? true : plano.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [planos, busca, filtroStatus]);

  function badgeStatus(status: string) {
    if (status === "Concluído") {
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    }
    if (status === "Em andamento") {
      return "bg-amber-100 text-amber-800 border border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }

  function badgeGravidade(gravidade?: string | null) {
    if (!gravidade) {
      return "bg-slate-100 text-slate-700 border border-slate-200";
    }

    const valor = gravidade.toLowerCase();

    if (valor.includes("grave") || valor.includes("alta")) {
      return "bg-red-100 text-red-800 border border-red-200";
    }

    if (valor.includes("moder")) {
      return "bg-amber-100 text-amber-800 border border-amber-200";
    }

    return "bg-cyan-100 text-cyan-800 border border-cyan-200";
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 w-full max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4" />
          <h1 className="text-xl font-bold text-slate-800">Carregando 5W2H</h1>
          <p className="mt-2 text-sm text-slate-500">
            Aguarde enquanto preparamos os dados.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Plano de ação</p>
              <h1 className="text-3xl font-bold text-slate-800 mt-2">5W2H</h1>
              <p className="text-sm text-slate-500 mt-3 max-w-3xl">
                Estrutura completa para planejamento, definição de responsáveis,
                prazo, execução e acompanhamento das ações vinculadas às ocorrências.
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
                onClick={limparFormulario}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Novo plano 5W2H
              </button>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-bold text-slate-800">
                  {editandoId ? "Editar plano" : "Novo plano"}
                </h2>
                {editandoId ? (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Edição
                  </span>
                ) : null}
              </div>

              <form onSubmit={salvarPlano} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ocorrência
                  </label>
                  <select
                    value={form.ocorrencia_id}
                    onChange={(e) => atualizarCampo("ocorrencia_id", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione uma ocorrência</option>
                    {ocorrencias.map((ocorrencia) => (
                      <option key={ocorrencia.id} value={ocorrencia.id}>
                        #{ocorrencia.id} - {ocorrencia.titulo || ocorrencia.descricao || "Ocorrência sem título"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    What — O que será feito
                  </label>
                  <textarea
                    value={form.what}
                    onChange={(e) => atualizarCampo("what", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    placeholder="Descreva a ação principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Why — Por que
                  </label>
                  <textarea
                    value={form.why}
                    onChange={(e) => atualizarCampo("why", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    placeholder="Justificativa da ação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Where — Onde
                  </label>
                  <input
                    type="text"
                    value={form.where_field}
                    onChange={(e) => atualizarCampo("where_field", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                    placeholder="Ex.: CME, Centro Cirúrgico, Recepção"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    When — Quando
                  </label>
                  <input
                    type="date"
                    value={form.when_field}
                    onChange={(e) => atualizarCampo("when_field", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Who — Responsável
                  </label>
                  <input
                    type="text"
                    value={form.who}
                    onChange={(e) => atualizarCampo("who", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    How — Como será feito
                  </label>
                  <textarea
                    value={form.how}
                    onChange={(e) => atualizarCampo("how", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    placeholder="Método, execução, etapas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    How Much — Custo / recurso
                  </label>
                  <input
                    type="text"
                    value={form.how_much}
                    onChange={(e) => atualizarCampo("how_much", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                    placeholder="Ex.: Sem custo, R$ 500, treinamento interno"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status do plano
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      atualizarCampo(
                        "status",
                        e.target.value as "Pendente" | "Em andamento" | "Concluído"
                      )
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {salvando
                      ? "Salvando..."
                      : editandoId
                      ? "Atualizar plano"
                      : "Salvar plano"}
                  </button>

                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Limpar
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Planos cadastrados</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Visualize, filtre e acompanhe os planos 5W2H vinculados às ocorrências.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por ação, ocorrência, setor ou gravidade"
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 min-w-[280px]"
                  />

                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="Todos">Todos os status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>
            </div>

            {planosFiltrados.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 text-center">
                <h3 className="text-xl font-bold text-slate-800">Nenhum plano encontrado</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Cadastre um novo plano 5W2H ou ajuste os filtros.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {planosFiltrados.map((plano) => (
                  <div
                    key={plano.id}
                    className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Plano #{plano.id}
                          </span>

                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Ocorrência #{plano.ocorrencia_id}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(plano.status)}`}>
                            {plano.status}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeGravidade(plano.ocorrencias?.gravidade)}`}>
                            Gravidade: {plano.ocorrencias?.gravidade || "Não informada"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            {plano.what}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {plano.ocorrencias?.titulo ||
                              plano.ocorrencias?.descricao ||
                              "Ocorrência vinculada"}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <InfoCard titulo="Título da ocorrência" valor={plano.ocorrencias?.titulo} />
                          <InfoCard titulo="Descrição da ocorrência" valor={plano.ocorrencias?.descricao} />
                          <InfoCard titulo="Setor de origem" valor={plano.ocorrencias?.setor_origem} />
                          <InfoCard titulo="Gravidade" valor={plano.ocorrencias?.gravidade} />
                          <InfoCard titulo="Por que" valor={plano.why} />
                          <InfoCard titulo="Onde" valor={plano.where_field} />
                          <InfoCard titulo="Quando" valor={plano.when_field} />
                          <InfoCard titulo="Responsável" valor={plano.who} />
                          <InfoCard titulo="Como" valor={plano.how} />
                          <InfoCard titulo="Custo / recurso" valor={plano.how_much} />
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-3 lg:min-w-[150px]">
                        <button
                          type="button"
                          onClick={() => editarPlano(plano)}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirPlano(plano.id)}
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ titulo, valor }: { titulo: string; valor?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
        {valor && String(valor).trim() !== "" ? valor : "Não informado"}
      </p>
    </div>
  );
}