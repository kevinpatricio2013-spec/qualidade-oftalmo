"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "../src/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!ativo) return;

        if (user) {
          router.replace("/sistema");
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    verificarSessao();

    return () => {
      ativo = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            Carregando sistema...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Gestão da Qualidade
            </p>

            <h1 className="mt-3 text-4xl font-bold text-slate-900">
              Sistema Hospitalar
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Plataforma para registro, análise, tratativa e validação de
              ocorrências, com fluxo entre Qualidade e Liderança e visão
              executiva do processo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Acessar sistema
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Abrir ocorrência
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Fluxo profissional
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Qualidade direciona, Liderança trata e Qualidade valida e encerra.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Visão executiva
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Indicadores, SLA, ocorrências críticas e acompanhamento por setor.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Registro simples
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Abertura pública de ocorrência sem exigir login do colaborador.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}