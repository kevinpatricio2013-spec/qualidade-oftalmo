"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/sistema");
      }
    }

    verificarSessao();
  }, [router]);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    router.push("/sistema");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Sistema de Gestão de Qualidade
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Entrar no sistema
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Acesso interno para Qualidade e Liderança.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-sky-600"
              placeholder="seuemail@hospital.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-sky-600"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {erro ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {erro}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-2xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}