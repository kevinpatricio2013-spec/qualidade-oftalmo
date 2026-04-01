"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfileAtual } from "../../src/lib/auth";

export default function SistemaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const profile = await getProfileAtual();

      if (!profile) {
        router.push("/login");
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

      router.push("/abrir-ocorrencia");
    }

    carregar();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-3xl border bg-white px-8 py-6 text-sm text-slate-600 shadow-sm">
        Carregando ambiente do sistema...
      </div>
    </main>
  );
}