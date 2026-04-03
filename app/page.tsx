"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    verificarSessao();
  }, []);

  async function verificarSessao() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.replace("/dashboard");
    }
  }

  async function handleEntrar() {
    setErro("");

    if (!email.trim()) {
      setErro("Informe o e-mail.");
      return;
    }

    if (!senha.trim()) {
      setErro("Informe a senha.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro("Não foi possível entrar: " + error.message);
      setCarregando(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.15fr 0.85fr",
        background:
          "linear-gradient(135deg, #edf6f2 0%, #f8fcfa 45%, #eef7f3 100%)",
      }}
    >
      <section
        style={{
          padding: "56px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #d8ebe2",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 16px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #d9ece4",
              color: "#2f6857",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 28,
            }}
          >
            Plataforma Hospitalar
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 42,
              lineHeight: 1.1,
              color: "#14352b",
              maxWidth: 620,
            }}
          >
            Sistema de Gestão da Qualidade
          </h1>

          <p
            style={{
              marginTop: 18,
              fontSize: 18,
              lineHeight: 1.7,
              color: "#4a6d61",
              maxWidth: 700,
            }}
          >
            Ambiente profissional para registro, análise, direcionamento,
            tratativa e validação de ocorrências com fluxo automatizado,
            histórico estruturado e controle por perfil de acesso.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 40,
          }}
        >
          <InfoCard
            titulo="Qualidade"
            texto="Gestão central das ocorrências, análise técnica, direcionamento e validação."
          />
          <InfoCard
            titulo="Liderança"
            texto="Recebimento das demandas do setor, tratativa e devolutiva estruturada."
          />
          <InfoCard
            titulo="Diretoria"
            texto="Acompanhamento executivo dos indicadores e da evolução institucional."
          />
        </div>
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#ffffff",
            border: "1px solid #dcefe6",
            borderRadius: 28,
            padding: 32,
            boxShadow: "0 20px 60px rgba(27, 74, 58, 0.10)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 28,
                color: "#17372d",
              }}
            >
              Acesso ao sistema
            </h2>
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#5a7a6f",
                lineHeight: 1.6,
              }}
            >
              Entre com o e-mail e a senha cadastrados no Supabase Auth.
            </p>
          </div>

          {erro && (
            <div
              style={{
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 14,
                background: "#fff4f4",
                border: "1px solid #f0d0d0",
                color: "#8c2f2f",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {erro}
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex.: qualidade@hospital.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Informe sua senha"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleEntrar}
              disabled={carregando}
              style={buttonPrimary}
            >
              {carregando ? "Entrando..." : "Entrar no sistema"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dcefe6",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 8px 24px rgba(25, 70, 56, 0.05)",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 10,
          color: "#1d493c",
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#587467",
          lineHeight: 1.7,
        }}
      >
        {texto}
      </div>
    </div>
  );
}

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
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #cfe3d9",
  background: "#fbfefd",
  fontSize: 15,
  color: "#17372d",
  outline: "none",
};

const buttonPrimary: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 16,
  padding: "15px 18px",
  background: "linear-gradient(135deg, #4f9a7a 0%, #2f7a60 100%)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(53, 122, 97, 0.22)",
};