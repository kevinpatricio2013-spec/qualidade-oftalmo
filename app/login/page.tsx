"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getProfileAtual } from "../../src/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { error } = await signIn(email, password);

    if (error) {
      setErro("Não foi possível entrar: " + error.message);
      setCarregando(false);
      return;
    }

    const profile = await getProfileAtual();

    if (!profile) {
      setErro("Login realizado, mas o perfil não foi encontrado.");
      setCarregando(false);
      return;
    }

    if (profile.role === "qualidade") {
      router.push("/sistema/qualidade");
      return;
    }

    if (profile.role === "lider") {
      router.push("/sistema/lideranca");
      return;
    }

    if (profile.role === "diretoria") {
      router.push("/sistema/diretoria");
      return;
    }

    router.push("/sistema");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4f8_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Sistema de Gestão da Qualidade
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Acesso ao ambiente hospitalar
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Plataforma para registro, direcionamento, tratativa e acompanhamento
            de ocorrências assistenciais e administrativas.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500">
            Informe suas credenciais para acessar o sistema.
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
                placeholder="seuemail@hospital.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                required
              />
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Acessar sistema"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}