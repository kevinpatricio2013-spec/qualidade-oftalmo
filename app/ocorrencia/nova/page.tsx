"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase";

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

const GRAVIDADES = ["Leve", "Moderada", "Alta", "Grave"];

const TIPOS_OCORRENCIA = [
  "Não conformidade assistencial",
  "Não conformidade administrativa",
  "Evento adverso",
  "Quase falha",
  "Falha de processo",
  "Reclamação",
  "Sugestão de melhoria",
  "Desvio de protocolo",
  "Problema com material",
  "Problema com medicamento",
  "Problema com equipamento",
  "Problema de comunicação",
  "Problema de documentação",
  "Problema de segurança do paciente",
  "Outros",
];

type FormData = {
  titulo: string;
  descricao: string;
  setor_origem: string;
  gravidade: string;
  tipo_ocorrencia: string;
};

const FORM_INICIAL: FormData = {
  titulo: "",
  descricao: "",
  setor_origem: "",
  gravidade: "",
  tipo_ocorrencia: "",
};

export default function NovaOcorrenciaPage() {
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const podeEnviar = useMemo(() => {
    return (
      form.titulo.trim() &&
      form.descricao.trim() &&
      form.setor_origem &&
      form.gravidade &&
      form.tipo_ocorrencia
    );
  }, [form]);

  function atualizarCampo<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (!podeEnviar) {
      setErro("Preencha todos os campos obrigatórios para registrar a ocorrência.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        setor_origem: form.setor_origem,
        gravidade: form.gravidade,
        tipo_ocorrencia: form.tipo_ocorrencia,
      };

      const { error } = await supabase.from("ocorrencias").insert(payload);

      if (error) {
        setErro(`Erro ao criar ocorrência: ${error.message}`);
        return;
      }

      setMensagem(
        "Ocorrência registrada com sucesso. O caso foi encaminhado para análise da Qualidade."
      );
      setForm(FORM_INICIAL);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível registrar a ocorrência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundDetailTop} />
      <div style={styles.backgroundDetailBottom} />

      <section style={styles.wrapper}>
        <header style={styles.topbar}>
          <div>
            <div style={styles.badge}>Registro público de ocorrência</div>
            <h1 style={styles.title}>Nova Ocorrência</h1>
            <p style={styles.subtitle}>
              Ambiente simples e profissional para registro de ocorrências, não
              conformidades, eventos e oportunidades de melhoria.
            </p>
          </div>

          <div style={styles.topbarActions}>
            <Link href="/" style={styles.secondaryButton}>
              Voltar ao início
            </Link>
            <Link href="/login" style={styles.primaryButtonLink}>
              Acessar sistema
            </Link>
          </div>
        </header>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Registro da ocorrência</h2>
              <p style={styles.cardText}>
                Preencha os dados abaixo. O direcionamento será realizado
                posteriormente pela equipe da Qualidade.
              </p>
            </div>
          </div>

          {mensagem ? <div style={styles.successBox}>{mensagem}</div> : null}
          {erro ? <div style={styles.errorBox}>{erro}</div> : null}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Título</label>
              <input
                value={form.titulo}
                onChange={(e) => atualizarCampo("titulo", e.target.value)}
                placeholder="Descreva o assunto principal da ocorrência"
                style={styles.input}
              />
            </div>

            <div style={styles.gridTwo}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tipo de ocorrência</label>
                <select
                  value={form.tipo_ocorrencia}
                  onChange={(e) =>
                    atualizarCampo("tipo_ocorrencia", e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="">Selecione</option>
                  {TIPOS_OCORRENCIA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Gravidade</label>
                <select
                  value={form.gravidade}
                  onChange={(e) => atualizarCampo("gravidade", e.target.value)}
                  style={styles.select}
                >
                  <option value="">Selecione</option>
                  {GRAVIDADES.map((gravidade) => (
                    <option key={gravidade} value={gravidade}>
                      {gravidade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Setor de origem</label>
              <select
                value={form.setor_origem}
                onChange={(e) => atualizarCampo("setor_origem", e.target.value)}
                style={styles.select}
              >
                <option value="">Selecione</option>
                {SETORES.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                placeholder="Descreva a situação observada com o máximo de clareza"
                style={styles.textarea}
              />
            </div>

            <div style={styles.infoBox}>
              <strong>Importante:</strong> o colaborador não define setor
              responsável. Após o registro, a ocorrência segue para análise da
              Qualidade.
            </div>

            <div style={styles.actions}>
              <Link href="/" style={styles.secondaryButton}>
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.primaryButton,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Enviando..." : "Registrar ocorrência"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #eef6ff 0%, #f8fbff 55%, #edf5ff 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      'Inter, Arial, "Segoe UI", Roboto, Helvetica, sans-serif',
    padding: "32px 20px 48px",
  },

  backgroundDetailTop: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.10)",
    filter: "blur(10px)",
  },

  backgroundDetailBottom: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: "50%",
    background: "rgba(14, 165, 233, 0.10)",
    filter: "blur(10px)",
  },

  wrapper: {
    maxWidth: 980,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
    marginBottom: 24,
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
    fontSize: 34,
    lineHeight: 1.15,
    color: "#0f172a",
    fontWeight: 800,
  },

  subtitle: {
    marginTop: 12,
    marginBottom: 0,
    maxWidth: 700,
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.7,
  },

  topbarActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: 24,
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
    padding: 28,
  },

  cardHeader: {
    marginBottom: 22,
    borderBottom: "1px solid #e5eefb",
    paddingBottom: 18,
  },

  cardTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a",
    fontWeight: 700,
  },

  cardText: {
    marginTop: 8,
    marginBottom: 0,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },

  successBox: {
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
    color: "#155e75",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 1.6,
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 1.6,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },

  input: {
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  select: {
    height: 48,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  textarea: {
    minHeight: 150,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "14px",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    background: "#ffffff",
    color: "#0f172a",
  },

  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 16,
    padding: "14px 16px",
    color: "#1e40af",
    fontSize: 14,
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 6,
  },

  primaryButton: {
    height: 46,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    color: "#ffffff",
    padding: "0 22px",
    fontSize: 14,
    fontWeight: 700,
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.20)",
  },

  primaryButtonLink: {
    height: 46,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    color: "#ffffff",
    padding: "0 22px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.20)",
  },

  secondaryButton: {
    height: 46,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    background: "#ffffff",
    color: "#1d4ed8",
    padding: "0 20px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid #bfdbfe",
  },
};