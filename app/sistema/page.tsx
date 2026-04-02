"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BarraSistema from "../../src/components/BarraSistema";
import { supabase } from "../../src/lib/supabase";
import {
  podeFiltrarTodosSetores,
  podeVerTudo,
} from "../../src/lib/permissoes";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string | null;
  setor_origem: string | null;
  setor_destino: string | null;
  status: string | null;
  gravidade: string | null;
  tipo_ocorrencia: string | null;
  created_at: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

export default function SistemaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState("TODOS");

  async function carregarOcorrencias() {
    try {
      setCarregando(true);
      setErro("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErro("Usuário não autenticado.");
        setCarregando(false);
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("id, nome, email, role, setor")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil) {
        setErro("Não foi possível carregar o perfil do usuário.");
        setCarregando(false);
        return;
      }

      setProfile(perfil);

      let query = supabase
        .from("ocorrencias")
        .select(
          "id, titulo, descricao, setor_origem, setor_destino, status, gravidade, tipo_ocorrencia, created_at"
        )
        .order("id", { ascending: false });

      if (!podeVerTudo(perfil.role)) {
        query = query.eq("setor_destino", perfil.setor);
      }

      const { data, error } = await query;

      if (error) {
        setErro("Não foi possível carregar as ocorrências.");
        setCarregando(false);
        return;
      }

      setOcorrencias(data || []);
      setCarregando(false);
    } catch (e) {
      console.error("Erro ao carregar ocorrências:", e);
      setErro("Ocorreu um erro ao carregar a lista de ocorrências.");
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const setoresDisponiveis = useMemo(() => {
    const base: string[] = ocorrencias
      .map((item) => item.setor_destino)
      .filter((setor): setor is string => Boolean(setor));

    return Array.from(new Set(base)).sort((a, b) => a.localeCompare(b));
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const textoBusca = filtroBusca.trim().toLowerCase();

      const matchBusca =
        textoBusca === ""
          ? true
          : (item.titulo || "").toLowerCase().includes(textoBusca) ||
            (item.descricao || "").toLowerCase().includes(textoBusca) ||
            String(item.id).includes(textoBusca) ||
            (item.tipo_ocorrencia || "").toLowerCase().includes(textoBusca);

      const matchSetor =
        filtroSetor === "TODOS" ? true : item.setor_destino === filtroSetor;

      const matchStatus =
        filtroStatus === "TODOS" ? true : item.status === filtroStatus;

      const matchGravidade =
        filtroGravidade === "TODOS"
          ? true
          : item.gravidade === filtroGravidade;

      return matchBusca && matchSetor && matchStatus && matchGravidade;
    });
  }, [ocorrencias, filtroBusca, filtroSetor, filtroStatus, filtroGravidade]);

  const total = ocorrenciasFiltradas.length;
  const abertas = ocorrenciasFiltradas.filter(
    (item) => item.status === "Aberta"
  ).length;
  const emTratativa = ocorrenciasFiltradas.filter(
    (item) => item.status === "Em Tratativa com a Liderança"
  ).length;
  const concluidas = ocorrenciasFiltradas.filter(
    (item) => item.status === "Concluída"
  ).length;

  function formatarData(data: string | null) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function classeStatus(status: string | null) {
    switch (status) {
      case "Aberta":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Em Análise pela Qualidade":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "Encaminhada para Liderança":
        return "bg-violet-50 text-violet-700 border border-violet-200";
      case "Em Tratativa com a Liderança":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "Aguardando Validação da Qualidade":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "Concluída":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Reaberta":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <BarraSistema nome={profile?.nome || ""} role={profile?.role || ""} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Gestão de Ocorrências
              </h2>
              <p className="mt-2 text-slate-600">
                {profile?.role === "lider"
                  ? `Visualização restrita ao setor: ${
                      profile?.setor || "não informado"
                    }`
                  : "Visualização geral das ocorrências com filtros operacionais."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                Ir para Dashboard
              </Link>

              <Link
                href="/sistema/nova"
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Nova ocorrência
              </Link>
            </div>
          </div>
        </section>

        {erro ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {erro}
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardResumo titulo="Total de ocorrências" valor={total} />
          <CardResumo titulo="Ocorrências abertas" valor={abertas} />
          <CardResumo titulo="Ocorrências concluídas" valor={concluidas} />
        </section>

        <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Filtros</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>
              <input
                type="text"
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Título, descrição, ID ou tipo"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Setor
              </label>
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                disabled={!podeFiltrarTodosSetores(profile?.role)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 disabled:bg-slate-100"
              >
                <option value="TODOS">Todos</option>
                {setoresDisponiveis.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="TODOS">Todos</option>
                <option value="Aberta">Aberta</option>
                <option value="Em Análise pela Qualidade">
                  Em Análise pela Qualidade
                </option>
                <option value="Encaminhada para Liderança">
                  Encaminhada para Liderança
                </option>
                <option value="Em Tratativa com a Liderança">
                  Em Tratativa com a Liderança
                </option>
                <option value="Aguardando Validação da Qualidade">
                  Aguardando Validação da Qualidade
                </option>
                <option value="Concluída">Concluída</option>
                <option value="Reaberta">Reaberta</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gravidade
              </label>
              <select
                value={filtroGravidade}
                onChange={(e) => setFiltroGravidade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="TODOS">Todas</option>
                <option value="Leve">Leve</option>
                <option value="Moderada">Moderada</option>
                <option value="Grave">Grave</option>
                <option value="Sentinela">Sentinela</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              Lista de ocorrências
            </h3>

            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              {ocorrenciasFiltradas.length} registro(s)
            </div>
          </div>

          {carregando ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-6 text-slate-600">
              Carregando ocorrências...
            </div>
          ) : ocorrenciasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
              Nenhuma ocorrência encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Título</th>
                    <th className="px-3 py-3">Setor origem</th>
                    <th className="px-3 py-3">Setor destino</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Gravidade</th>
                    <th className="px-3 py-3">Data</th>
                    <th className="px-3 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ocorrenciasFiltradas.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-semibold text-slate-700">
                        #{item.id}
                      </td>

                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-800">
                          {item.titulo}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.tipo_ocorrencia || "-"}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-700">
                        {item.setor_origem || "-"}
                      </td>

                      <td className="px-3 py-4 text-slate-700">
                        {item.setor_destino || "-"}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classeStatus(
                            item.status
                          )}`}
                        >
                          {item.status || "-"}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-700">
                        {item.gravidade || "-"}
                      </td>

                      <td className="px-3 py-4 text-slate-700">
                        {formatarData(item.created_at)}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <Link
                          href={`/sistema/ocorrencia/${item.id}`}
                          className="inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                        >
                          Ver detalhe
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardSecundario
            titulo="Em tratativa"
            valor={emTratativa}
            descricao="Ocorrências atualmente em condução pela liderança."
          />
          <CardSecundario
            titulo="Painel operacional"
            valor={total}
            descricao="Total de registros visíveis conforme o perfil de acesso."
          />
        </section>
      </main>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}

function CardSecundario({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: number;
  descricao: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-800">{titulo}</h4>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {valor}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{descricao}</p>
    </div>
  );
}