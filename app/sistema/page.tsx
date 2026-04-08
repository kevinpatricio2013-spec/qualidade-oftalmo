"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

function getRedirectPathByRole(role: string | null | undefined) {
  const roleNormalizado = (role || "").trim().toUpperCase();

  if (roleNormalizado === "QUALIDADE") {
    return "/sistema/qualidade";
  }

  if (
    roleNormalizado === "LIDERANCA" ||
    roleNormalizado === "LIDERANÇA" ||
    roleNormalizado === "LIDER"
  ) {
    return "/sistema/lideranca";
  }

  if (roleNormalizado === "DIRETORIA") {
    return "/sistema/indicadores";
  }

  return "/dashboard";
}

export default function SistemaPage() {
  const router = useRouter();
  const [mensagem, setMensagem] = useState("Verificando acesso ao sistema...");

  useEffect(() => {
    let ativo = true;

    async function validarAcesso() {
      try {
        setMensagem("Validando usuário...");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (ativo) {
            setMensagem("Sessão não encontrada. Redirecionando...");
            router.replace("/login");
          }
          return;
        }

        setMensagem("Carregando perfil...");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, nome, email, role, setor")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("Erro ao buscar perfil:", profileError);

          if (ativo) {
            setMensagem("Perfil não encontrado. Redirecionando...");
            await supabase.auth.signOut();
            router.replace("/login");
          }
          return;
        }

        const destino = getRedirectPathByRole((profile as Profile).role);

        if (ativo) {
          setMensagem("Redirecionando para seu painel...");
          router.replace(destino);
        }
      } catch (error) {
        console.error("Erro ao validar acesso:", error);

        if (ativo) {
          setMensagem("Erro ao validar acesso. Redirecionando...");
          router.replace("/login");
        }
      }
    }

    validarAcesso();

    return () => {
      ativo = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-semibold text-slate-800">
            Gestão da Qualidade
          </h1>
        </div>

        <p className="text-sm text-slate-600">{mensagem}</p>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
        </div>
      </div>
    </main>
  );
}