"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Ocorrencia = {
  id: number;
  codigo?: string | null;
  titulo: string;
  descricao?: string | null;
  tipo_registro: string;
  tipo_ocorrencia?: string | null;
  setor_origem: string;
  setor_destino?: string | null;
  gravidade: string;
  status: string;
  created_at?: string | null;
};

const setores = [
  "agendamento",
  "autorização",
  "centro cirúrgico",
  "cme",
  "comissões hospitalares",
  "compras",
  "consultório médico",
  "contas médicas",
  "controlador de acesso",
  "diretoria",
  "engenharia clínica",
  "facilities",
  "farmácia/OPME",
  "faturamento",
  "financeiro",
  "fornecedores externos",
  "gestão da informação",
  "gestão de pessoas",
  "higiene",
  "pronto atendimento",
  "qualidade",
  "recepção",
];

const gravidades = ["leve", "moderada", "grave", "critica"];

const statusList = [
  "aberto",
  "em_analise",
  "aguardando_setor",
  "em_tratativa",
  "aguardando_validacao",
  "concluido",
  "fechado",
  "cancelado",
];

const tiposRegistro = [
  "ocorrencia",
  "nao_conformidade",
  "evento_adverso",
  "quase_erro",
  "oportunidade_melhoria",
];

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function corGravidade(gravidade: string) {
  switch (gravidade) {
    case "leve":
      return "#dcfce7";
    case "moderada":
      return "#fef3c7";
    case "grave":
      return "#fed7aa";
    case "critica":
      return "#fecaca";
    default:
      return "#e5e7eb";
  }
}

function corStatus(status: string) {
  switch (status) {
    case "aberto":
      return "#dbeafe";
    case "em_analise":
      return "#ede9fe";
    case "aguardando_setor":
      return "#fef3c7";
    case "em_tratativa":
      return "#fde68a";
    case "aguardando_validacao":
      return "#fed7aa";
    case "concluido":
      return "#dcfce7";
    case "fechado":
      return "#d1fae5";
    case "cancelado":
      return "#e5e7eb";
    default:
      return "#f3f4f6";
  }
}

export default function SistemaClient() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo_registro: "ocorrencia",
    tipo_ocorrencia: "",
    setor_origem: "",
    setor_destino: "",
    gravidade: "leve",
    status: "aberto",
  });

  async function carregarOcorrencias() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("ERRO AO CARREGAR:", error);
      setErro("Não foi possível carregar as ocorrências: " + error.message);
      setOcorrencias([]);
      setCarregando(false);
      return;
    }

    setOcorrencias((data as Ocorrencia[]) || []);
    setCarregando(false);
  }

  async function salvarOcorrencia() {
    if (!form.titulo.trim()) {
      alert("Preencha o título da ocorrência.");
      return;
    }

    if (!form.setor_origem) {
      alert("Selecione o setor de origem.");
      return;
    }

    setSalvando(true);
    setErro("");

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      tipo_registro: form.tipo_registro,
      tipo_ocorrencia: form.tipo_ocorrencia.trim() || null,
      setor_origem: form.setor_origem,
      setor_destino: form.setor_destino || null,
      gravidade: form.gravidade,
      status: form.status,
    };

    const { error } = await supabase.from("ocorrencias").insert([payload]);

    if (error) {
      console.error("ERRO AO SALVAR:", error);
      alert("Erro ao salvar ocorrência: " + error.message);
      setSalvando(false);
      return;
    }

    setForm({
      titulo: "",
      descricao: "",
      tipo_registro: "ocorrencia",
      tipo_ocorrencia: "",
      setor_origem: "",
      setor_destino: "",
      gravidade: "leve",
      status: "aberto",
    });

    await carregarOcorrencias();
    setSalvando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fb",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0f4c81, #2a6f97)",
            color: "#fff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 30 }}>
            Sistema de Qualidade Hospitalar
          </h1>
          <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.95 }}>
            Registro e acompanhamento de ocorrências, não conformidades e eventos
            adversos.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 20,
                color: "#0f172a",
                fontSize: 22,
              }}
            >
              Nova Ocorrência
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Digite o título da ocorrência"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Descrição
                </label>
                <textarea
                  placeholder="Descreva a ocorrência"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Tipo de Registro
                </label>
                <select
                  value={form.tipo_registro}
                  onChange={(e) =>
                    setForm({ ...form, tipo_registro: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  {tiposRegistro.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {formatarTexto(tipo)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Tipo da Ocorrência
                </label>
                <input
                  type="text"
                  placeholder="Ex.: processo, fluxo, assistência"
                  value={form.tipo_ocorrencia}
                  onChange={(e) =>
                    setForm({ ...form, tipo_ocorrencia: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Setor de Origem
                </label>
                <select
                  value={form.setor_origem}
                  onChange={(e) =>
                    setForm({ ...form, setor_origem: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  <option value="">Selecione o setor de origem</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {formatarTexto(setor)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Setor de Destino
                </label>
                <select
                  value={form.setor_destino}
                  onChange={(e) =>
                    setForm({ ...form, setor_destino: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  <option value="">Selecione o setor de destino</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {formatarTexto(setor)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Gravidade
                </label>
                <select
                  value={form.gravidade}
                  onChange={(e) => setForm({ ...form, gravidade: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  {gravidades.map((item) => (
                    <option key={item} value={item}>
                      {formatarTexto(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                  Status Inicial
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                  }}
                >
                  {statusList.map((item) => (
                    <option key={item} value={item}>
                      {formatarTexto(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                onClick={salvarOcorrencia}
                disabled={salvando}
                style={{
                  background: salvando ? "#94a3b8" : "#0f4c81",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 22px",
                  fontWeight: 700,
                  cursor: salvando ? "not-allowed" : "pointer",
                }}
              >
                {salvando ? "Salvando..." : "Salvar Ocorrência"}
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 22,
                }}
              >
                Lista de Ocorrências
              </h2>

              <button
                onClick={carregarOcorrencias}
                style={{
                  background: "#e2e8f0",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Atualizar Lista
              </button>
            </div>

            {carregando && <p>Carregando ocorrências...</p>}

            {!carregando && erro && (
              <p style={{ color: "#b91c1c", fontWeight: 700 }}>{erro}</p>
            )}

            {!carregando && !erro && ocorrencias.length === 0 && (
              <p>Nenhuma ocorrência cadastrada até o momento.</p>
            )}

            <div style={{ display: "grid", gap: 16 }}>
              {ocorrencias.map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 18,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          color: "#0f172a",
                          fontSize: 18,
                        }}
                      >
                        {ocorrencia.codigo ? `${ocorrencia.codigo} - ` : ""}
                        {ocorrencia.titulo}
                      </h3>

                      <p
                        style={{
                          marginTop: 8,
                          marginBottom: 0,
                          color: "#475569",
                        }}
                      >
                        {ocorrencia.descricao || "Sem descrição informada."}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: corGravidade(ocorrencia.gravidade),
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Gravidade: {formatarTexto(ocorrencia.gravidade)}
                      </span>

                      <span
                        style={{
                          background: corStatus(ocorrencia.status),
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Status: {formatarTexto(ocorrencia.status)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                      color: "#334155",
                      fontSize: 14,
                    }}
                  >
                    <div>
                      <strong>Tipo de Registro:</strong>{" "}
                      {formatarTexto(ocorrencia.tipo_registro)}
                    </div>

                    <div>
                      <strong>Tipo da Ocorrência:</strong>{" "}
                      {ocorrencia.tipo_ocorrencia || "-"}
                    </div>

                    <div>
                      <strong>Setor de Origem:</strong>{" "}
                      {formatarTexto(ocorrencia.setor_origem)}
                    </div>

                    <div>
                      <strong>Setor de Destino:</strong>{" "}
                      {ocorrencia.setor_destino
                        ? formatarTexto(ocorrencia.setor_destino)
                        : "-"}
                    </div>

                    <div>
                      <strong>ID:</strong> {ocorrencia.id}
                    </div>

                    <div>
                      <strong>Criado em:</strong>{" "}
                      {ocorrencia.created_at
                        ? new Date(ocorrencia.created_at).toLocaleString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}