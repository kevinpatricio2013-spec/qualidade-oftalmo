"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Stethoscope, Building2 } from "lucide-react";
import { supabase } from "../../src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setErro("E-mail ou senha inválidos.");
        return;
      }

      router.push("/sistema");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível entrar no sistema.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Gestão da Qualidade
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900">
            Sistema Hospitalar de Gestão da Qualidade
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Plataforma profissional para registro, direcionamento, tratativa e
            validação de ocorrências, com fluxo estruturado entre Qualidade,
            Liderança e visão executiva.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={<ShieldCheck className="h-5 w-5" />}
              titulo="Qualidade"
              descricao="Triagem, direcionamento, validação final e encerramento."
            />

            <InfoCard
              icon={<Stethoscope className="h-5 w-5" />}
              titulo="Liderança"
              descricao="Tratativa setorial, devolutiva e 5W2H integrado."
            />

            <InfoCard
              icon={<Building2 className="h-5 w-5" />}
              titulo="Diretoria"
              descricao="Indicadores executivos, SLA e acompanhamento geral."
            />
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">
              Fluxo oficial do sistema
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FluxoItem numero="1" texto="Colaborador registra a ocorrência." />
              <FluxoItem numero="2" texto="Qualidade analisa e direciona." />
              <FluxoItem numero="3" texto="Liderança trata e responde." />
              <FluxoItem numero="4" texto="Qualidade valida e encerra." />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Acesso ao sistema
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Entrar</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Utilize seu usuário institucional para acessar a área autenticada.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@hospital.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                required
              />
            </div>

            {erro && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  titulo,
  descricao,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{descricao}</p>
    </div>
  );
}

function FluxoItem({
  numero,
  texto,
}: {
  numero: string;
  texto: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
        {numero}
      </div>
      <p className="text-sm leading-6 text-slate-700">{texto}</p>
    </div>
  );
}