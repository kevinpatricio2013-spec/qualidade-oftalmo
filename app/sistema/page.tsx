"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Ocorrencia = {
  id?: number;
  titulo?: string | null;
  descricao?: string | null;
  setor_origem?: string | null;
  setor_destino?: string | null;
  tipo_ocorrencia?: string | null;
  gravidade?: string | null;
  status?: string | null;
  responsavel?: string | null;
};

const setoresPadrao = [
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

export default function SistemaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState<Ocorrencia>({
    titulo: "",
    descricao: "",
    setor_origem: "",
    setor_destino: "",
    tipo_ocorrencia: "",
    gravidade: "Leve",
    status: "Aberto",
    responsavel: "",
  });

  async function carregarOcorrencias() {
    if (!supabase) {
      setErro("Supabase não configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setErro(error.message || "Não foi possível carregar as ocorrências.");
      setOcorrencias([]);
      setLoading(false);
      return;
    }

    setOcorrencias((data as Ocorrencia[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  async function salvarOcorrencia() {
    if (!supabase) {
      alert("Supabase não configurado.");
      return;
    }

    if (!form?.titulo?.trim()) {
      alert("Preencha o título.");
      return;
    }

    const { error } = await supabase.from("ocorrencias").insert([
      {
        titulo: form?.titulo || null,
        descricao: form?.descricao || null,
        setor_origem: form?.setor_origem || null,
        setor_destino: form?.setor_destino || null,
        tipo_ocorrencia: form?.tipo_ocorrencia || null,
        gravidade: form?.gravidade || null,
        status: form?.status || null,
        responsavel: form?.responsavel || null,
      },
    ]);

    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }

    setForm({
      titulo: "",
      descricao: "",
      setor_origem: "",
      setor_destino: "",
      tipo_ocorrencia: "",
      gravidade: "Leve",
      status: "Aberto",
      responsavel: "",
    });

    carregarOcorrencias();
  }

  async function excluirOcorrencia(id?: number) {
    if (!supabase || !id) return;

    const confirmar = window.confirm("Deseja excluir esta ocorrência?");
    if (!confirmar) return;

    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);

    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }

    carregarOcorrencias();
  }

  const totais = useMemo(() => {
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter(
      (o) => (o?.status || "").toLowerCase() === "aberto"
    ).length;
    const concluidas = ocorrencias.filter(
      (o) => (o?.status || "").toLowerCase() === "concluído"
    ).length;

    return { total, abertas, concluidas };
  }, [ocorrencias]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                Gestão de Ocorrências
              </h1>
              <p className="mt-2 text-slate-600">
                Sistema hospitalar para registro e acompanhamento de ocorrências.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-slate-300 px-4 py-3 font-bold text-slate-700"
              >
                Início
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Resumo titulo="Total" valor={totais.total} />
          <Resumo titulo="Em aberto" valor={totais.abertas} />
          <Resumo titulo="Concluídas" valor={totais.concluidas} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Nova ocorrência</h2>

            <div className="mt-4 grid gap-3">
              <input
                className={campo}
                value={form?.titulo || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Título"
              />

              <textarea
                className={campo}
                rows={4}
                value={form?.descricao || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Descrição"
              />

              <select
                className={campo}
                value={form?.setor_origem || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, setor_origem: e.target.value }))
                }
              >
                <option value="">Setor de origem</option>
                {setoresPadrao.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>

              <select
                className={campo}
                value={form?.setor_destino || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, setor_destino: e.target.value }))
                }
              >
                <option value="">Setor de destino</option>
                {setoresPadrao.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>

              <input
                className={campo}
                value={form?.tipo_ocorrencia || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tipo_ocorrencia: e.target.value,
                  }))
                }
                placeholder="Tipo de ocorrência"
              />

              <input
                className={campo}
                value={form?.responsavel || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, responsavel: e.target.value }))
                }
                placeholder="Responsável"
              />

              <select
                className={campo}
                value={form?.gravidade || "Leve"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gravidade: e.target.value }))
                }
              >
                <option value="Leve">Leve</option>
                <option value="Moderada">Moderada</option>
                <option value="Grave">Grave</option>
              </select>

              <select
                className={campo}
                value={form?.status || "Aberto"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="Aberto">Aberto</option>
                <option value="Em análise">Em análise</option>
                <option value="Concluído">Concluído</option>
              </select>

              <button
                onClick={salvarOcorrencia}
                className="rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                Salvar ocorrência
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Lista de ocorrências
            </h2>

            {loading ? (
              <p className="mt-4 text-slate-600">Carregando...</p>
            ) : erro ? (
              <p className="mt-4 text-red-600">{erro}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className={th}>Título</th>
                      <th className={th}>Origem</th>
                      <th className={th}>Destino</th>
                      <th className={th}>Tipo</th>
                      <th className={th}>Responsável</th>
                      <th className={th}>Gravidade</th>
                      <th className={th}>Status</th>
                      <th className={th}>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ocorrencias.length === 0 ? (
                      <tr>
                        <td className={td} colSpan={8}>
                          Nenhuma ocorrência cadastrada.
                        </td>
                      </tr>
                    ) : (
                      ocorrencias.map((o) => (
                        <tr
                          key={o?.id || `${o?.titulo || "sem-titulo"}-${o?.status || "sem-status"}`}
                        >
                          <td className={td}>{o?.titulo || "-"}</td>
                          <td className={td}>{o?.setor_origem || "-"}</td>
                          <td className={td}>{o?.setor_destino || "-"}</td>
                          <td className={td}>{o?.tipo_ocorrencia || "-"}</td>
                          <td className={td}>{o?.responsavel || "-"}</td>
                          <td className={td}>{o?.gravidade || "-"}</td>
                          <td className={td}>{o?.status || "-"}</td>
                          <td className={td}>
                            <button
                              onClick={() => excluirOcorrencia(o?.id)}
                              className="rounded-2xl bg-red-600 px-3 py-2 text-white"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-slate-800">{valor}</p>
    </div>
  );
}

const campo =
  "w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none";

const th = "px-4 py-3 text-left text-sm font-bold";
const td = "border-b border-slate-200 px-4 py-3 text-sm text-slate-700";