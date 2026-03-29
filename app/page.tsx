"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type Perfil = {
  id: string;
  nome: string;
  email: string;
  role: "qualidade" | "lider" | "colaborador";
  setor: string | null;
};

type Ocorrencia = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string;
  gravidade: string;
  status: string;
  acao_imediata: string | null;
  causa_raiz: string | null;
  plano_acao: string | null;
  prazo: string | null;
  created_at: string;
  updated_at: string;
  criado_por: string | null;
  validado_qualidade: boolean | null;
  validado_por: string | null;
  validado_em: string | null;
  fechado_em: string | null;
};

type Responsavel = {
  id: string;
  nome: string;
  email: string;
  setor: string | null;
};

type OcorrenciaResponsavel = {
  id: string;
  ocorrencia_id: string;
  responsavel_id: string;
};

const SETORES = [
  "Agendamento",
  "Autorização",
  "Centro Cirúrgico",
  "CME",
  "Comissões Hospitalares",
  "Compras",
  "Consultório Médico",
  "Contas Médicas",
  "Controlador de Acesso",
  "Diretoria",
  "Facilities",
  "Farmácia / OPME",
  "Faturamento",
  "Financeiro",
  "Fornecedores Externos",
  "Gestão da Informação",
  "Gestão de Pessoas",
  "Higiene",
  "Qualidade",
  "Recepção",
  "Engenharia Clínica",
  "Pronto Atendimento",
];

const TIPOS = [
  "Não Conformidade",
  "Evento Adverso",
  "Quase Falha",
  "Reclamação",
  "Sugestão de Melhoria",
  "Desvio de Processo",
];

const GRAVIDADES = ["Leve", "Moderada", "Grave", "Sentinela"];

const STATUS_ORDEM = [
  "Aberto",
  "Em Análise",
  "Plano de Ação",
  "Aguardando Validação da Qualidade",
  "Fechado",
];

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function capitalizar(txt?: string | null) {
  if (!txt) return "";
  return txt;
}

function getStatusAutomatico(item: Partial<Ocorrencia>) {
  const validado = !!item.validado_qualidade;
  const fechadoEm = item.fechado_em;
  const temPlano = !!item.plano_acao && item.plano_acao.trim() !== "";
  const temCausa = !!item.causa_raiz && item.causa_raiz.trim() !== "";
  const temAcaoImediata = !!item.acao_imediata && item.acao_imediata.trim() !== "";

  if (validado || fechadoEm) return "Fechado";
  if (temPlano) return "Aguardando Validação da Qualidade";
  if (temCausa || temAcaoImediata) return "Plano de Ação";
  if (item.descricao && item.descricao.trim() !== "") return "Em Análise";
  return "Aberto";
}

function prazoVencido(prazo?: string | null, status?: string | null) {
  if (!prazo) return false;
  if (status === "Fechado") return false;
  const hoje = new Date();
  const limite = new Date(prazo + "T23:59:59");
  return limite.getTime() < hoje.getTime();
}

export default function Page() {
  const [sessaoCarregada, setSessaoCarregada] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const [modoAuth, setModoAuth] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [roleCadastro, setRoleCadastro] = useState<"qualidade" | "lider" | "colaborador">("colaborador");
  const [setorCadastro, setSetorCadastro] = useState("Qualidade");

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [relacoes, setRelacoes] = useState<OcorrenciaResponsavel[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState("TODOS");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo_ocorrencia: "Não Conformidade",
    setor_origem: "Qualidade",
    setor_destino: "Qualidade",
    gravidade: "Leve",
    acao_imediata: "",
    causa_raiz: "",
    plano_acao: "",
    prazo: "",
    responsaveisSelecionados: [] as string[],
  });

  useEffect(() => {
    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        await carregarPerfil(uid);
      } else {
        setPerfil(null);
        setOcorrencias([]);
        setResponsaveis([]);
        setRelacoes([]);
      }
      setSessaoCarregada(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (perfil) {
      carregarDados();
    }
  }, [perfil]);

  async function carregarSessao() {
    setErro("");
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setErro("Erro ao carregar sessão: " + error.message);
      setSessaoCarregada(true);
      return;
    }

    const uid = data.session?.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      await carregarPerfil(uid);
    }
    setSessaoCarregada(true);
  }

  async function carregarPerfil(uid: string) {
    setErro("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, email, role, setor")
      .eq("id", uid)
      .single();

    if (error) {
      setErro("Não foi possível carregar o perfil: " + error.message);
      setPerfil(null);
      return;
    }

    setPerfil(data as Perfil);
  }

  async function carregarDados() {
    if (!perfil) return;

    setCarregando(true);
    setErro("");

    let query = supabase
      .from("ocorrencias")
      .select("*")
      .order("created_at", { ascending: false });

    if (perfil.role === "lider" && perfil.setor) {
      query = query.eq("setor_destino", perfil.setor);
    }

    const [resOcorrencias, resResponsaveis, resRelacoes] = await Promise.all([
      query,
      supabase.from("profiles").select("id, nome, email, setor").order("nome"),
      supabase.from("ocorrencia_responsaveis").select("id, ocorrencia_id, responsavel_id"),
    ]);

    if (resOcorrencias.error) {
      setErro("Não foi possível carregar as ocorrências: " + resOcorrencias.error.message);
      setCarregando(false);
      return;
    }

    if (resResponsaveis.error) {
      setErro("Não foi possível carregar os responsáveis: " + resResponsaveis.error.message);
      setCarregando(false);
      return;
    }

    if (resRelacoes.error) {
      setErro("Não foi possível carregar os vínculos de responsáveis: " + resRelacoes.error.message);
      setCarregando(false);
      return;
    }

    const corrigidas = (resOcorrencias.data || []).map((item: any) => ({
      ...item,
      status: getStatusAutomatico(item),
    }));

    setOcorrencias(corrigidas as Ocorrencia[]);
    setResponsaveis((resResponsaveis.data || []) as Responsavel[]);
    setRelacoes((resRelacoes.data || []) as OcorrenciaResponsavel[]);
    setCarregando(false);
  }

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("Erro no login: " + error.message);
    }
  }

  async function fazerCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setErro("Erro no cadastro: " + error.message);
      return;
    }

    const uid = data.user?.id;
    if (!uid) {
      setErro("Cadastro realizado, mas não foi possível obter o ID do usuário.");
      return;
    }

    const { error: perfilError } = await supabase.from("profiles").upsert({
      id: uid,
      nome: nomeCadastro,
      email,
      role: roleCadastro,
      setor: roleCadastro === "qualidade" ? "Qualidade" : setorCadastro,
    });

    if (perfilError) {
      setErro("Usuário criado, mas houve erro ao salvar perfil: " + perfilError.message);
      return;
    }

    alert("Cadastro realizado com sucesso.");
    setModoAuth("login");
  }

  async function sair() {
    await supabase.auth.signOut();
    setPerfil(null);
    setUserId(null);
  }

  async function salvarOcorrencia(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil || !userId) return;

    setSalvando(true);
    setErro("");

    const payloadBase = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      tipo_ocorrencia: form.tipo_ocorrencia,
      setor_origem: form.setor_origem,
      setor_destino: form.setor_destino,
      gravidade: form.gravidade,
      acao_imediata: form.acao_imediata.trim(),
      causa_raiz: form.causa_raiz.trim(),
      plano_acao: form.plano_acao.trim(),
      prazo: form.prazo || null,
      criado_por: userId,
      validado_qualidade: false,
      updated_at: new Date().toISOString(),
    };

    const statusCalculado = getStatusAutomatico(payloadBase);

    if (!editandoId) {
      const { data, error } = await supabase
        .from("ocorrencias")
        .insert({
          ...payloadBase,
          status: statusCalculado,
        })
        .select()
        .single();

      if (error) {
        setErro("Erro ao salvar ocorrência: " + error.message);
        setSalvando(false);
        return;
      }

      const novaId = data.id;

      if (form.responsaveisSelecionados.length > 0) {
        const vinculos = form.responsaveisSelecionados.map((rid) => ({
          ocorrencia_id: novaId,
          responsavel_id: rid,
        }));

        const { error: relError } = await supabase
          .from("ocorrencia_responsaveis")
          .insert(vinculos);

        if (relError) {
          setErro("Ocorrência salva, mas houve erro ao vincular responsáveis: " + relError.message);
        }
      }
    } else {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          ...payloadBase,
          status: statusCalculado,
        })
        .eq("id", editandoId);

      if (error) {
        setErro("Erro ao atualizar ocorrência: " + error.message);
        setSalvando(false);
        return;
      }

      const { error: delRelError } = await supabase
        .from("ocorrencia_responsaveis")
        .delete()
        .eq("ocorrencia_id", editandoId);

      if (delRelError) {
        setErro("Ocorrência atualizada, mas houve erro ao limpar responsáveis: " + delRelError.message);
        setSalvando(false);
        await carregarDados();
        return;
      }

      if (form.responsaveisSelecionados.length > 0) {
        const vinculos = form.responsaveisSelecionados.map((rid) => ({
          ocorrencia_id: editandoId,
          responsavel_id: rid,
        }));

        const { error: relError } = await supabase
          .from("ocorrencia_responsaveis")
          .insert(vinculos);

        if (relError) {
          setErro("Ocorrência atualizada, mas houve erro ao salvar responsáveis: " + relError.message);
        }
      }
    }

    limparFormulario();
    await carregarDados();
    setSalvando(false);
  }

  function editar(item: Ocorrencia) {
    const responsaveisDaOcorrencia = relacoes
      .filter((r) => r.ocorrencia_id === item.id)
      .map((r) => r.responsavel_id);

    setEditandoId(item.id);
    setForm({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      tipo_ocorrencia: item.tipo_ocorrencia || "Não Conformidade",
      setor_origem: item.setor_origem || "Qualidade",
      setor_destino: item.setor_destino || "Qualidade",
      gravidade: item.gravidade || "Leve",
      acao_imediata: item.acao_imediata || "",
      causa_raiz: item.causa_raiz || "",
      plano_acao: item.plano_acao || "",
      prazo: item.prazo || "",
      responsaveisSelecionados: responsaveisDaOcorrencia,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function validarFechamento(item: Ocorrencia) {
    if (!perfil) return;
    if (perfil.role !== "qualidade") {
      alert("Somente a Qualidade pode validar o fechamento.");
      return;
    }

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        validado_qualidade: true,
        validado_por: perfil.id,
        validado_em: new Date().toISOString(),
        fechado_em: new Date().toISOString(),
        status: "Fechado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setErro("Erro ao validar fechamento: " + error.message);
      return;
    }

    await carregarDados();
  }

  async function excluir(id: string) {
    const confirmar = window.confirm("Deseja excluir esta ocorrência?");
    if (!confirmar) return;

    const { error: relError } = await supabase
      .from("ocorrencia_responsaveis")
      .delete()
      .eq("ocorrencia_id", id);

    if (relError) {
      setErro("Erro ao remover responsáveis: " + relError.message);
      return;
    }

    const { error } = await supabase.from("ocorrencias").delete().eq("id", id);

    if (error) {
      setErro("Erro ao excluir ocorrência: " + error.message);
      return;
    }

    await carregarDados();
  }

  function limparFormulario() {
    setEditandoId(null);
    setForm({
      titulo: "",
      descricao: "",
      tipo_ocorrencia: "Não Conformidade",
      setor_origem: perfil?.role === "lider" && perfil.setor ? perfil.setor : "Qualidade",
      setor_destino: perfil?.role === "lider" && perfil.setor ? perfil.setor : "Qualidade",
      gravidade: "Leve",
      acao_imediata: "",
      causa_raiz: "",
      plano_acao: "",
      prazo: "",
      responsaveisSelecionados: [],
    });
  }

  useEffect(() => {
    if (perfil) {
      limparFormulario();
    }
  }, [perfil?.id]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto =
        `${item.titulo} ${item.descricao || ""} ${item.tipo_ocorrencia} ${item.setor_origem} ${item.setor_destino}`
          .toLowerCase();

      const passaBusca = texto.includes(busca.toLowerCase());
      const passaStatus = filtroStatus === "TODOS" || item.status === filtroStatus;
      const passaGravidade = filtroGravidade === "TODOS" || item.gravidade === filtroGravidade;
      const passaSetor =
        filtroSetor === "TODOS" ||
        item.setor_origem === filtroSetor ||
        item.setor_destino === filtroSetor;

      return passaBusca && passaStatus && passaGravidade && passaSetor;
    });
  }, [ocorrencias, busca, filtroStatus, filtroGravidade, filtroSetor]);

  const indicadores = useMemo(() => {
    const total = ocorrenciasFiltradas.length;
    const abertas = ocorrenciasFiltradas.filter((o) => o.status !== "Fechado").length;
    const fechadas = ocorrenciasFiltradas.filter((o) => o.status === "Fechado").length;
    const vencidas = ocorrenciasFiltradas.filter((o) => prazoVencido(o.prazo, o.status)).length;
    const graves = ocorrenciasFiltradas.filter((o) => o.gravidade === "Grave" || o.gravidade === "Sentinela").length;

    const porStatus = STATUS_ORDEM.map((status) => ({
      nome: status,
      valor: ocorrenciasFiltradas.filter((o) => o.status === status).length,
    }));

    const porSetor = SETORES.map((setor) => ({
      nome: setor,
      valor: ocorrenciasFiltradas.filter((o) => o.setor_destino === setor).length,
    })).filter((x) => x.valor > 0);

    return { total, abertas, fechadas, vencidas, graves, porStatus, porSetor };
  }, [ocorrenciasFiltradas]);

  function nomesResponsaveis(ocorrenciaId: string) {
    const ids = relacoes
      .filter((r) => r.ocorrencia_id === ocorrenciaId)
      .map((r) => r.responsavel_id);

    return responsaveis
      .filter((p) => ids.includes(p.id))
      .map((p) => p.nome)
      .join(", ");
  }

  function exportarPDF() {
    window.print();
  }

  if (!sessaoCarregada) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>Carregando sessão...</div>
      </main>
    );
  }

  if (!userId || !perfil) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 520, width: "100%" }}>
          <h1 style={styles.title}>Sistema Hospitalar de Qualidade - V7</h1>
          <p style={styles.subtitle}>
            Login real com Supabase Auth, perfil por usuário, liderança por setor,
            validação da Qualidade e plano de ação com múltiplos responsáveis.
          </p>

          <div style={styles.tabRow}>
            <button
              onClick={() => setModoAuth("login")}
              style={{
                ...styles.tab,
                ...(modoAuth === "login" ? styles.tabActive : {}),
              }}
            >
              Login
            </button>
            <button
              onClick={() => setModoAuth("cadastro")}
              style={{
                ...styles.tab,
                ...(modoAuth === "cadastro" ? styles.tabActive : {}),
              }}
            >
              Cadastro
            </button>
          </div>

          {modoAuth === "login" ? (
            <form onSubmit={fazerLogin} style={styles.form}>
              <input
                style={styles.input}
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button style={styles.primaryButton} type="submit">
                Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={fazerCadastro} style={styles.form}>
              <input
                style={styles.input}
                placeholder="Nome completo"
                value={nomeCadastro}
                onChange={(e) => setNomeCadastro(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <select
                style={styles.input}
                value={roleCadastro}
                onChange={(e) => setRoleCadastro(e.target.value as any)}
              >
                <option value="colaborador">Colaborador</option>
                <option value="lider">Líder</option>
                <option value="qualidade">Qualidade</option>
              </select>

              {roleCadastro !== "qualidade" && (
                <select
                  style={styles.input}
                  value={setorCadastro}
                  onChange={(e) => setSetorCadastro(e.target.value)}
                >
                  {SETORES.filter((s) => s !== "Qualidade").map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              )}

              <button style={styles.primaryButton} type="submit">
                Criar conta
              </button>
            </form>
          )}

          {erro && <div style={styles.errorBox}>{erro}</div>}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <h1 style={styles.title}>Sistema Hospitalar de Qualidade - V7</h1>
          <p style={styles.subtitle}>
            Usuário: <strong>{perfil.nome}</strong> | Perfil: <strong>{perfil.role}</strong> | Setor:{" "}
            <strong>{perfil.setor || "-"}</strong>
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={exportarPDF}>
            Exportar PDF
          </button>
          <button style={styles.secondaryButton} onClick={sair}>
            Sair
          </button>
        </div>
      </div>

      {erro && <div style={styles.errorBox}>{erro}</div>}

      <section style={styles.grid4}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total</div>
          <div style={styles.kpiValue}>{indicadores.total}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Em aberto</div>
          <div style={styles.kpiValue}>{indicadores.abertas}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Fechadas</div>
          <div style={styles.kpiValue}>{indicadores.fechadas}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Prazo vencido</div>
          <div style={styles.kpiValue}>{indicadores.vencidas}</div>
        </div>
      </section>

      <section style={styles.dashboardGrid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Gráfico por status</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {indicadores.porStatus.map((item) => {
              const max = Math.max(...indicadores.porStatus.map((x) => x.valor), 1);
              const largura = `${(item.valor / max) * 100}%`;

              return (
                <div key={item.nome}>
                  <div style={styles.barHeader}>
                    <span>{item.nome}</span>
                    <strong>{item.valor}</strong>
                  </div>
                  <div style={styles.barBg}>
                    <div style={{ ...styles.barFill, width: largura }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Gráfico por setor destino</h2>
          <div style={{ display: "grid", gap: 12, maxHeight: 320, overflowY: "auto" }}>
            {indicadores.porSetor.length === 0 && <div>Nenhum dado disponível.</div>}
            {indicadores.porSetor.map((item) => {
              const max = Math.max(...indicadores.porSetor.map((x) => x.valor), 1);
              const largura = `${(item.valor / max) * 100}%`;

              return (
                <div key={item.nome}>
                  <div style={styles.barHeader}>
                    <span>{item.nome}</span>
                    <strong>{item.valor}</strong>
                  </div>
                  <div style={styles.barBg}>
                    <div style={{ ...styles.barFillSoft, width: largura }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editandoId ? "Editar ocorrência" : "Nova ocorrência"}
        </h2>

        <form onSubmit={salvarOcorrencia} style={styles.formGrid}>
          <input
            style={styles.input}
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />

          <select
            style={styles.input}
            value={form.tipo_ocorrencia}
            onChange={(e) => setForm({ ...form, tipo_ocorrencia: e.target.value })}
          >
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={form.setor_origem}
            onChange={(e) => setForm({ ...form, setor_origem: e.target.value })}
            disabled={perfil.role === "lider"}
          >
            {SETORES.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={form.setor_destino}
            onChange={(e) => setForm({ ...form, setor_destino: e.target.value })}
            disabled={perfil.role === "lider"}
          >
            {SETORES.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={form.gravidade}
            onChange={(e) => setForm({ ...form, gravidade: e.target.value })}
          >
            {GRAVIDADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <input
            style={styles.input}
            type="date"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
          />

          <textarea
            style={{ ...styles.input, minHeight: 90, gridColumn: "1 / -1" }}
            placeholder="Descrição da ocorrência"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />

          <textarea
            style={{ ...styles.input, minHeight: 90 }}
            placeholder="Ação imediata"
            value={form.acao_imediata}
            onChange={(e) => setForm({ ...form, acao_imediata: e.target.value })}
          />

          <textarea
            style={{ ...styles.input, minHeight: 90 }}
            placeholder="Causa raiz"
            value={form.causa_raiz}
            onChange={(e) => setForm({ ...form, causa_raiz: e.target.value })}
          />

          <textarea
            style={{ ...styles.input, minHeight: 90, gridColumn: "1 / -1" }}
            placeholder="Plano de ação"
            value={form.plano_acao}
            onChange={(e) => setForm({ ...form, plano_acao: e.target.value })}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Responsáveis múltiplos</label>
            <select
              multiple
              style={{ ...styles.input, minHeight: 140 }}
              value={form.responsaveisSelecionados}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                setForm({ ...form, responsaveisSelecionados: values });
              }}
            >
              {responsaveis
                .filter((r) =>
                  perfil.role === "qualidade"
                    ? true
                    : perfil.role === "lider"
                    ? r.setor === perfil.setor
                    : true
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} - {r.setor || "-"}
                  </option>
                ))}
            </select>
          </div>

          <div style={styles.actionsRow}>
            <button style={styles.primaryButton} type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Atualizar" : "Salvar"}
            </button>

            {editandoId && (
              <button type="button" style={styles.secondaryButton} onClick={limparFormulario}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros</h2>

        <div style={styles.filtersGrid}>
          <input
            style={styles.input}
            placeholder="Buscar por título, descrição, setor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            style={styles.input}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="TODOS">Todos os status</option>
            {STATUS_ORDEM.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={filtroGravidade}
            onChange={(e) => setFiltroGravidade(e.target.value)}
          >
            <option value="TODOS">Todas as gravidades</option>
            {GRAVIDADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={filtroSetor}
            onChange={(e) => setFiltroSetor(e.target.value)}
          >
            <option value="TODOS">Todos os setores</option>
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Lista de ocorrências {carregando ? "(carregando...)" : `(${ocorrenciasFiltradas.length})`}
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          {ocorrenciasFiltradas.length === 0 && <div>Nenhuma ocorrência encontrada.</div>}

          {ocorrenciasFiltradas.map((item) => {
            const vencido = prazoVencido(item.prazo, item.status);
            const nomesResp = nomesResponsaveis(item.id);

            return (
              <div key={item.id} style={styles.ocorrenciaCard}>
                <div style={styles.ocorrenciaTop}>
                  <div>
                    <h3 style={{ margin: 0 }}>{capitalizar(item.titulo)}</h3>
                    <div style={styles.metaText}>
                      Tipo: <strong>{item.tipo_ocorrencia}</strong> | Gravidade:{" "}
                      <strong>{item.gravidade}</strong>
                    </div>
                    <div style={styles.metaText}>
                      Origem: <strong>{item.setor_origem}</strong> | Destino:{" "}
                      <strong>{item.setor_destino}</strong>
                    </div>
                  </div>

                  <div style={styles.badgeColumn}>
                    <span style={styles.badge}>{item.status}</span>
                    {vencido && <span style={styles.badgeDanger}>Prazo vencido</span>}
                    {item.validado_qualidade && (
                      <span style={styles.badgeSuccess}>Validado pela Qualidade</span>
                    )}
                  </div>
                </div>

                <div style={styles.infoGrid}>
                  <div>
                    <strong>Descrição:</strong>
                    <p style={styles.paragraph}>{item.descricao || "-"}</p>
                  </div>

                  <div>
                    <strong>Ação imediata:</strong>
                    <p style={styles.paragraph}>{item.acao_imediata || "-"}</p>
                  </div>

                  <div>
                    <strong>Causa raiz:</strong>
                    <p style={styles.paragraph}>{item.causa_raiz || "-"}</p>
                  </div>

                  <div>
                    <strong>Plano de ação:</strong>
                    <p style={styles.paragraph}>{item.plano_acao || "-"}</p>
                  </div>

                  <div>
                    <strong>Responsáveis:</strong>
                    <p style={styles.paragraph}>{nomesResp || "-"}</p>
                  </div>

                  <div>
                    <strong>Prazo:</strong>
                    <p style={styles.paragraph}>{formatarData(item.prazo)}</p>
                  </div>

                  <div>
                    <strong>Criado em:</strong>
                    <p style={styles.paragraph}>{formatarDataHora(item.created_at)}</p>
                  </div>

                  <div>
                    <strong>Validação da Qualidade:</strong>
                    <p style={styles.paragraph}>
                      {item.validado_qualidade
                        ? `Sim - ${formatarDataHora(item.validado_em)}`
                        : "Pendente"}
                    </p>
                  </div>
                </div>

                <div style={styles.actionsRow}>
                  <button style={styles.secondaryButton} onClick={() => editar(item)}>
                    Editar
                  </button>

                  <button style={styles.secondaryButton} onClick={() => excluir(item.id)}>
                    Excluir
                  </button>

                  {perfil.role === "qualidade" &&
                    item.status === "Aguardando Validação da Qualidade" &&
                    !item.validado_qualidade && (
                      <button style={styles.primaryButton} onClick={() => validarFechamento(item)}>
                        Validar fechamento
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f8fb",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    color: "#16324f",
  },
  headerCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: "#0f3d63",
  },
  subtitle: {
    marginTop: 8,
    color: "#4c647a",
    lineHeight: 1.5,
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 16,
    color: "#0f3d63",
  },
  form: {
    display: "grid",
    gap: 12,
    marginTop: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #c8d5e2",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  primaryButton: {
    padding: "12px 16px",
    background: "#0f6cbd",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 16px",
    background: "#e9f1f8",
    color: "#16324f",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  errorBox: {
    background: "#fdeaea",
    color: "#a12626",
    border: "1px solid #f5b9b9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
  },
  kpiLabel: {
    color: "#587086",
    fontSize: 14,
  },
  kpiValue: {
    fontSize: 30,
    fontWeight: 700,
    marginTop: 8,
    color: "#0f3d63",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 20,
  },
  barHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 14,
  },
  barBg: {
    width: "100%",
    height: 14,
    background: "#e6eef5",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #0f6cbd, #5fa8e8)",
  },
  barFillSoft: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #2f855a, #68d391)",
  },
  ocorrenciaCard: {
    border: "1px solid #d8e4ef",
    borderRadius: 14,
    padding: 16,
    background: "#fbfdff",
  },
  ocorrenciaTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  metaText: {
    color: "#5b7287",
    marginTop: 6,
    fontSize: 14,
  },
  badgeColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  badge: {
    background: "#e8f2fb",
    color: "#0f6cbd",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeDanger: {
    background: "#fdeaea",
    color: "#a12626",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeSuccess: {
    background: "#e8f8ee",
    color: "#1f7a45",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginBottom: 14,
  },
  paragraph: {
    margin: "8px 0 0 0",
    color: "#32485c",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  actionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  tabRow: {
    display: "flex",
    gap: 8,
    marginTop: 18,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #d3dde7",
    background: "#f7fafc",
    cursor: "pointer",
    fontWeight: 700,
  },
  tabActive: {
    background: "#0f6cbd",
    color: "#fff",
    border: "1px solid #0f6cbd",
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: 700,
    color: "#16324f",
  },
};