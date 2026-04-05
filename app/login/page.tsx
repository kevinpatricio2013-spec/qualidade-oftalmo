"use client";

import { useState } from "react";
import { supabase } from "../src/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert("Erro ao fazer login");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#eaf4ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: 40,
          borderRadius: 12,
          width: 400,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 22, color: "#1e3a8a", marginBottom: 10 }}>
          Sistema de Gestão da Qualidade
        </h1>

        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 25 }}>
          Ambiente profissional para registro, análise, direcionamento,
          tratativa e validação de ocorrências
        </p>

        <form onSubmit={handleLogin}>
          <input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={input}
          />

          <button style={button} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 15,
  borderRadius: 8,
  border: "1px solid #d1d5db",
};

const button = {
  width: "100%",
  padding: 12,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};