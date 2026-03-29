"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Ocorrencia = {
  id: number;
  titulo: string;
  setor: string;
  tipo: string;
  gravidade: string;
  status: string;
  data: string;
  descricao: string;
};

const setores = [
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

const tipos = [
  "Não conformidade",
  "Evento adverso",
  "Quase falha",
  "Reclamação",
  "Melhoria",
];

const gravidades = ["Leve", "Moderada", "Grave"];
const statusLista = ["Aberto", "Em análise", "Em tratativa", "Resolvido"];

const dadosIniciais: Ocorrencia[] = [
  {
    id: 1,
    titulo: "Falha na conferência de material",
    setor: "CME",
    tipo: "Não conformidade",
    gravidade: "Moderada",
    status: "Em tratativa",
    data: "2026-03-28",
    descricao: "Divergência identificada na conferência de instrumental antes da liberação.",
  },
  {
    id: 2,
    titulo: "Atraso na autorização de procedimento",
    setor: "Autorização",
    tipo: "Reclamação",
    gravidade: "Leve",
    status: "Aberto",
    data: "2026-03-27",
    descricao: "Tempo de resposta acima do esperado para liberação do procedimento.",
  },
  {
    id: 3,
    titulo: "Inconsistência em registro assistencial",
    setor: "Centro Cirúrgico",
    tipo: "Não conformidade",
    gravidade: "Grave",
    status: "Em análise",
    data: "2026-03-26",
    descricao: "Registro incompleto em etapa obrigatória do processo perioperatório.",
  },
];

const corStatus: Record<string, string> = {
  Aberto: "bg-rose-50 text-rose-700 border-rose-200",
  "Em análise": "bg-amber-50 text-amber-700 border-amber-200",
  "Em tratativa": "bg-cyan-50 text-cyan-700 border-cyan-200",
  Resolvido: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function SistemaPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>(dadosIniciais);
  const [form, setForm] = useState({
    titulo: "",
    setor: "",
    tipo: "",
    gravidade: "",
    descricao: "",
  });

  const totais = useMemo(() => {
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "Aberto").length,
      tratativa: ocorrencias.filter((o) => o.status === "Em tratativa").length,
      resolvidas: ocorrencias.filter((o) => o.status === "Resolvido").length,
    };
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const matchBusca =
        item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        item.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        item.setor.toLowerCase().includes(busca.toLowerCase());

      const matchSetor = setorFiltro === "Todos" ? true : item.setor === setorFiltro;
      const matchStatus = statusFiltro === "Todos" ? true : item.status === statusFiltro;

      return matchBusca && matchSetor && matchStatus;
    });
  }, [ocorrencias, busca, setorFiltro, statusFiltro]);

  function salvarFormulario(e: React.FormEvent) {
    e.preventDefault();

    if (!form.titulo || !form.setor || !form.tipo || !form.gravidade || !form.descricao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const novaOcorrencia: Ocorrencia = {
      id: Date.now(),
      titulo: form.titulo,
      setor: form.setor,
      tipo: form.tipo,
      gravidade: form.gravidade,
      status: "Aberto",
      data: new Date().toISOString().slice(0, 10),
      descricao: form.descricao,
    };

    setOcorrencias((atual) => [novaOcorrencia, ...atual]);
    setForm({ titulo: "", setor: "", tipo: "", gravidade: "", descricao: "" });
    setMostrarFormulario(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Gestão operacional
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Gestão de Ocorrências
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Painel operacional para registrar, acompanhar e tratar ocorrências em padrão hospitalar, com leitura limpa e institucional.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Página inicial
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
            >
              + Nova ocorrência
            </button>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardIndicador titulo="Ocorrências" valor={String(totais.total)} detalhe="Total registrado no sistema" />
          <CardIndicador titulo="Abertas" valor={String(totais.abertas)} detalhe="Demandam avaliação inicial" />
          <CardIndicador titulo="Em tratativa" valor={String(totais.tratativa)} detalhe="Ações em andamento" />
          <CardIndicador titulo="Resolvidas" valor={String(totais.resolvidas)} detalhe="Concluídas com registro" />
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Painel de acompanhamento</h2>
              <p className="text-sm text-slate-500">Use os filtros para localizar ocorrências de forma rápida.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Pesquisar</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, descrição ou setor"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Setor</label>
              <select
                value={setorFiltro}
                onChange={(e) => setSetorFiltro(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
              >
                <option>Todos</option>
                {setores.map((setor) => (
                  <option key={setor}>{setor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
              >
                <option>Todos</option>
                {statusLista.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Ocorrências registradas</h2>
            <p className="text-sm text-slate-500">Lista principal do sistema com leitura mais alinhada ao padrão executivo.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-5 py-4 font-semibold">Título</th>
                  <th className="px-5 py-4 font-semibold">Setor</th>
                  <th className="px-5 py-4 font-semibold">Tipo</th>
                  <th className="px-5 py-4 font-semibold">Gravidade</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {ocorrenciasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      Nenhuma ocorrência encontrada com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  ocorrenciasFiltradas.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 text-sm text-slate-700">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.titulo}</p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{item.descricao}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.setor}</td>
                      <td className="px-5 py-4">{item.tipo}</td>
                      <td className="px-5 py-4">{item.gravidade}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${corStatus[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">{item.data}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {mostrarFormulario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Novo registro</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">Nova ocorrência</h3>
                  <p className="mt-2 text-sm text-slate-500">Preencha os campos abaixo para registrar uma nova ocorrência no sistema.</p>
                </div>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={salvarFormulario} className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo label="Título da ocorrência">
                    <input
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                      placeholder="Digite o título"
                    />
                  </Campo>

                  <Campo label="Setor">
                    <select
                      value={form.setor}
                      onChange={(e) => setForm({ ...form, setor: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    >
                      <option value="">Selecione</option>
                      {setores.map((setor) => (
                        <option key={setor}>{setor}</option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Tipo de ocorrência">
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    >
                      <option value="">Selecione</option>
                      {tipos.map((tipo) => (
                        <option key={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Gravidade">
                    <select
                      value={form.gravidade}
                      onChange={(e) => setForm({ ...form, gravidade: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    >
                      <option value="">Selecione</option>
                      {gravidades.map((gravidade) => (
                        <option key={gravidade}>{gravidade}</option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="mt-4">
                  <Campo label="Descrição da ocorrência">
                    <textarea
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={5}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                      placeholder="Descreva a ocorrência de forma objetiva"
                    />
                  </Campo>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800"
                  >
                    Salvar ocorrência
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CardIndicador({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{valor}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detalhe}</p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
