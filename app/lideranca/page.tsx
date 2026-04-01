"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string;
  gravidade: string;
  status: string;
  fila_atual: string;
  data_ocorrencia: string;
};

function normalizarRole(role: string | null | undefined) {
  if (!role) return "";

  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function LiderancaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [nomePerfil, setNomePerfil] = useState("");
  const [setorPerfil, setSetorPerfil] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil) {
      setErro("Perfil não encontrado.");
      setCarregando(false);
      return;
    }

    const role = normalizarRole(perfil.role);

    if (role !== "lideranca" && role !== "lider") {
      setErro(
        `Acesso permitido somente para Liderança Setorial. Role encontrado: ${perfil.role}`
      );
      setCarregando(false);
      return;
    }

    setNomePerfil(perfil.nome || "Liderança Setorial");
    setSetorPerfil(perfil.setor || "");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("setor_destino", perfil.setor)
      .order("id", { ascending: false });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;
    const emTratativa = ocorrencias.filter(
      (o) =>
        o.status === "Encaminhada para tratativa" ||
        o.status === "Em tratativa pelo setor"
    ).length;
    const aguardandoValidacao = ocorrencias.filter(
      (o) => o.status === "Aguardando validação da Qualidade"
    ).length;
    const encerradas = ocorrencias.filter((o) => o.status === "Encerrada").length;

    return { total, emTratativa, aguardandoValidacao, encerradas };
  }, [ocorrencias]);

  async function iniciarTratativa(id: number) {
    const { error } = await supabase
      .from("ocorrencias")
      .update({
        status: "Em tratativa pelo setor",
        fila_atual: setorPerfil,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function devolverParaQualidade(id: number) {
    const { error } = await supabase
      .from("ocorrencias")
      .update({
        status: "Aguardando validação da Qualidade",
        fila_atual: "Central da Qualidade",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Liderança Setorial</p>
              <h1 className="text-3xl font-bold text-slate-800">Painel do setor</h1>
              <p className="mt-2 text-sm text-slate-600">
                Perfil ativo: {nomePerfil} • Setor vinculado:{" "}
                {setorPerfil || "Não informado"}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Início
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card titulo="Total do setor" valor={indicadores.total} />
          <Card titulo="Em tratativa" valor={indicadores.emTratativa} />
          <Card
            titulo="Aguardando validação"
            valor={indicadores.aguardandoValidacao}
          />
          <Card titulo="Encerradas" valor={indicadores.encerradas} />
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Ocorrências do setor
          </h2>

          {carregando && <p className="text-sm text-slate-600">Carregando...</p>}
          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="space-y-4">
            {ocorrencias.map((oc) => (
              <div key={oc.id} className="rounded-2xl border p-5">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {oc.tipo_ocorrencia}
                  </h3>
                  <p className="text-sm text-slate-600">{oc.descricao}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Origem: {oc.setor_origem}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Destino: {oc.setor_destino}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Status: {oc.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Gravidade: {oc.gravidade}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/ocorrencia/${oc.id}`}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalhes
                    </Link>

                    {oc.status === "Encaminhada para tratativa" && (
                      <button
                        onClick={() => iniciarTratativa(oc.id)}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                      >
                        Iniciar tratativa
                      </button>
                    )}

                    {oc.status === "Em tratativa pelo setor" && (
                      <button
                        onClick={() => devolverParaQualidade(oc.id)}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        Enviar para validação da Qualidade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!carregando && !erro && ocorrencias.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                Nenhuma ocorrência destinada ao setor foi encontrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}