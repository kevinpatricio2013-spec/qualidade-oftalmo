"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileAtual, type Profile } from "../lib/auth";

type Props = {
  children: React.ReactNode;
  rolesPermitidos?: Array<Profile["role"]>;
};

export default function ProtegePagina({ children, rolesPermitidos }: Props) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    async function validar() {
      const profile = await getProfileAtual();

      if (!profile) {
        router.push("/login");
        return;
      }

      if (
        rolesPermitidos &&
        rolesPermitidos.length > 0 &&
        !rolesPermitidos.includes(profile.role)
      ) {
        router.push("/sistema");
        return;
      }

      setLiberado(true);
      setCarregando(false);
    }

    validar();
  }, [router, rolesPermitidos]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border bg-white px-8 py-6 text-sm text-slate-600 shadow-sm">
          Validando acesso...
        </div>
      </main>
    );
  }

  if (!liberado) return null;

  return <>{children}</>;
}