"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../src/lib/supabase";

type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  setor_origem: string;
  gravidade: string;
  tipo_ocorrencia: string;
  setor_responsavel: string | null;
  status: string;
  resposta_lideranca: string | null;
  validado_qualidade: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string;
  setor: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    validarSessao();
  }, []);

  async function validarSessao() {
    try {
      setLoading(true);
      setProfileLoading(true);
      setErro("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("id, nome, email, role, setor")
        .eq("id", session.user.id)
        .single();

      if (perfilError || !perfil) {
        setErro("Perfil do usuário não encontrado.");
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setProfile(perfil);
      setProfileLoading(false);

      let query = supabase
        .from("ocorrencias")
        .select(
          "id, titulo, descricao, setor_origem, gravidade, tipo_ocorrencia, setor_responsavel, status, resposta_lideranca, validado_qualidade, created_at"
        )
        .order("created_at", { ascending: false });

      if (perfil.role === "lider" && perfil.setor) {
        query = query.eq("setor_responsavel", perfil.setor);
      }

      const { data, error } = await query;

      if (error) {
        setErro(`Erro ao carregar dashboard: ${error.message}`);
        setLoading(false);
        return;
      }

      setOcorrencias((data as Ocorrencia[]) || []);
    } catch (err: any) {
      setErro(err?.message || "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const indicadores = useMemo(() => {
    const total = ocorrencias.length;

    const emAnalise = ocorrencias.filter(
      (item) => item.status === "Em análise pela Qualidade"
    ).length;

    const direcionadas = ocorrencias.filter(
      (item) => item.status === "Direcionada para Liderança"
    ).length;

    const emTratativa = ocorrencias.filter(
      (item) => item.status === "Em tratativa pela Liderança"
    ).length;

    const aguardandoValidacao = ocorrencias.filter(
      (item) => item.status === "Aguardando validação da Qualidade"
    ).length;

    const encerradas = ocorrencias.filter(
      (item) => item.status === "Encerrada"
    ).length;

    const graves = ocorrencias.filter(
      (item) => item.gravidade === "Grave" || item.gravidade === "Alta"
    ).length;

    return {
      total,
      emAnalise,
      direcionadas,
      emTratativa,
      aguardandoValidacao,
      encerradas,
      graves,
    };
  }, [ocorrencias]);

  const recentes = useMemo(() => {
    return ocorrencias.slice(0, 6);
  }, [ocorrencias]);

  function formatarData(data: string) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function corStatus(status: string) {
    switch (status) {
      case "Em análise pela Qualidade":
        return {
          background: "#eff6ff",
          color: "#1d4ed8",
          border: "1px solid #bfdbfe",
        };
      case "Direcionada para Liderança":
        return {
          background: "#ecfeff",
          color: "#0f766e",
          border: "1px solid #a5f3fc",
        };
      case "Em tratativa pela Liderança":
        return {
          background: "#fefce8",
          color: "#a16207",
          border: "1px solid #fde68a",
        };
      case "Aguardando validação da Qualidade":
        return {
          background: "#fff7ed",
          color: "#c2410c",
          border: "1px solid #fdba74",
        };
      case "Encerrada":
        return {
          background: "#f0fdf4",
          color: "#15803d",
          border: "1px solid #bbf7d0",
        };
      default:
        return {
          background: "#f8fafc",
          color: "#334155",
          border: "1px solid #cbd5e1",
        };
    }
  }

  if (loading || profileLoading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando dashboard...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundShapeOne} />
      <div style={styles.backgroundShapeTwo} />

      <section style={styles.wrapper}>
        <aside style={styles.sidebar}>
          <div>
            <div style={styles.sidebarBrand}>
              <div style={styles.sidebarLogo}>Q</div>
              <div>
                <div style={styles.sidebarTitle}>Gestão da Qualidade</div>
                <div style={styles.sidebarSubtitle}>Painel institucional</div>
              </div>
            </div>

            <nav style={styles.nav}>
              <Link href="/dashboard" style={{ ...styles.navItem, ...styles.navItemActive }}>
                Dashboard
              </Link>
              <Link href="/sistema/qualidade" style={styles.navItem}>
                Qualidade
              </Link>
              <Link href="/sistema/lideranca" style={styles.navItem}>
                Liderança
              </Link>
              <Link href="/ocorrencia/nova" style={styles.navItem}>
                Nova Ocorrência
              </Link>
            </nav>
          </div>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Sair
          </button>
        </aside>

        <section style={styles.content}>
          <header style={styles.header}>
            <div>
              <div style={styles.badge}>Dashboard</div>
              <h1 style={styles.title}>Visão geral das ocorrências</h1>
              <p style={styles.subtitle}>
                Acompanhe o volume de registros, o andamento do fluxo entre
                Qualidade e Liderança e os principais números do sistema.
              </p>
            </div>

            <div style={styles.profileCard}>
              <div style={styles.profileLabel}>Usuário conectado</div>
              <div style={styles.profileName}>
                {profile?.nome || profile?.email || "Usuário"}
              </div>
              <div style={styles.profileMeta}>
                Perfil: {profile?.role || "-"} {profile?.setor ? `• ${profile.setor}` : ""}
              </div>
            </div>
          </header>

          {erro ? <div style={styles.errorBox}>{erro}</div> : null}

          <section style={styles.indicatorGrid}>
            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Total de ocorrências</div>
              <div style={styles.indicatorValue}>{indicadores.total}</div>
            </div>

            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Em análise</div>
              <div style={styles.indicatorValue}>{indicadores.emAnalise}</div>
            </div>

            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Direcionadas</div>
              <div style={styles.indicatorValue}>{indicadores.direcionadas}</div>
            </div>

            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Em tratativa</div>
              <div style={styles.indicatorValue}>{indicadores.emTratativa}</div>
            </div>

            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Aguardando validação</div>
              <div style={styles.indicatorValue}>
                {indicadores.aguardandoValidacao}
              </div>
            </div>

            <div style={styles.indicatorCard}>
              <div style={styles.indicatorLabel}>Encerradas</div>
              <div style={styles.indicatorValue}>{indicadores.encerradas}</div>
            </div>

            <div style={styles.indicatorCardWide}>
              <div style={styles.indicatorLabel}>Ocorrências de maior gravidade</div>
              <div style={styles.indicatorValue}>{indicadores.graves}</div>
              <div style={styles.indicatorHint}>
                Consideradas: Alta e Grave
              </div>
            </div>
          </section>

          <section style={styles.sectionGrid}>
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Acessos rápidos</h2>
                  <p style={styles.panelText}>
                    Navegue rapidamente para as áreas principais do sistema.
                  </p>
                </div>
              </div>

              <div style={styles.quickGrid}>
                <Link href="/sistema" style={styles.quickCard}>
                  <div style={styles.quickTitle}>Painel do Sistema</div>
                  <div style={styles.quickText}>
                    Acessar a área principal autenticada com menu lateral.
                  </div>
                </Link>

                <Link href="/sistema/qualidade" style={styles.quickCard}>
                  <div style={styles.quickTitle}>Área da Qualidade</div>
                  <div style={styles.quickText}>
                    Analisar, direcionar, validar e encerrar ocorrências.
                  </div>
                </Link>

                <Link href="/sistema/lideranca" style={styles.quickCard}>
                  <div style={styles.quickTitle}>Área da Liderança</div>
                  <div style={styles.quickText}>
                    Tratar ocorrências do setor e registrar 5W2H.
                  </div>
                </Link>

                <Link href="/ocorrencia/nova" style={styles.quickCard}>
                  <div style={styles.quickTitle}>Nova Ocorrência</div>
                  <div style={styles.quickText}>
                    Formulário público para registro sem necessidade de login.
                  </div>
                </Link>
              </div>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>Resumo do fluxo</h2>
                  <p style={styles.panelText}>
                    Modelo operacional que o sistema segue hoje.
                  </p>
                </div>
              </div>

              <div style={styles.flowList}>
                <div style={styles.flowItem}>
                  <div style={styles.flowStep}>1</div>
                  <div>
                    <div style={styles.flowTitle}>Registro público</div>
                    <div style={styles.flowText}>
                      O colaborador registra a ocorrência sem login.
                    </div>
                  </div>
                </div>

                <div style={styles.flowItem}>
                  <div style={styles.flowStep}>2</div>
                  <div>
                    <div style={styles.flowTitle}>Análise da Qualidade</div>
                    <div style={styles.flowText}>
                      A Qualidade recebe, analisa e define o setor responsável.
                    </div>
                  </div>
                </div>

                <div style={styles.flowItem}>
                  <div style={styles.flowStep}>3</div>
                  <div>
                    <div style={styles.flowTitle}>Tratativa da Liderança</div>
                    <div style={styles.flowText}>
                      A liderança trata a ocorrência e registra resposta e 5W2H.
                    </div>
                  </div>
                </div>

                <div style={styles.flowItem}>
                  <div style={styles.flowStep}>4</div>
                  <div>
                    <div style={styles.flowTitle}>Validação final</div>
                    <div style={styles.flowText}>
                      A Qualidade valida o retorno e encerra a ocorrência.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Ocorrências recentes</h2>
                <p style={styles.panelText}>
                  Últimos registros visíveis para o perfil conectado.
                </p>
              </div>
            </div>

            {recentes.length === 0 ? (
              <div style={styles.emptyBox}>
                Nenhuma ocorrência encontrada até o momento.
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Título</th>
                      <th style={styles.th}>Tipo</th>
                      <th style={styles.th}>Setor de origem</th>
                      <th style={styles.th}>Gravidade</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentes.map((item) => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>#{item.id}</td>
                        <td style={styles.tdStrong}>{item.titulo}</td>
                        <td style={styles.td}>{item.tipo_ocorrencia}</td>
                        <td style={styles.td}>{item.setor_origem}</td>
                        <td style={styles.td}>{item.gravidade}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusPill, ...corStatus(item.status) }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={styles.td}>{formatarData(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #eff6ff 0%, #f8fbff 55%, #eef5ff 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: 'Inter, Arial, "Segoe UI", sans-serif',
    padding: 20,
  },

  loadingPage: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #eff6ff 0%, #f8fbff 55%, #eef5ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: 'Inter, Arial, "Segoe UI", sans-serif',
    padding: 24,
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    padding: "18px 22px",
    borderRadius: 18,
    color: "#1e3a8a",
    fontWeight: 700,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },

  backgroundShapeOne: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.10)",
    filter: "blur(10px)",
  },

  backgroundShapeTwo: {
    position: "absolute",
    bottom: -120,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(14, 165, 233, 0.10)",
    filter: "blur(10px)",
  },

  wrapper: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: 20,
    position: "relative",
    zIndex: 1,
  },

  sidebar: {
    minHeight: "calc(100vh - 40px)",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    border: "1px solid #dbeafe",
    borderRadius: 26,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "sticky",
    top: 20,
  },

  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },

  sidebarLogo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 22,
    boxShadow: "0 12px 26px rgba(37, 99, 235, 0.20)",
  },

  sidebarTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },

  sidebarSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  navItem: {
    textDecoration: "none",
    color: "#1e3a8a",
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: "14px 16px",
    fontWeight: 700,
    fontSize: 14,
  },

  navItemActive: {
    background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
  },

  logoutButton: {
    height: 46,
    border: "none",
    borderRadius: 16,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
    borderTop: "1px solid #dbeafe",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "stretch",
    flexWrap: "wrap",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 14,
  },

  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.15,
    color: "#0f172a",
    fontWeight: 800,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 0,
    maxWidth: 760,
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.7,
  },

  profileCard: {
    minWidth: 270,
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },

  profileLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  profileName: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },

  profileMeta: {
    marginTop: 8,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 18,
    padding: "14px 16px",
    fontSize: 14,
    lineHeight: 1.6,
  },

  indicatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },

  indicatorCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },

  indicatorCardWide: {
    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
    border: "1px solid #bfdbfe",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },

  indicatorLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 12,
  },

  indicatorValue: {
    fontSize: 32,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1,
  },

  indicatorHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#475569",
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 20,
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },

  panelTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a",
    fontWeight: 800,
  },

  panelText: {
    marginTop: 8,
    marginBottom: 0,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  quickCard: {
    textDecoration: "none",
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 20,
    padding: 18,
    transition: "0.2s",
  },

  quickTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#1e3a8a",
    marginBottom: 8,
  },

  quickText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
  },

  flowList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  flowItem: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 18,
    padding: 16,
  },

  flowStep: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    flexShrink: 0,
  },

  flowTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 4,
  },

  flowText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.6,
  },

  emptyBox: {
    background: "#f8fbff",
    border: "1px dashed #bfdbfe",
    borderRadius: 18,
    padding: "24px 18px",
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },

  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    padding: "0 12px 6px 12px",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
  },

  tr: {
    background: "#f8fbff",
  },

  td: {
    padding: "16px 12px",
    fontSize: 14,
    color: "#334155",
    borderTop: "1px solid #dbeafe",
    borderBottom: "1px solid #dbeafe",
    whiteSpace: "nowrap",
  },

  tdStrong: {
    padding: "16px 12px",
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 700,
    borderTop: "1px solid #dbeafe",
    borderBottom: "1px solid #dbeafe",
    minWidth: 220,
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
};