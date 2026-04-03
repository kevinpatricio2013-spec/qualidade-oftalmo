"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

type StatusType =
  | "Aberta"
  | "Em análise"
  | "Em tratativa"
  | "Aguardando retorno"
  | "Concluída"
  | "Cancelada";

function getBadgeClass(status: StatusType) {
  switch (status) {
    case "Aberta":
      return "badge-app badge-open";
    case "Em análise":
    case "Em tratativa":
    case "Aguardando retorno":
      return "badge-app badge-progress";
    case "Concluída":
      return "badge-app badge-done";
    case "Cancelada":
      return "badge-app badge-cancel";
    default:
      return "badge-app badge-open";
  }
}

export default function DetalheOcorrenciaPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const ocorrencia = {
    id,
    titulo: "Falha na identificação de material esterilizado",
    status: "Em análise" as StatusType,
    tipo: "Não conformidade",
    gravidade: "Grave",
    dataOcorrencia: "02/04/2026",
    setorOrigem: "CME",
    setorDestino: "Qualidade",
    local: "Área de preparo",
    descricao:
      "Durante a conferência do material processado, foi identificada inconsistência na rotulagem do item esterilizado, com risco de comprometimento da rastreabilidade.",
    acaoImediata:
      "Material segregado, conferência refeita e equipe acionada para revisão imediata do lote envolvido.",
    causaRaiz:
      "Falha no processo de conferência final antes da liberação do material.",
    responsavel: "Qualidade / Liderança CME",
  };

  const historico = [
    {
      data: "02/04/2026 - 08:12",
      etapa: "Registro",
      descricao: "Ocorrência aberta no sistema.",
    },
    {
      data: "02/04/2026 - 08:35",
      etapa: "Triagem da Qualidade",
      descricao: "Ocorrência classificada como não conformidade grave.",
    },
    {
      data: "02/04/2026 - 09:10",
      etapa: "Direcionamento",
      descricao: "Encaminhada para liderança do setor CME.",
    },
  ];

  const tratativas = [
    {
      titulo: "Ação imediata",
      descricao:
        "Separação do material e bloqueio temporário da liberação do lote até rechecagem completa.",
    },
    {
      titulo: "Investigação",
      descricao:
        "Levantamento do fluxo, checagem da rotulagem, revisão do preenchimento e análise do ponto de falha.",
    },
    {
      titulo: "Plano corretivo",
      descricao:
        "Reforço do checklist final, dupla conferência e orientação da equipe responsável.",
    },
  ];

  const plano5W2H = [
    { item: "What", valor: "Reforçar a conferência final do material esterilizado." },
    { item: "Why", valor: "Reduzir risco de falha de rastreabilidade e liberação inadequada." },
    { item: "Where", valor: "CME." },
    { item: "When", valor: "Imediato." },
    { item: "Who", valor: "Liderança CME e Qualidade." },
    { item: "How", valor: "Implantação de dupla conferência e revisão de rotina." },
    { item: "How much", valor: "Sem custo adicional relevante inicial." },
  ];

  return (
    <main className="page-shell">
      <div className="container-app">
        <div className="topbar-app">
          <div className="title-block">
            <h1>Detalhe da ocorrência #{ocorrencia.id}</h1>
            <p>
              Acompanhamento completo da ocorrência, incluindo dados principais,
              histórico, tratativas e plano de ação.
            </p>
          </div>

          <div className="action-row">
            <Link href="/sistema">
              <button className="btn-app btn-secondary">Voltar ao sistema</button>
            </Link>

            <Link href="/dashboard">
              <button className="btn-app btn-outline">Dashboard</button>
            </Link>

            <Link href="/ocorrencia/nova">
              <button className="btn-app btn-primary">Nova ocorrência</button>
            </Link>
          </div>
        </div>

        <section className="grid-app grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Status</div>
            <div style={{ marginTop: 8 }}>
              <span className={getBadgeClass(ocorrencia.status)}>
                {ocorrencia.status}
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Tipo</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {ocorrencia.tipo}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Gravidade</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {ocorrencia.gravidade}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Data</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {ocorrencia.dataOcorrencia}
            </div>
          </div>
        </section>

        <section className="section-space grid-app grid-2">
          <div className="card-app">
            <h2 className="card-title">Dados principais</h2>
            <p className="card-subtitle">
              Informações institucionais da ocorrência registrada.
            </p>

            <div className="grid-app">
              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Título</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>{ocorrencia.titulo}</p>
              </div>

              <div className="grid-app grid-2">
                <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                  <strong>Setor de origem</strong>
                  <p style={{ margin: "8px 0 0", color: "#374151" }}>
                    {ocorrencia.setorOrigem}
                  </p>
                </div>

                <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                  <strong>Setor de destino</strong>
                  <p style={{ margin: "8px 0 0", color: "#374151" }}>
                    {ocorrencia.setorDestino}
                  </p>
                </div>
              </div>

              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Local</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>{ocorrencia.local}</p>
              </div>

              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Descrição</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>
                  {ocorrencia.descricao}
                </p>
              </div>

              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Responsável atual</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>
                  {ocorrencia.responsavel}
                </p>
              </div>
            </div>
          </div>

          <div className="card-app">
            <h2 className="card-title">Análise inicial</h2>
            <p className="card-subtitle">
              Dados iniciais da contenção e da investigação do caso.
            </p>

            <div className="grid-app">
              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Ação imediata</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>
                  {ocorrencia.acaoImediata}
                </p>
              </div>

              <div className="card-app" style={{ padding: 16, background: "#fbfefd" }}>
                <strong>Causa raiz</strong>
                <p style={{ margin: "8px 0 0", color: "#374151" }}>
                  {ocorrencia.causaRaiz}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-space grid-app grid-2">
          <div className="card-app">
            <h2 className="card-title">Histórico da ocorrência</h2>
            <p className="card-subtitle">
              Registro cronológico das principais movimentações do fluxo.
            </p>

            <div className="grid-app">
              {historico.map((item, index) => (
                <div
                  key={`${item.data}-${index}`}
                  className="card-app"
                  style={{ padding: 16, background: "#fbfefd" }}
                >
                  <strong>{item.etapa}</strong>
                  <p style={{ margin: "8px 0 0 4px", color: "#6b7280", fontSize: 13 }}>
                    {item.data}
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#374151" }}>{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-app">
            <h2 className="card-title">Tratativas</h2>
            <p className="card-subtitle">
              Consolidação das ações adotadas na condução do caso.
            </p>

            <div className="grid-app">
              {tratativas.map((item, index) => (
                <div
                  key={`${item.titulo}-${index}`}
                  className="card-app"
                  style={{ padding: 16, background: "#fbfefd" }}
                >
                  <strong>{item.titulo}</strong>
                  <p style={{ margin: "8px 0 0", color: "#374151" }}>{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space card-app">
          <h2 className="card-title">Plano de ação 5W2H</h2>
          <p className="card-subtitle">
            Estrutura básica para organização do plano corretivo.
          </p>

          <div className="table-wrap">
            <table className="table-app" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Definição</th>
                </tr>
              </thead>
              <tbody>
                {plano5W2H.map((item) => (
                  <tr key={item.item}>
                    <td style={{ fontWeight: 700 }}>{item.item}</td>
                    <td>{item.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-space grid-app grid-3">
          <Link href="/sistema">
            <button className="btn-app btn-secondary" style={{ width: "100%" }}>
              Voltar ao sistema
            </button>
          </Link>

          <Link href="/dashboard">
            <button className="btn-app btn-outline" style={{ width: "100%" }}>
              Acessar dashboard
            </button>
          </Link>

          <Link href="/ocorrencia/nova">
            <button className="btn-app btn-primary" style={{ width: "100%" }}>
              Registrar nova ocorrência
            </button>
          </Link>
        </section>
      </div>
    </main>
  );
}