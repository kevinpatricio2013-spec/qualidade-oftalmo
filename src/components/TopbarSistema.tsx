"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileAtual, signOut, type Profile } from "../lib/auth";

export default function TopbarSistema() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const dados = await getProfileAtual();
      setProfile(dados);
      setCarregando(false);
    }

    carregar();
  }, []);

  async function sair() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Sistema de Gestão da Qualidade
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-800">
            Ambiente hospitalar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
            {carregando
              ? "Carregando usuário..."
              : `${profile?.nome || "Usuário"} • ${profile?.role || "sem perfil"}`}
          </div>

          <button
            onClick={sair}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}