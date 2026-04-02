"use client";

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
  created_at?: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState("TODOS");

  async function carregarTudo() {
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
        setErro("Não foi possível carregar as ocorrências do dashboard.");
        setCarregando(false);
        return;
      }

      setOcorrencias(data || []);
      setCarregando(false);
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
      setErro("Ocorreu um erro ao carregar o dashboard.");
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const setoresDisponiveis = useMemo(() => {
    const base: string[] = ocorrencias
      .map((item) => item.setor_destino)
      .filter((setor): setor is string => Boolean(setor));

    return Array.from(new Set(base)).sort((a, b) => a.localeCompare(b));
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const matchSetor =
        filtroSetor === "TODOS" ? true : item.setor_destino === filtroSetor;

      const matchStatus =
        filtroStatus === "TODOS" ? true : item.status === filtroStatus;

      const matchGravidade =
        filtroGravidade === "TODOS"
          ? true
          : item.gravidade === filtroGravidade;

      return matchSetor && matchStatus && matchGravidade;
    });
  }, [ocorrencias, filtroSetor, filtroStatus, filtroGravidade]);

  const total = ocorrenciasFiltradas.length;
  const abertas = ocorrenciasFiltradas.filter(
    (o) => o.status === "Aberta"
  ).length;
  const emAnalise = ocorrenciasFiltradas.filter(
    (o) => o.status === "Em Análise pela Qualidade"
  ).length;
  const encaminhadas = ocorrenciasFiltradas.filter(
    (o) => o.status === "Encaminhada para Liderança"
  ).length;
  const emTratativa = ocorrenciasFiltradas.filter(
    (o) => o.status === "Em Tratativa com a Liderança"
  ).length;
  const aguardandoValidacao = ocorrenciasFiltradas.filter(
    (o) => o.status === "Aguardando Validação da Qualidade"
  ).length;
  const concluidas = ocorrenciasFiltradas.filter(
    (o) => o.status === "Concluída"
  ).length;
  const reabertas = ocorrenciasFiltradas.filter(
    (o) => o.status === "Reaberta"
  ).length;

  const porSetor = useMemo(() => {
    const mapa: Record<string, number> = {};

    for (const item of ocorrenciasFiltradas) {
      const chave = item.setor_destino || "Não informado";
      mapa[chave] = (mapa[chave] || 0) + 1;
    }

    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [ocorrenciasFiltradas]);

  const porStatus = [
    { titulo: "Abertas", valor: abertas },
    { titulo: "Em análise", valor: emAnalise },
    { titulo: "Encaminhadas", valor: encaminhadas },
    { titulo: "Em tratativa", valor: emTratativa },
    { titulo: "Aguardando validação", valor: aguardandoValidacao },
    { titulo: "Concluídas", valor: concluidas },
    { titulo: "Reabertas", valor: reabertas },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <BarraSistema nome={profile?.nome || ""} role={profile?.role || ""} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Dashboard de Ocorrências
          </h2>
          <p className="mt-2 text-slate-600">
            {profile?.role === "lider"
              ? `Visualização restrita ao setor: ${
                  profile?.setor || "não informado"
                }`
              : "Visualização global com filtros por setor, status e gravidade."}
          </p>
        </div>

        {erro ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {erro}
          </div>
        ) : null}

        {carregando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Carregando dashboard...</p>
          </div>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <CardIndicador titulo="Total" valor={total} />
              <CardIndicador titulo="Abertas" valor={abertas} />
              <CardIndicador titulo="Em análise" valor={emAnalise} />
              <CardIndicador titulo="Em tratativa" valor={emTratativa} />
              <CardIndicador titulo="Concluídas" valor={concluidas} />
            </section>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Filtros
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Setor
                  </label>
                  <select
                    value={filtroSetor}
                    onChange={(e) => setFiltroSetor(e.target.value)}
                    disabled={!podeFiltrarTodosSetores(profile?.role)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 disabled:bg-slate-100"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600"
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

            <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Distribuição por setor
                </h3>

                <div className="space-y-3">
                  {porSetor.length === 0 ? (
                    <p className="text-slate-500">Nenhum dado encontrado.</p>
                  ) : (
                    porSetor.map(([setor, quantidade]) => (
                      <div
                        key={setor}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span className="font-medium text-slate-700">
                          {setor}
                        </span>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                          {quantidade}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Situação atual
                </h3>

                <div className="space-y-3">
                  {porStatus.map((item) => (
                    <LinhaResumo
                      key={item.titulo}
                      titulo={item.titulo}
                      valor={item.valor}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Últimas ocorrências
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {ocorrenciasFiltradas.length} registro(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-3">ID</th>
                      <th className="px-3 py-3">Título</th>
                      <th className="px-3 py-3">Setor destino</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Gravidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocorrenciasFiltradas.slice(0, 15).map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          #{item.id}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.titulo}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.setor_destino || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.status || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.gravidade || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {ocorrenciasFiltradas.length === 0 ? (
                  <p className="pt-4 text-slate-500">
                    Nenhuma ocorrência encontrada.
                  </p>
                ) : null}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function CardIndicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}

function LinhaResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-slate-700">{titulo}</span>
      <span className="font-semibold text-slate-800">{valor}</span>
    </div>
  );
}