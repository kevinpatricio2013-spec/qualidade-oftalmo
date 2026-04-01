"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../src/lib/supabase";

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
  "Farmácia / OPME",
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

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string | null;
  gravidade: string | null;
  status: string;
  fila_atual: string | null;
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

function statusPermiteTriagem(status: string | null | undefined) {
  const s = (status || "").trim().toLowerCase();

  return (
    s === "recebida" ||
    s === "aberta" ||
    s === "em triagem pela qualidade" ||
    s === "em triagem" ||
    s === ""
  );
}

export default function QualidadePage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [perfilNome, setPerfilNome] = useState("");

  async function carregarTudo() {
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

    if (role !== "qualidade") {
      setErro("Acesso permitido somente ao perfil de Qualidade.");
      setCarregando(false);
      return;
    }

    setPerfilNome(perfil.nome || "Qualidade Assistencial");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
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
    carregarTudo();
  }, []);

  const indicadores = useMemo(() => {
    const emTriagem = ocorrencias.filter((o) => statusPermiteTriagem(o.status)).length;
    const encaminhadas = ocorrencias.filter((o) => o.status === "Encaminhada para tratativa").length;
    const validacao = ocorrencias.filter((o) => o.status === "Aguardando validação da Qualidade").length;
    const encerradas = ocorrencias.filter((o) => o.status === "Encerrada").length;

    return { emTriagem, encaminhadas, validacao, encerradas };
  }, [ocorrencias]);

  async function encaminharOcorrencia(id: number, setorDestino: string, gravidade: string) {
    const { error } = await supabase
      .from("ocorrencias")
      .update({
        setor_destino: setorDestino,
        gravidade,
        status: "Encaminhada para tratativa",
        fila_atual: setorDestino,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarTudo();
  }

  async function encerrarOcorrencia(id: number) {
    const { error } = await supabase
      .from("ocorrencias")
      .update({
        status: "Encerrada",
        fila_atual: "Finalizada",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarTudo();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Central da Qualidade</p>
              <h1 className="text-3xl font-bold text-slate-800">
                Painel técnico de triagem e direcionamento
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Perfil ativo: {perfilNome}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Início
              </Link>
              <Link
                href="/ocorrencia/nova"
                className="rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
              >
                Nova ocorrência
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card titulo="Em triagem" valor={indicadores.emTriagem} />
          <Card titulo="Encaminhadas" valor={indicadores.encaminhadas} />
          <Card titulo="Aguardando validação" valor={indicadores.validacao} />
          <Card titulo="Encerradas" valor={indicadores.encerradas} />
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Fila de ocorrências</h2>

          {carregando && <p className="text-sm text-slate-600">Carregando dados...</p>}
          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="space-y-4">
            {ocorrencias.map((oc) => (
              <div key={oc.id} className="rounded-2xl border p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {oc.tipo_ocorrencia}
                    </h3>
                    <p className="text-sm text-slate-600">{oc.descricao}</p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Origem: {oc.setor_origem}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Status: {oc.status || "Sem status"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Destino: {oc.setor_destino || "A definir"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Gravidade: {oc.gravidade || "A definir"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-3">
                    <Link
                      href={`/ocorrencia/${oc.id}`}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalhes
                    </Link>

                    {statusPermiteTriagem(oc.status) && (
                      <AcaoTriagem
                        id={oc.id}
                        onEncaminhar={encaminharOcorrencia}
                      />
                    )}

                    {oc.status === "Aguardando validação da Qualidade" && (
                      <button
                        onClick={() => encerrarOcorrencia(oc.id)}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        Validar e encerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!carregando && !erro && ocorrencias.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                Nenhuma ocorrência encontrada.
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

function AcaoTriagem({
  id,
  onEncaminhar,
}: {
  id: number;
  onEncaminhar: (id: number, setorDestino: string, gravidade: string) => void;
}) {
  const [setorDestino, setSetorDestino] = useState("");
  const [gravidade, setGravidade] = useState("Média");

  return (
    <div className="min-w-[320px] space-y-3 rounded-2xl border bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">
        Direcionamento da Qualidade
      </p>

      <select
        className="w-full rounded-xl border px-3 py-2 text-sm"
        value={setorDestino}
        onChange={(e) => setSetorDestino(e.target.value)}
      >
        <option value="">Definir setor responsável</option>
        {setores.map((setor) => (
          <option key={setor} value={setor}>
            {setor}
          </option>
        ))}
      </select>

      <select
        className="w-full rounded-xl border px-3 py-2 text-sm"
        value={gravidade}
        onChange={(e) => setGravidade(e.target.value)}
      >
        <option value="Baixa">Baixa</option>
        <option value="Média">Média</option>
        <option value="Alta">Alta</option>
        <option value="Crítica">Crítica</option>
      </select>

      <button
        onClick={() => {
          if (!setorDestino) {
            alert("Defina o setor responsável.");
            return;
          }

          onEncaminhar(id, setorDestino, gravidade);
        }}
        className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Direcionar ocorrência
      </button>
    </div>
  );
}