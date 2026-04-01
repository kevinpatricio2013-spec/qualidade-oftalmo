"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../src/lib/supabase";

function normalizarRole(role: string | null | undefined) {
  if (!role) return "";

  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Usuário não localizado após autenticação.");
      setCarregando(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil) {
      setErro("Login realizado, mas o perfil não foi encontrado.");
      setCarregando(false);
      return;
    }

    const role = normalizarRole(perfil.role);

    if (role === "diretoria") {
      router.push("/painel-executivo");
      return;
    }

    if (role === "qualidade") {
      router.push("/qualidade");
      return;
    }

    if (role === "lideranca" || role === "lider") {
      router.push("/lideranca");
      return;
    }

    setErro(`Perfil sem permissão definida. Role encontrado: ${perfil.role}`);
    setCarregando(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Acesso ao sistema</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entre com suas credenciais institucionais.
          </p>
        </div>

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@hospital.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}