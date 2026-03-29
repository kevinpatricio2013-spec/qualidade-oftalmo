"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Perfil = {
  id?: number;
  nome?: string | null;
  email?: string | null;
  perfil?: string | null;
};

type ItemDashboard = {
  id?: number;
  nome?: string | null;
  total?: number | null;
};

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ocorrenciasPorSetor, setOcorrenciasPorSetor] = useState<ItemDashboard[]>([]);
  const [ocorrenciasPorStatus, setOcorrenciasPorStatus] = useState<ItemDashboard[]>([]);
  const [ocorrenciasPorGravidade, setOcorrenciasPorGravidade] = useState<ItemDashboard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDashboard() {
    if (!supabase) {
      setErro("Supabase não configurado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const [perfilResp, setorResp, statusResp, gravidadeResp] =
        await Promise.all([
          supabase.from("perfis").select("*").limit(1).maybeSingle(),
          supabase.from("ocorrencias").select("setor_origem"),
          supabase.from("ocorrencias").select("status"),
          supabase.from("ocorrencias").select("gravidade"),
        ]);

      setPerfil((perfilResp.data as Perfil) || null);

      if (setorResp.error || statusResp.error || gravidadeResp.error) {
        setErro("Não foi possível carregar os indicadores.");
        setOcorrenciasPorSetor([]);
        setOcorrenciasPorStatus([]);
        setOcorrenciasPorGravidade([]);
        setCarregando(false);
        return;
      }

      setOcorrenciasPorSetor(
        agruparPorNome(
          (setorResp.data || []).map((item: any) => item?.setor_origem || "Não informado")
        )
      );

      setOcorrenciasPorStatus(
        agruparPorNome(
          (statusResp.data || []).map((item: any) => item?.status || "Não informado")
        )
      );

      setOcorrenciasPorGravidade(
        agruparPorNome(
          (gravidadeResp.data || []).map((item: any) => item?.gravidade || "Não informado")
        )
      );
    } catch {
      setErro("Erro inesperado ao carregar dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const totalGeral = useMemo(() => {
    return ocorrenciasPorSetor.reduce((acc, item) => acc + Number(item?.total || 0), 0);
  }, [ocorrenciasPorSetor]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-800">Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Usuário: <strong>{perfil?.nome || perfil?.email || "-"}</strong> | Perfil:{" "}
                <strong>{perfil?.perfil || "-"}</strong>
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
                href="/sistema"
                className="rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                Sistema
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <CardResumo titulo="Total geral" valor={String(totalGeral)} />
          <CardResumo titulo="Setores monitorados" valor={String(ocorrenciasPorSetor.length)} />
          <CardResumo titulo="Status monitorados" valor={String(ocorrenciasPorStatus.length)} />
        </div>

        {carregando ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Carregando dashboard...</p>
          </section>
        ) : erro ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-red-600">{erro}</p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <ListaAgrupada titulo="Ocorrências por setor" itens={ocorrenciasPorSetor} />
            <ListaAgrupada titulo="Ocorrências por status" itens={ocorrenciasPorStatus} />
            <ListaAgrupada titulo="Ocorrências por gravidade" itens={ocorrenciasPorGravidade} />
          </div>
        )}
      </div>
    </main>
  );
}

function agruparPorNome(lista: string[]): ItemDashboard[] {
  const mapa = new Map<string, number>();

  for (const nome of lista) {
    const chave = nome || "Não informado";
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  }

  return Array.from(mapa.entries()).map(([nome, total], index) => ({
    id: index + 1,
    nome,
    total,
  }));
}

function CardResumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-slate-800">{valor}</p>
    </div>
  );
}

function ListaAgrupada({
  titulo,
  itens,
}: {
  titulo: string;
  itens: ItemDashboard[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800">{titulo}</h2>

      <div className="mt-4 grid gap-3">
        {itens.length === 0 ? (
          <p className="text-slate-600">Sem dados.</p>
        ) : (
          itens.map((item) => (
            <div
              key={item?.id || item?.nome || "item"}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
            >
              <strong>{item?.nome || "-"}</strong>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                {item?.total || 0}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}