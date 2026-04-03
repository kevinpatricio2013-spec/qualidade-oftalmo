"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../src/lib/supabase";

type Role = "qualidade" | "lider" | "diretoria" | string;

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: Role | null;
  setor: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MenuItem = {
  id: string;
  titulo: string;
  descricao: string;
  href?: string;
  ativo?: boolean;
};

export default function SistemaPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [usuarioEmail, setUsuarioEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        titulo: "Dashboard",
        descricao: "Visão geral do sistema e indicadores.",
        href: "/dashboard",
        ativo: false,
      },
      {
        id: "sistema",
        titulo: "Sistema",
        descricao: "Área principal do módulo de gestão da qualidade.",
        href: "/sistema",
        ativo: true,
      },
      {
        id: "nova-ocorrencia",
        titulo: "Nova ocorrência",
        descricao: "Registrar nova não conformidade ou evento.",
        href: "/ocorrencia/nova",
        ativo: false,
      },
      {
        id: "qualidade",
        titulo: "Painel da qualidade",
        descricao: "Triagem, direcionamento e acompanhamento.",
        href: "/sistema/qualidade",
        ativo: false,
      },
      {
        id: "lideranca",
        titulo: "Painel da liderança",
        descricao: "Tratativa por setor e devolutiva.",
        href: "/sistema/lideranca",
        ativo: false,
      },
      {
        id: "5w2h",
        titulo: "Plano 5W2H",
        descricao: "Próxima evolução com persistência no banco.",
        href: "/sistema/5w2h",
        ativo: false,
      },
    ],
    []
  );

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        setErro(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/");
          return;
        }

        if (!ativo) return;

        setUsuarioEmail(user.email ?? "");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, nome, email, role, setor, created_at, updated_at")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setErro(
            "Login realizado, mas não foi possível localizar o perfil do usuário."
          );
          setProfile(null);
          setCarregando(false);
          return;
        }

        if (!ativo) return;

        setProfile(profileData as Profile);
      } catch (error: any) {
        console.error("Erro ao carregar /sistema:", error);
        setErro(error?.message || "Não foi possível carregar a página.");
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [router]);

  async function handleSair() {
    try {
      setSaindo(true);
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
      setSaindo(false);
    }
  }

  function abrirRota(href?: string) {
    if (!href) return;
    router.push(href);
  }

  function getRoleLabel(role: Role | null | undefined) {
    if (!role) return "Sem perfil";
    if (role === "qualidade") return "Qualidade";
    if (role === "lider") return "Liderança";
    if (role === "diretoria") return "Diretoria";
    return role;
  }

  function getRoleBadgeClass(role: Role | null | undefined) {
    if (role === "qualidade") {
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    }
    if (role === "lider") {
      return "bg-cyan-100 text-cyan-800 border border-cyan-200";
    }
    if (role === "diretoria") {
      return "bg-violet-100 text-violet-800 border border-violet-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <h1 className="text-xl font-semibold text-slate-800">
            Carregando sistema
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Aguarde enquanto preparamos sua área de trabalho.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="w-[310px] bg-white border-r border-slate-200 shadow-sm flex flex-col">
          <div className="px-6 py-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                Q
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">
                  Gestão da Qualidade
                </h1>
                <p className="text-sm text-slate-500">
                  Sistema hospitalar de ocorrências
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-200">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usuário logado
              </p>

              <h2 className="mt-2 text-base font-semibold text-slate-800 break-words">
                {profile?.nome || "Usuário"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 break-words">
                {profile?.email || usuarioEmail || "E-mail não informado"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                    profile?.role
                  )}`}
                >
                  {getRoleLabel(profile?.role)}
                </span>

                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {profile?.setor || "Sem setor"}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 overflow-y-auto">
            <p className="px-2 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Navegação
            </p>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => abrirRota(item.href)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    item.ativo
                      ? "bg-emerald-50 border-emerald-200 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          item.ativo ? "text-emerald-700" : "text-slate-800"
                        }`}
                      >
                        {item.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {item.descricao}
                      </p>
                    </div>

                    {item.ativo ? (
                      <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </nav>

          <div className="px-4 py-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSair}
              disabled={saindo}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saindo ? "Saindo..." : "Sair do sistema"}
            </button>
          </div>
        </aside>

        <section className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Área principal do sistema
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-800">
                    Módulo de Gestão da Qualidade
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm md:text-base text-slate-500 leading-relaxed">
                    Ambiente central para acompanhamento das ocorrências,
                    direcionamento para setores, monitoramento de tratativas e
                    evolução do fluxo assistencial e administrativo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => abrirRota("/ocorrencia/nova")}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Nova ocorrência
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirRota("/dashboard")}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ir para dashboard
                  </button>
                </div>
              </div>
            </header>

            {erro ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
                <h2 className="text-sm font-bold">Atenção</h2>
                <p className="mt-1 text-sm">{erro}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
                <p className="text-sm font-medium text-slate-500">
                  Perfil ativo
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  {getRoleLabel(profile?.role)}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Acesso carregado conforme permissões do usuário.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
                <p className="text-sm font-medium text-slate-500">
                  Setor vinculado
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  {profile?.setor || "Não informado"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Utilizado para direcionamento e visualização.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
                <p className="text-sm font-medium text-slate-500">
                  Fluxo atual
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  Ativo
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Login, perfis, dashboard e status automáticos em operação.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
                <p className="text-sm font-medium text-slate-500">
                  Próxima evolução
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  5W2H
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Estrutura completa com persistência no banco.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Evolução do projeto
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Base atual consolidada para avançarmos com segurança.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-800">
                          Login com Supabase Auth
                        </h3>
                        <p className="mt-1 text-sm text-emerald-700">
                          Autenticação já integrada ao fluxo principal.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        OK
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-800">
                          Perfis e tabela profiles
                        </h3>
                        <p className="mt-1 text-sm text-emerald-700">
                          Controle por qualidade, liderança e diretoria.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        OK
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-800">
                          Fluxo automático de status
                        </h3>
                        <p className="mt-1 text-sm text-emerald-700">
                          Processo já evoluído para status coerente sem depender
                          de preenchimento manual do usuário.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        OK
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-cyan-800">
                          Próximo passo imediato
                        </h3>
                        <p className="mt-1 text-sm text-cyan-700">
                          Consolidar a navegação lateral e, em seguida, evoluir
                          para o 5W2H completo no banco.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200">
                        Em andamento
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Atalhos rápidos
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Ações principais para o fluxo do sistema.
                </p>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => abrirRota("/ocorrencia/nova")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
                  >
                    <h3 className="text-sm font-bold text-slate-800">
                      Registrar ocorrência
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Abertura de nova não conformidade ou evento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirRota("/sistema/qualidade")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
                  >
                    <h3 className="text-sm font-bold text-slate-800">
                      Triagem da qualidade
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Classificação, análise e direcionamento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirRota("/sistema/lideranca")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
                  >
                    <h3 className="text-sm font-bold text-slate-800">
                      Painel da liderança
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Tratativa setorial e devolutiva para qualidade.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirRota("/sistema/5w2h")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
                  >
                    <h3 className="text-sm font-bold text-slate-800">
                      Evoluir 5W2H
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Próxima fase com banco de dados estruturado.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-800">
                Visão funcional do fluxo
              </h2>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Etapa 1
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-800">
                    Registro
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    O colaborador registra a ocorrência com os dados essenciais
                    para avaliação inicial.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Etapa 2
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-800">
                    Qualidade
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    A qualidade classifica, analisa e direciona para o setor
                    responsável pela tratativa.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Etapa 3
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-800">
                    Liderança e devolutiva
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    O líder trata, registra ação e devolve para validação e
                    encerramento conforme o fluxo definido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}