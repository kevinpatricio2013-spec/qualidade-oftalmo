"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  "Farmácia/OPME",
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

const tiposOcorrencia = [
  "Não conformidade",
  "Evento adverso",
  "Ocorrência operacional",
  "Ocorrência documental",
  "Evento assistencial",
  "Reclamação",
  "Sugestão de melhoria",
];

const gravidades = ["Leve", "Moderada", "Grave", "Sentinela"];

export default function NovaOcorrenciaPage() {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    setorOrigem: "",
    setorDestino: "",
    tipo: "",
    gravidade: "",
    dataOcorrencia: "",
    localOcorrencia: "",
    acaoImediata: "",
  });

  const camposObrigatoriosPreenchidos = useMemo(() => {
    return (
      form.titulo.trim() !== "" &&
      form.descricao.trim() !== "" &&
      form.setorOrigem.trim() !== "" &&
      form.setorDestino.trim() !== "" &&
      form.tipo.trim() !== "" &&
      form.gravidade.trim() !== "" &&
      form.dataOcorrencia.trim() !== ""
    );
  }, [form]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log("Nova ocorrência:", form);
    alert("Ocorrência registrada com sucesso. Depois conectamos ao Supabase.");
  }

  return (
    <main className="page-shell">
      <div className="container-app">
        <div className="topbar-app">
          <div className="title-block">
            <h1>Nova ocorrência</h1>
            <p>
              Registro padronizado para abertura de ocorrência, não conformidade
              ou evento, com dados essenciais para análise e direcionamento.
            </p>
          </div>

          <div className="action-row">
            <Link href="/">
              <button className="btn-app btn-outline">Página inicial</button>
            </Link>

            <Link href="/sistema">
              <button className="btn-app btn-secondary">Voltar ao sistema</button>
            </Link>

            <Link href="/dashboard">
              <button className="btn-app btn-outline">Dashboard</button>
            </Link>
          </div>
        </div>

        <section className="grid-app grid-3">
          <div className="kpi-card">
            <div className="kpi-label">Formulário institucional</div>
            <div className="kpi-value">Padrão</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Campos obrigatórios</div>
            <div className="kpi-value">7</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Status inicial</div>
            <div className="kpi-value">Aberta</div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="section-space">
          <section className="card-app">
            <h2 className="card-title">Dados principais</h2>
            <p className="card-subtitle">
              Informações iniciais para identificação, classificação e análise da ocorrência.
            </p>

            <div className="grid-app grid-2">
              <div className="field-group">
                <label className="label-app" htmlFor="titulo">
                  Título da ocorrência
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  className="input-app"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ex.: Falha na identificação de material esterilizado"
                />
              </div>

              <div className="field-group">
                <label className="label-app" htmlFor="dataOcorrencia">
                  Data da ocorrência
                </label>
                <input
                  id="dataOcorrencia"
                  name="dataOcorrencia"
                  type="date"
                  className="input-app"
                  value={form.dataOcorrencia}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label className="label-app" htmlFor="setorOrigem">
                  Setor de origem
                </label>
                <select
                  id="setorOrigem"
                  name="setorOrigem"
                  className="select-app"
                  value={form.setorOrigem}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="label-app" htmlFor="setorDestino">
                  Setor de destino
                </label>
                <select
                  id="setorDestino"
                  name="setorDestino"
                  className="select-app"
                  value={form.setorDestino}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="label-app" htmlFor="tipo">
                  Tipo de ocorrência
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  className="select-app"
                  value={form.tipo}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {tiposOcorrencia.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="label-app" htmlFor="gravidade">
                  Gravidade
                </label>
                <select
                  id="gravidade"
                  name="gravidade"
                  className="select-app"
                  value={form.gravidade}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {gravidades.map((gravidade) => (
                    <option key={gravidade} value={gravidade}>
                      {gravidade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                <label className="label-app" htmlFor="localOcorrencia">
                  Local da ocorrência
                </label>
                <input
                  id="localOcorrencia"
                  name="localOcorrencia"
                  className="input-app"
                  value={form.localOcorrencia}
                  onChange={handleChange}
                  placeholder="Ex.: Sala 2, CME, Recepção, Consultório 4"
                />
              </div>

              <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                <label className="label-app" htmlFor="descricao">
                  Descrição detalhada
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  className="textarea-app"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Descreva de forma objetiva o que aconteceu, contexto, impacto e detalhes relevantes."
                />
              </div>

              <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                <label className="label-app" htmlFor="acaoImediata">
                  Ação imediata adotada
                </label>
                <textarea
                  id="acaoImediata"
                  name="acaoImediata"
                  className="textarea-app"
                  value={form.acaoImediata}
                  onChange={handleChange}
                  placeholder="Informe a contenção imediata realizada, quando aplicável."
                />
              </div>
            </div>
          </section>

          <section className="section-space grid-app grid-2">
            <div className="card-app">
              <h2 className="card-title">Orientações de preenchimento</h2>
              <p className="card-subtitle">
                Boas práticas para manter o registro institucional claro e útil.
              </p>

              <div className="grid-app">
                <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                  <strong>1. Seja objetivo</strong>
                  <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
                    Registre o fato de forma clara, sem excesso de texto.
                  </p>
                </div>

                <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                  <strong>2. Informe setor e destino corretamente</strong>
                  <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
                    Isso ajuda a Qualidade a direcionar e acompanhar o fluxo.
                  </p>
                </div>

                <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                  <strong>3. Descreva impacto e ação imediata</strong>
                  <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
                    Essas informações são importantes para análise e tratativa.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-app">
              <h2 className="card-title">Ações do formulário</h2>
              <p className="card-subtitle">
                Finalize o registro ou retorne para os módulos principais.
              </p>

              <div className="grid-app">
                <button
                  type="submit"
                  className="btn-app btn-primary"
                  style={{ width: "100%" }}
                  disabled={!camposObrigatoriosPreenchidos}
                >
                  Salvar ocorrência
                </button>

                <Link href="/sistema">
                  <button type="button" className="btn-app btn-secondary" style={{ width: "100%" }}>
                    Voltar ao sistema
                  </button>
                </Link>

                <Link href="/">
                  <button type="button" className="btn-app btn-outline" style={{ width: "100%" }}>
                    Página inicial
                  </button>
                </Link>
              </div>

              <div style={{ marginTop: 16 }}>
                <span
                  className={
                    camposObrigatoriosPreenchidos
                      ? "badge-app badge-done"
                      : "badge-app badge-progress"
                  }
                >
                  {camposObrigatoriosPreenchidos
                    ? "Formulário apto para envio"
                    : "Preencha os campos obrigatórios"}
                </span>
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}