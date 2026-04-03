"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";

type StatusOcorrencia =
  | "Aberta"
  | "Em análise pela Qualidade"
  | "Direcionada ao Setor"
  | "Em tratativa"
  | "Aguardando validação da Qualidade"
  | "Concluída";

type Role = "qualidade" | "lideranca" | "diretoria";

type Profile = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  setor: string | null;
};

type Ocorrencia = {
  id: number;
  created_at: string;
  updated_at: string;
  titulo: string;
  descricao: string;
  setor_origem: string;
  setor_destino: string | null;
  tipo_ocorrencia: string | null;
  gravidade: string | null;
  anonima: boolean;
  status: StatusOcorrencia;
  data_direcionamento: string | null;
  data_inicio_tratativa: string | null;
  data_envio_validacao: string | null;
  data_conclusao: string | null;
  acao_imediata: string | null;
  analise_qualidade: string | null;
  tratativa_setor: string | null;
  validacao_qualidade: string | null;
  criado_por: string | null;
  criado_por_nome: string | null;
  criado_por_email: string | null;
};

type HistoricoStatus = {
  id: number;
  ocorrencia_id: number;
  created_at: string;
  status_anterior: StatusOcorrencia | null;
  status_novo: StatusOcorrencia;
  observacao: string | null;
};

const setores = [
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

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregandoAcesso, setCarregandoAcesso] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setorOrigem, setSetorOrigem] = useState("");
  const [tipoOcorrencia, setTipoOcorrencia] = useState("");
  const [gravidade, setGravidade] = useState("");

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Ocorrencia | null>(null);

  const [analiseQualidade, setAnaliseQualidade] = useState("");
  const [setorDestino, setSetorDestino] = useState("");
  const [tratativaSetor, setTratativaSetor] = useState("");
  const [validacaoQualidade, setValidacaoQualidade] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    validarAcesso();
  }, []);

  async function validarAcesso() {
    setCarregandoAcesso(true);
    setErro("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace("/");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profileData) {
      setErro("Perfil do usuário não encontrado.");
      setCarregandoAcesso(false);
      return;
    }

    const profileReal = profileData as Profile;
    setProfile(profileReal);

    await carregarOcorrencias(profileReal);
    setCarregandoAcesso(false);
  }

  async function carregarOcorrencias(profileAtual?: Profile) {
    const perfil = profileAtual || profile;
    if (!perfil) return;

    setCarregando(true);
    setErro("");

    let query = supabase.from("ocorrencias").select("*");

    if (perfil.role === "lideranca" && perfil.setor) {
      query = query.eq("setor_destino", perfil.setor);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      setErro("Não foi possível carregar as ocorrências: " + error.message);
      setCarregando(false);
      return;
    }

    setOcorrencias((data || []) as Ocorrencia[]);
    setCarregando(false);
  }

  async function carregarHistorico(ocorrenciaId: number) {
    const { data, error } = await supabase
      .from("historico_status_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaId)
      .order("created_at", { ascending: false });

    if (error) {
      setErro("Não foi possível carregar o histórico: " + error.message);
      return;
    }

    setHistorico((data || []) as HistoricoStatus[]);
  }

  async function buscarOcorrenciaPorId(id: number) {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErro("Erro ao recarregar ocorrência: " + error.message);
      return null;
    }

    return data as Ocorrencia;
  }

  async function selecionarOcorrencia(ocorrencia: Ocorrencia) {
    setOcorrenciaSelecionada(ocorrencia);
    setAnaliseQualidade(ocorrencia.analise_qualidade || "");
    setSetorDestino(ocorrencia.setor_destino || "");
    setTratativaSetor(ocorrencia.tratativa_setor || "");
    setValidacaoQualidade(ocorrencia.validacao_qualidade || "");
    await carregarHistorico(ocorrencia.id);
  }

  async function criarOcorrencia() {
    if (!profile) return;

    if (!titulo.trim() || !descricao.trim() || !setorOrigem.trim()) {
      setErro("Preencha título, descrição e setor de origem.");
      return;
    }

    setSalvando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("ocorrencias").insert({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      setor_origem: setorOrigem,
      tipo_ocorrencia: tipoOcorrencia || null,
      gravidade: gravidade || null,
      anonima: true,
      criado_por: user?.id || null,
      criado_por_nome: profile.nome,
      criado_por_email: profile.email,
    });

    if (error) {
      setErro("Erro ao criar ocorrência: " + error.message);
      setSalvando(false);
      return;
    }

    setTitulo("");
    setDescricao("");
    setSetorOrigem("");
    setTipoOcorrencia("");
    setGravidade("");
    setSalvando(false);

    await carregarOcorrencias();
  }

  async function salvarAnalise() {
    if (!ocorrenciaSelecionada) return;

    setSalvando(true);
    setErro("");

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        analise_qualidade: analiseQualidade || null,
        setor_destino: setorDestino || null,
      })
      .eq("id", ocorrenciaSelecionada.id);

    if (error) {
      setErro("Erro ao salvar análise da qualidade: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    await carregarOcorrencias();

    const atualizada = await buscarOcorrenciaPorId(ocorrenciaSelecionada.id);
    if (atualizada) {
      await selecionarOcorrencia(atualizada);
    }
  }

  async function salvarTratativa() {
    if (!ocorrenciaSelecionada) return;

    setSalvando(true);
    setErro("");

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        tratativa_setor: tratativaSetor || null,
      })
      .eq("id", ocorrenciaSelecionada.id);

    if (error) {
      setErro("Erro ao salvar tratativa: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    await carregarOcorrencias();

    const atualizada = await buscarOcorrenciaPorId(ocorrenciaSelecionada.id);
    if (atualizada) {
      await selecionarOcorrencia(atualizada);
    }
  }

  async function salvarValidacao() {
    if (!ocorrenciaSelecionada) return;

    setSalvando(true);
    setErro("");

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        validacao_qualidade: validacaoQualidade || null,
      })
      .eq("id", ocorrenciaSelecionada.id);

    if (error) {
      setErro("Erro ao salvar validação: " + error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    await carregarOcorrencias();

    const atualizada = await buscarOcorrenciaPorId(ocorrenciaSelecionada.id);
    if (atualizada) {
      await selecionarOcorrencia(atualizada);
    }
  }

  async function sairSistema() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === "Aberta").length,
      analise: ocorrencias.filter((o) => o.status === "Em análise pela Qualidade").length,
      direcionadas: ocorrencias.filter((o) => o.status === "Direcionada ao Setor").length,
      tratativa: ocorrencias.filter((o) => o.status === "Em tratativa").length,
      validacao: ocorrencias.filter((o) => o.status === "Aguardando validação da Qualidade").length,
      concluidas: ocorrencias.filter((o) => o.status === "Concluída").length,
    };
  }, [ocorrencias]);

  if (carregandoAcesso) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f8f6",
          color: "#17372d",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        Carregando acesso do sistema...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f3f8f6 0%, #edf5f1 100%)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <header
          style={{
            background: "#ffffff",
            border: "1px solid #dcefe6",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 16px 40px rgba(28, 76, 60, 0.06)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "#eff8f4",
                  border: "1px solid #d5e9df",
                  color: "#2b6d58",
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                Ambiente assistencial e administrativo
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  color: "#17372d",
                }}
              >
                Sistema de Gestão da Qualidade
              </h1>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#5a796e",
                  lineHeight: 1.7,
                  maxWidth: 760,
                }}
              >
                Painel profissional para registro, análise, tratativa e validação
                de ocorrências com fluxo automático e controle por perfil.
              </p>
            </div>

            <div
              style={{
                minWidth: 320,
                background: "#f9fcfb",
                border: "1px solid #dcefe6",
                borderRadius: 20,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, color: "#5c7a6f", marginBottom: 6 }}>
                Usuário autenticado
              </div>

              <div style={{ fontWeight: 700, fontSize: 17, color: "#18372e" }}>
                {profile?.nome || "-"}
              </div>

              <div style={{ color: "#567267", marginTop: 4 }}>
                {profile?.email || "-"}
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#edf7f2",
                  color: "#2d6a57",
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                Perfil: {profile?.role || "-"}
              </div>

              {profile?.setor && (
                <div
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "#f3f8f6",
                    color: "#315f50",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Setor: {profile.setor}
                </div>
              )}

              <button
                onClick={sairSistema}
                style={{
                  marginTop: 16,
                  width: "100%",
                  border: "1px solid #d8e7df",
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: "#ffffff",
                  color: "#285846",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sair do sistema
              </button>
            </div>
          </div>
        </header>

        {erro && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 16,
              background: "#fff3f3",
              border: "1px solid #efd0d0",
              color: "#8d3131",
              fontWeight: 600,
            }}
          >
            {erro}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <IndicadorCard titulo="Total" valor={indicadores.total} />
          <IndicadorCard titulo="Abertas" valor={indicadores.abertas} />
          <IndicadorCard titulo="Em análise" valor={indicadores.analise} />
          <IndicadorCard titulo="Direcionadas" valor={indicadores.direcionadas} />
          <IndicadorCard titulo="Em tratativa" valor={indicadores.tratativa} />
          <IndicadorCard titulo="Concluídas" valor={indicadores.concluidas} />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr 1.1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Nova ocorrência</h2>
              <p style={panelTextStyle}>
                Registro inicial da ocorrência com padrão institucional.
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Descreva o tema principal"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhe a ocorrência registrada"
                  rows={5}
                  style={textareaStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Setor de origem</label>
                <select
                  value={setorOrigem}
                  onChange={(e) => setSetorOrigem(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tipo de ocorrência</label>
                <input
                  value={tipoOcorrencia}
                  onChange={(e) => setTipoOcorrencia(e.target.value)}
                  placeholder="Ex.: Não conformidade, evento, falha de processo"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Gravidade</label>
                <select
                  value={gravidade}
                  onChange={(e) => setGravidade(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  <option value="Leve">Leve</option>
                  <option value="Moderada">Moderada</option>
                  <option value="Grave">Grave</option>
                </select>
              </div>

              <button
                onClick={criarOcorrencia}
                disabled={salvando}
                style={buttonPrimary}
              >
                {salvando ? "Salvando..." : "Registrar ocorrência"}
              </button>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Ocorrências registradas</h2>
              <p style={panelTextStyle}>
                Relação de ocorrências disponíveis conforme o perfil autenticado.
              </p>
            </div>

            {carregando ? (
              <p style={panelTextStyle}>Carregando...</p>
            ) : ocorrencias.length === 0 ? (
              <p style={panelTextStyle}>Nenhuma ocorrência cadastrada.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {ocorrencias.map((ocorrencia) => (
                  <button
                    key={ocorrencia.id}
                    onClick={() => selecionarOcorrencia(ocorrencia)}
                    style={{
                      textAlign: "left",
                      border:
                        ocorrenciaSelecionada?.id === ocorrencia.id
                          ? "2px solid #5d9d84"
                          : "1px solid #dcefe6",
                      background:
                        ocorrenciaSelecionada?.id === ocorrencia.id
                          ? "#f4fbf7"
                          : "#fbfefd",
                      borderRadius: 18,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#17372d",
                      }}
                    >
                      {ocorrencia.titulo}
                    </div>

                    <div style={{ marginTop: 8, color: "#5b786d", fontSize: 14 }}>
                      Origem: {ocorrencia.setor_origem}
                    </div>

                    <div style={{ marginTop: 4, color: "#5b786d", fontSize: 14 }}>
                      Destino: {ocorrencia.setor_destino || "-"}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#5b786d",
                        fontSize: 14,
                      }}
                    >
                      Aberta por: {ocorrencia.criado_por_nome || "Usuário"}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        display: "inline-flex",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#edf7f2",
                        color: "#2d6b57",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {ocorrencia.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Tratativa e validação</h2>
              <p style={panelTextStyle}>
                Fluxo institucional com evolução automática de status.
              </p>
            </div>

            {!ocorrenciaSelecionada ? (
              <p style={panelTextStyle}>
                Selecione uma ocorrência para abrir o detalhamento.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    border: "1px solid #dcefe6",
                    borderRadius: 18,
                    padding: 16,
                    background: "#fbfefd",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#17372d" }}>
                    {ocorrenciaSelecionada.titulo}
                  </div>
                  <p
                    style={{
                      marginTop: 10,
                      marginBottom: 0,
                      color: "#5a786d",
                      lineHeight: 1.7,
                    }}
                  >
                    {ocorrenciaSelecionada.descricao}
                  </p>

                  <div style={{ marginTop: 14, display: "grid", gap: 6, color: "#45655a" }}>
                    <div><strong>Setor origem:</strong> {ocorrenciaSelecionada.setor_origem}</div>
                    <div><strong>Setor destino:</strong> {ocorrenciaSelecionada.setor_destino || "-"}</div>
                    <div><strong>Status atual:</strong> {ocorrenciaSelecionada.status}</div>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h3 style={sectionTitleStyle}>1. Análise da Qualidade</h3>
                  <textarea
                    value={analiseQualidade}
                    onChange={(e) => setAnaliseQualidade(e.target.value)}
                    rows={4}
                    placeholder="Registrar análise da qualidade"
                    style={textareaStyle}
                    disabled={profile?.role === "lideranca"}
                  />

                  <select
                    value={setorDestino}
                    onChange={(e) => setSetorDestino(e.target.value)}
                    style={inputStyle}
                    disabled={profile?.role === "lideranca"}
                  >
                    <option value="">Selecionar setor destino</option>
                    {setores.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={salvarAnalise}
                    disabled={salvando || profile?.role === "lideranca"}
                    style={buttonPrimary}
                  >
                    Salvar análise e direcionamento
                  </button>
                </div>

                <div style={boxStyle}>
                  <h3 style={sectionTitleStyle}>2. Tratativa do Setor</h3>
                  <textarea
                    value={tratativaSetor}
                    onChange={(e) => setTratativaSetor(e.target.value)}
                    rows={4}
                    placeholder="Registrar a tratativa executada pelo setor"
                    style={textareaStyle}
                  />
                  <button onClick={salvarTratativa} disabled={salvando} style={buttonPrimary}>
                    Salvar tratativa
                  </button>
                </div>

                <div style={boxStyle}>
                  <h3 style={sectionTitleStyle}>3. Validação da Qualidade</h3>
                  <textarea
                    value={validacaoQualidade}
                    onChange={(e) => setValidacaoQualidade(e.target.value)}
                    rows={4}
                    placeholder="Ex.: evidências recebidas e validadas / Concluída"
                    style={textareaStyle}
                    disabled={profile?.role === "lideranca"}
                  />
                  <button
                    onClick={salvarValidacao}
                    disabled={salvando || profile?.role === "lideranca"}
                    style={buttonPrimary}
                  >
                    Salvar validação
                  </button>
                </div>

                <div style={boxStyle}>
                  <h3 style={sectionTitleStyle}>Histórico automático</h3>

                  {historico.length === 0 ? (
                    <p style={panelTextStyle}>Nenhum histórico disponível.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {historico.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #dcefe6",
                            borderRadius: 16,
                            padding: 12,
                            background: "#fbfefd",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#17372d" }}>
                            {item.status_anterior
                              ? `${item.status_anterior} → ${item.status_novo}`
                              : item.status_novo}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: "#607c71",
                            }}
                          >
                            {new Date(item.created_at).toLocaleString("pt-BR")}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: "#4e6d62",
                              lineHeight: 1.6,
                            }}
                          >
                            {item.observacao || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function IndicadorCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dcefe6",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 10px 24px rgba(25, 70, 56, 0.05)",
      }}
    >
      <div style={{ fontSize: 13, color: "#5f7d72", fontWeight: 600 }}>{titulo}</div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: "#17372d",
          marginTop: 8,
        }}
      >
        {valor}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dcefe6",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 16px 40px rgba(28, 76, 60, 0.06)",
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: "#17372d",
};

const panelTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  color: "#5d7b70",
  lineHeight: 1.7,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 700,
  color: "#264d40",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid #cfe3d9",
  background: "#fbfefd",
  fontSize: 14,
  color: "#17372d",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid #cfe3d9",
  background: "#fbfefd",
  fontSize: 14,
  color: "#17372d",
  outline: "none",
  resize: "vertical",
};

const buttonPrimary: React.CSSProperties = {
  border: "none",
  borderRadius: 16,
  padding: "14px 16px",
  background: "linear-gradient(135deg, #4f9a7a 0%, #2f7a60 100%)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(53, 122, 97, 0.20)",
};

const boxStyle: React.CSSProperties = {
  border: "1px solid #dcefe6",
  borderRadius: 20,
  padding: 16,
  background: "#f9fcfb",
  display: "grid",
  gap: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  color: "#1d483c",
};