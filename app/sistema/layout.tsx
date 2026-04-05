"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../src/lib/supabase";

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
    roles: ["qualidade", "lider", "diretoria"],
  },
  {
    href: "/sistema",
    label: "Visão Geral",
    icon: "🏥",
    roles: ["qualidade", "lider", "diretoria"],
  },
  {
    href: "/sistema/qualidade",
    label: "Qualidade",
    icon: "✅",
    roles: ["qualidade", "diretoria"],
  },
  {
    href: "/sistema/lideranca",
    label: "Liderança",
    icon: "🩺",
    roles: ["lider", "qualidade", "diretoria"],
  },
  {
    href: "/ocorrencia/nova",
    label: "Nova Ocorrência",
    icon: "➕",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, nome, email, role, setor")
          .eq("id", user.id)
          .single();

        if (!active) return;

        setProfile(profileData ?? null);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  const filteredMenu = useMemo(() => {
    const role = profile?.role ?? null;

    return MENU_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!role) return false;
      return item.roles.includes(role);
    });
  }, [profile]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f9ff] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#d9ebff] bg-white p-8 shadow-[0_20px_60px_rgba(25,118,210,0.10)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#dff0ff] flex items-center justify-center text-xl">
              🏥
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#12385f]">
                Sistema de Gestão da Qualidade
              </h1>
              <p className="text-sm text-[#5d7b99]">
                Carregando ambiente do sistema...
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#ecf5ff]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#8dc8ff]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f9ff] text-[#16324f]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-[#dbeafe] bg-white/95 backdrop-blur-xl">
          <div className="flex w-full flex-col">
            <div className="border-b border-[#e5f0fb] px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dff1ff] to-[#edf7ff] text-2xl shadow-sm">
                  🏥
                </div>
                <div>
                  <h1 className="text-base font-bold text-[#10375c]">
                    Sistema de Gestão
                  </h1>
                  <p className="text-sm text-[#6b89a6]">Qualidade Hospitalar</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-5">
              <div className="rounded-2xl border border-[#e6f2ff] bg-[#f8fbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7aa2c8]">
                  Usuário logado
                </p>
                <h2 className="mt-2 text-sm font-semibold text-[#16324f]">
                  {profile?.nome || "Usuário do sistema"}
                </h2>
                <p className="mt-1 text-sm text-[#6482a0]">
                  {profile?.email || "Sem e-mail"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile?.role && (
                    <span className="rounded-full bg-[#dff1ff] px-3 py-1 text-xs font-semibold text-[#1565a8]">
                      {profile.role.toUpperCase()}
                    </span>
                  )}
                  {profile?.setor && (
                    <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#4a6b8c]">
                      {profile.setor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 pb-6">
              <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#86a8c7]">
                Navegação
              </p>

              <div className="space-y-2">
                {filteredMenu.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-[#dff1ff] to-[#edf7ff] text-[#0f5d99] shadow-sm"
                          : "text-[#53718d] hover:bg-[#f3f9ff] hover:text-[#12385f]"
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[#e5f0fb] px-4 py-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff]"
              >
                <span>↩️</span>
                <span>Sair do sistema</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#dbeafe] bg-white/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7e9fb] bg-white text-lg text-[#2b5f8c] lg:hidden"
                >
                  ☰
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7ca4c8]">
                    Ambiente autenticado
                  </p>
                  <h2 className="text-lg font-bold text-[#12385f]">
                    Sistema de Gestão da Qualidade
                  </h2>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/ocorrencia/nova"
                  className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
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

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#0b2239]/35"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5f0fb] px-5 py-5">
              <div>
                <h3 className="text-base font-bold text-[#10375c]">
                  Menu do Sistema
                </h3>
                <p className="text-sm text-[#6f8daa]">Qualidade Hospitalar</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-[#d8e9fb] px-3 py-1.5 text-sm text-[#325f87]"
              >
                Fechar
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="rounded-2xl border border-[#e6f2ff] bg-[#f8fbff] p-4">
                <h4 className="text-sm font-semibold text-[#16324f]">
                  {profile?.nome || "Usuário do sistema"}
                </h4>
                <p className="mt-1 text-sm text-[#6482a0]">
                  {profile?.email || "Sem e-mail"}
                </p>
              </div>
            </div>

            <nav className="space-y-2 px-4">
              {filteredMenu.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-[#dff1ff] to-[#edf7ff] text-[#0f5d99]"
                        : "text-[#53718d] hover:bg-[#f3f9ff] hover:text-[#12385f]"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t border-[#e5f0fb] p-4">
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