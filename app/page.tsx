"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type Responsavel = {
  id?: number;
  nome_responsavel?: string | null;
  setor?: string | null;
  situacao?: string | null;
  prazo?: string | null;
};

export default function HomePage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [formResponsavel, setFormResponsavel] = useState<Responsavel>({
    nome_responsavel: "",
    setor: "",
    situacao: "",
    prazo: "",
  });

  async function carregarResponsaveis() {
    if (!supabase) {
      setErro("Supabase não configurado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("responsaveis")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setErro("Não foi possível carregar os responsáveis.");
      setResponsaveis([]);
      setCarregando(false);
      return;
    }

    setResponsaveis((data as Responsavel[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  async function salvarResponsavel() {
    if (!supabase) {
      alert("Supabase não configurado.");
      return;
    }

    if (!formResponsavel?.nome_responsavel?.trim()) {
      alert("Preencha o nome do responsável.");
      return;
    }

    const { error } = await supabase.from("responsaveis").insert([
      {
        nome_responsavel: formResponsavel?.nome_responsavel || null,
        setor: formResponsavel?.setor || null,
        situacao: formResponsavel?.situacao || null,
        prazo: formResponsavel?.prazo || null,
      },
    ]);

    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }

    setFormResponsavel({
      nome_responsavel: "",
      setor: "",
      situacao: "",
      prazo: "",
    });

    carregarResponsaveis();
  }

  async function excluirResponsavel(id?: number) {
    if (!supabase || !id) return;

    const confirmar = window.confirm("Deseja excluir este responsável?");
    if (!confirmar) return;

    const { error } = await supabase.from("responsaveis").delete().eq("id", id);

    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }

    carregarResponsaveis();
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return data;
    return d.toLocaleDateString("pt-BR");
  }

  const resumoHtml = useMemo(() => {
    return `
      <ul style="margin:0;padding-left:18px;">
        ${responsaveis
          .map(
            (r) =>
              `<li><strong>${r?.nome_responsavel || "-"}</strong> - ${r?.setor || "-"} - ${r?.situacao || "-"} - prazo: ${formatarData(r?.prazo)}</li>`
          )
          .join("")}
      </ul>
    `;
  }, [responsaveis]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                Gestão de Ocorrências
              </h1>
              <p className="mt-2 text-slate-600">
                Página inicial do sistema hospitalar.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/sistema"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold text-slate-700"
              >
                Sistema
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Novo responsável
            </h2>

            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Nome do responsável"
                value={formResponsavel?.nome_responsavel || ""}
                onChange={(e) =>
                  setFormResponsavel((prev) => ({
                    ...prev,
                    nome_responsavel: e.target.value,
                  }))
                }
              />

              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Setor"
                value={formResponsavel?.setor || ""}
                onChange={(e) =>
                  setFormResponsavel((prev) => ({
                    ...prev,
                    setor: e.target.value,
                  }))
                }
              />

              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                placeholder="Situação"
                value={formResponsavel?.situacao || ""}
                onChange={(e) =>
                  setFormResponsavel((prev) => ({
                    ...prev,
                    situacao: e.target.value,
                  }))
                }
              />

              <input
                type="date"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                value={formResponsavel?.prazo || ""}
                onChange={(e) =>
                  setFormResponsavel((prev) => ({
                    ...prev,
                    prazo: e.target.value,
                  }))
                }
              />

              <button
                onClick={salvarResponsavel}
                className="rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                Salvar
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Resumo rápido</h2>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Total de responsáveis</p>
                <p className="text-2xl font-black text-slate-800">
                  {responsaveis.length}
                </p>
              </div>

              <div
                className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700"
                dangerouslySetInnerHTML={{ __html: resumoHtml }}
              />
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Lista</h2>

          {carregando ? (
            <p className="mt-4 text-slate-600">Carregando...</p>
          ) : erro ? (
            <p className="mt-4 text-red-600">{erro}</p>
          ) : responsaveis.length === 0 ? (
            <p className="mt-4 text-slate-600">
              Nenhum responsável cadastrado.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {responsaveis.map((r) => (
                <div
                  key={r?.id || `${r?.nome_responsavel || "sem-nome"}-${r?.prazo || "sem-prazo"}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-black text-slate-800">
                    {r?.nome_responsavel || "-"}
                  </p>
                  <p className="text-slate-600">Setor: {r?.setor || "-"}</p>
                  <p className="text-slate-600">
                    Situação: {r?.situacao || "-"}
                  </p>
                  <p className="text-slate-600">
                    Prazo: {formatarData(r?.prazo)}
                  </p>

                  <button
                    onClick={() => excluirResponsavel(r?.id)}
                    className="mt-3 rounded-2xl bg-red-600 px-4 py-2 text-white"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}