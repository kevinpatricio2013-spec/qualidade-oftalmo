"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

type MenuItem = {
  href: string;
  label: string;
  icon: string;
  roles?: string[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "📊",
    roles: ["QUALIDADE", "LIDERANCA", "LIDER", "DIRETORIA"],
  },
  {
    href: "/sistema",
    label: "Visão Geral",
    icon: "🏥",
    roles: ["QUALIDADE", "LIDERANCA", "LIDER", "DIRETORIA"],
  },
  {
    href: "/sistema/qualidade",
    label: "Qualidade",
    icon: "✅",
    roles: ["QUALIDADE", "DIRETORIA"],
  },
  {
    href: "/sistema/lideranca",
    label: "Liderança",
    icon: "🩺",
    roles: ["LIDERANCA", "LIDER", "QUALIDADE", "DIRETORIA"],
  },
  {
    href: "/ocorrencia/nova",
    label: "Nova Ocorrência",
    icon: "➕",
    roles: ["QUALIDADE", "LIDERANCA", "LIDER", "DIRETORIA"],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizarRole(role?: string | null) {
  return (role || "").trim().toUpperCase();
}

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, nome, email, role, setor")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
        }

        if (!ativo) return;

        setProfile((data as Profile) ?? null);
      } catch (error) {
        console.error("Erro ao carregar usuário do sistema:", error);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarUsuario();

    return () => {
      ativo = false;
    };
  }, [router]);

  const menuFiltrado = useMemo(() => {
    const role = normalizarRole(profile?.role);

    return MENU_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(role);
    });
  }, [profile]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair do sistema:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9ff] px-6">
        <div className="w-full max-w-md rounded-[32px] border border-[#dbeafe] bg-white p-8 shadow-[0_24px_80px_rgba(59,130,246,0.12)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#d9efff] to-[#edf7ff] text-3xl shadow-sm">
              🏥
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7da2c5]">
                Ambiente autenticado
              </p>
              <h1 className="mt-1 text-lg font-bold text-[#10375c]">
                Sistema de Gestão da Qualidade
              </h1>
              <p className="mt-1 text-sm text-[#6885a3]">
                Carregando estrutura do sistema...
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#edf5ff]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f9ff] text-[#16324f]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[300px] shrink-0 border-r border-[#dbeafe] bg-white lg:flex lg:flex-col">
          <div className="border-b border-[#e7f1fb] px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#dff1ff] to-[#eef8ff] text-3xl shadow-sm">
                🏥
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ba1c5]">
                  Sistema Hospitalar
                </p>
                <h1 className="mt-1 text-xl font-bold text-[#10375c]">
                  Gestão da Qualidade
                </h1>
                <p className="mt-1 text-sm text-[#6e8baa]">
                  Área autenticada do sistema
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="rounded-[28px] border border-[#e3f0fb] bg-[#f8fbff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#84a8c9]">
                Usuário logado
              </p>

              <h2 className="mt-3 text-lg font-bold text-[#12385f]">
                {profile?.nome || "Usuário do sistema"}
              </h2>

              <p className="mt-1 break-all text-sm text-[#6785a2]">
                {profile?.email || "Sem e-mail"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {profile?.role && (
                  <span className="rounded-full bg-[#dff1ff] px-3 py-1 text-xs font-semibold text-[#0f5d99]">
                    {normalizarRole(profile.role)}
                  </span>
                )}

                {profile?.setor && (
                  <span className="rounded-full bg-[#edf6ff] px-3 py-1 text-xs font-semibold text-[#587493]">
                    {profile.setor}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 pb-6">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#86a8c7]">
              Navegação
            </p>

            <nav className="space-y-2">
              {menuFiltrado.map((item) => {
                const ativo =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                      ativo
                        ? "bg-gradient-to-r from-[#dff1ff] to-[#eef8ff] text-[#0f5d99] shadow-sm"
                        : "text-[#567390] hover:bg-[#f3f9ff] hover:text-[#12385f]"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[#e7f1fb] p-5">
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff]"
            >
              Sair do sistema
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#dbeafe] bg-white/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuAberto(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8e9fb] bg-white text-[#2d5f8b] lg:hidden"
                >
                  ☰
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ea4c8]">
                    Ambiente autenticado
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#10375c] sm:text-2xl">
                    Sistema de Gestão da Qualidade
                  </h2>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/ocorrencia/nova"
                  className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
                >
                  Nova Ocorrência
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-[#d8e9fb] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff]"
                >
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>

      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#0b2239]/35"
            onClick={() => setMenuAberto(false)}
          />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] bg-white shadow-2xl">
            <div className="border-b border-[#e7f1fb] px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86a8c7]">
                    Menu do sistema
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#10375c]">
                    Gestão da Qualidade
                  </h3>
                </div>

                <button
                  onClick={() => setMenuAberto(false)}
                  className="rounded-xl border border-[#d8e9fb] px-3 py-1.5 text-sm font-semibold text-[#2d5f8b]"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-[24px] border border-[#e3f0fb] bg-[#f8fbff] p-4">
                <h4 className="text-base font-bold text-[#12385f]">
                  {profile?.nome || "Usuário do sistema"}
                </h4>
                <p className="mt-1 break-all text-sm text-[#6785a2]">
                  {profile?.email || "Sem e-mail"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {profile?.role && (
                    <span className="rounded-full bg-[#dff1ff] px-3 py-1 text-xs font-semibold text-[#0f5d99]">
                      {normalizarRole(profile.role)}
                    </span>
                  )}

                  {profile?.setor && (
                    <span className="rounded-full bg-[#edf6ff] px-3 py-1 text-xs font-semibold text-[#587493]">
                      {profile.setor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <nav className="space-y-2 px-5">
              {menuFiltrado.map((item) => {
                const ativo =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAberto(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      ativo
                        ? "bg-gradient-to-r from-[#dff1ff] to-[#eef8ff] text-[#0f5d99]"
                        : "text-[#567390] hover:bg-[#f3f9ff] hover:text-[#12385f]"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t border-[#e7f1fb] p-5">
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm font-semibold text-[#2d5f8b]"
              >
                Sair do sistema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}