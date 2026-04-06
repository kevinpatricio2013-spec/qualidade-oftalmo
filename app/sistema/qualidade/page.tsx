"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../src/lib/supabase";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  setor: string | null;
};

type Ocorrencia = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  setor_origem: string | null;
  setor_responsavel: string | null;
  gravidade: string | null;
  tipo_ocorrencia: string | null;
  status: string | null;
  resposta_lideranca: string | null;
  data_resposta_lideranca: string | null;
  validado_qualidade: boolean | null;
  data_validacao_qualidade: string | null;
  observacao_qualidade: string | null;
  encaminhado_por_qualidade: string | null;
  created_at: string | null;
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

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "Em análise pela Qualidade":
      return "bg-[#fff4d9] text-[#996b00]";
    case "Direcionada para Liderança":
      return "bg-[#e8f4ff] text-[#0f5d99]";
    case "Em tratativa pela Liderança":
      return "bg-[#e7faff] text-[#0077a8]";
    case "Aguardando validação da Qualidade":
      return "bg-[#efe9ff] text-[#6d4bb6]";
    case "Encerrada":
      return "bg-[#e8f8ef] text-[#1c7c4d]";
    default:
      return "bg-[#eef5fb] text-[#5a7590]";
  }
}

function getGravidadeClass(gravidade?: string | null) {
  switch ((gravidade || "").toLowerCase()) {
    case "alta":
    case "grave":
      return "bg-[#ffe7e7] text-[#b42318]";
    case "média":
    case "media":
      return "bg-[#fff4d9] text-[#996b00]";
    case "baixa":
      return "bg-[#e8f8ef] text-[#1c7c4d]";
    default:
      return "bg-[#eef5fb] text-[#5a7590]";
  }
}

export default function SistemaQualidadePage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [direcionamentos, setDirecionamentos] = useState<Record<string, string>>(
    {}
  );
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  async function carregarDados() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, nome, email, role, setor")
        .eq("id", user.id)
        .single();

      setProfile((profileData as Profile) ?? null);

      const { data, error } = await supabase
        .from("ocorrencias")
        .select(
          `
          id,
          titulo,
          descricao,
          setor_origem,
          setor_responsavel,
          gravidade,
          tipo_ocorrencia,
          status,
          resposta_lideranca,
          data_resposta_lideranca,
          validado_qualidade,
          data_validacao_qualidade,
          observacao_qualidade,
          encaminhado_por_qualidade,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar ocorrências:", error);
        return;
      }

      const lista = (data ?? []) as Ocorrencia[];
      setOcorrencias(lista);

      const mapaDirecionamentos: Record<string, string> = {};
      const mapaObservacoes: Record<string, string> = {};

      lista.forEach((item) => {
        mapaDirecionamentos[item.id] = item.setor_responsavel ?? "";
        mapaObservacoes[item.id] = item.observacao_qualidade ?? "";
      });

      setDirecionamentos(mapaDirecionamentos);
      setObservacoes(mapaObservacoes);
    } catch (error) {
      console.error("Erro inesperado ao carregar área da Qualidade:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      emAnalise: ocorrencias.filter(
        (item) => item.status === "Em análise pela Qualidade"
      ).length,
      direcionadas: ocorrencias.filter(
        (item) => item.status === "Direcionada para Liderança"
      ).length,
      aguardandoValidacao: ocorrencias.filter(
        (item) => item.status === "Aguardando validação da Qualidade"
      ).length,
      encerradas: ocorrencias.filter((item) => item.status === "Encerrada")
        .length,
    };
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = `${item.titulo ?? ""} ${item.descricao ?? ""} ${
        item.setor_origem ?? ""
      } ${item.tipo_ocorrencia ?? ""}`.toLowerCase();

      const passouBusca = busca.trim()
        ? texto.includes(busca.trim().toLowerCase())
        : true;

      const passouStatus =
        filtroStatus === "todos" ? true : item.status === filtroStatus;

      return passouBusca && passouStatus;
    });
  }, [ocorrencias, busca, filtroStatus]);

  async function handleSalvarObservacao(ocorrencia: Ocorrencia) {
    setSavingId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          observacao_qualidade: observacoes[ocorrencia.id] ?? null,
        })
        .eq("id", ocorrencia.id);

      if (error) {
        console.error("Erro ao salvar observação:", error);
        return;
      }

      await carregarDados();
      alert("Observação da Qualidade salva com sucesso.");
    } catch (error) {
      console.error("Erro inesperado ao salvar observação:", error);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDirecionar(ocorrencia: Ocorrencia) {
    const setor = direcionamentos[ocorrencia.id];

    if (!setor) {
      alert("Selecione o setor responsável antes de direcionar.");
      return;
    }

    setSavingId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          setor_responsavel: setor,
          observacao_qualidade: observacoes[ocorrencia.id] ?? null,
          encaminhado_por_qualidade:
            profile?.nome || profile?.email || "Qualidade",
        })
        .eq("id", ocorrencia.id);

      if (error) {
        console.error("Erro ao direcionar ocorrência:", error);
        return;
      }

      await carregarDados();
      alert("Ocorrência direcionada com sucesso.");
    } catch (error) {
      console.error("Erro inesperado ao direcionar ocorrência:", error);
    } finally {
      setSavingId(null);
    }
  }

  async function handleValidarEncerrar(ocorrencia: Ocorrencia) {
    setSavingId(ocorrencia.id);

    try {
      const { error } = await supabase
        .from("ocorrencias")
        .update({
          validado_qualidade: true,
          data_validacao_qualidade: new Date().toISOString(),
          observacao_qualidade: observacoes[ocorrencia.id] ?? null,
        })
        .eq("id", ocorrencia.id);

      if (error) {
        console.error("Erro ao validar ocorrência:", error);
        return;
      }

      await carregarDados();
      alert("Ocorrência validada e encerrada com sucesso.");
    } catch (error) {
      console.error("Erro inesperado ao validar ocorrência:", error);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[#dcecff] bg-gradient-to-r from-[#ecf7ff] via-[#f7fbff] to-white p-6 shadow-[0_24px_80px_rgba(59,130,246,0.10)] lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ea6ca]">
              Área da Qualidade
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#10375c] sm:text-4xl">
              Análise, direcionamento, validação e encerramento
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e7d9b] sm:text-base">
              Nesta tela, a Qualidade acompanha todas as ocorrências,
              direciona o setor responsável, recebe a devolutiva da liderança,
              realiza a validação final e encerra o fluxo operacional.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sistema"
                className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
              >
                Voltar para o sistema
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
              >
                Nova ocorrência
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[28px] border border-[#e3f0fb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                Responsável logado
              </p>

              <h2 className="mt-3 text-xl font-bold text-[#12385f]">
                {profile?.nome || "Usuário da Qualidade"}
              </h2>

              <p className="mt-1 text-sm text-[#6482a0]">
                {profile?.email || "Sem e-mail"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {profile?.role && (
                  <span className="rounded-full bg-[#dff1ff] px-3 py-1 text-xs font-semibold text-[#0f5d99]">
                    {(profile.role || "").toUpperCase()}
                  </span>
                )}
                {profile?.setor && (
                  <span className="rounded-full bg-[#edf6ff] px-3 py-1 text-xs font-semibold text-[#587493]">
                    {profile.setor}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e3f0fb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                Diretriz do fluxo
              </p>

              <div className="mt-4 space-y-3 text-sm leading-6 text-[#5d7b99]">
                <p>A Qualidade é a única responsável pelo direcionamento.</p>
                <p>A liderança apenas trata e devolve para validação.</p>
                <p>O encerramento fica na etapa final da Qualidade.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Total</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.total}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em análise</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.emAnalise}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Direcionadas</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.direcionadas}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Aguardando validação</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.aguardandoValidacao}
          </h2>
        </div>

        <div className="rounded-[28px] border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Encerradas</p>
          <h2 className="mt-3 text-3xl font-bold text-[#12385f]">
            {indicadores.encerradas}
          </h2>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#32597d]">
              Buscar ocorrência
            </label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por título, descrição, setor ou tipo..."
              className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#32597d]">
              Filtrar por status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
            >
              <option value="todos">Todos</option>
              <option value="Em análise pela Qualidade">
                Em análise pela Qualidade
              </option>
              <option value="Direcionada para Liderança">
                Direcionada para Liderança
              </option>
              <option value="Em tratativa pela Liderança">
                Em tratativa pela Liderança
              </option>
              <option value="Aguardando validação da Qualidade">
                Aguardando validação da Qualidade
              </option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm"
            >
              <div className="h-6 w-56 animate-pulse rounded bg-[#e7f1fb]" />
              <div className="mt-4 h-4 w-80 animate-pulse rounded bg-[#eef5fb]" />
              <div className="mt-6 h-28 rounded-3xl bg-[#f8fbff]" />
            </div>
          ))
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
              ✅
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
              Nenhuma ocorrência encontrada
            </h3>
            <p className="mt-2 text-sm text-[#6482a0]">
              Ajuste os filtros ou aguarde novos registros no sistema.
            </p>
          </div>
        ) : (
          ocorrenciasFiltradas.map((item) => {
            const podeDirecionar =
              item.status === "Em análise pela Qualidade" ||
              !item.setor_responsavel;

            const podeValidar =
              item.status === "Aguardando validação da Qualidade" ||
              (!!item.resposta_lideranca && !item.validado_qualidade);

            return (
              <article
                key={item.id}
                className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-[#12385f]">
                        {item.titulo || "Ocorrência sem título"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Sem status"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getGravidadeClass(
                          item.gravidade
                        )}`}
                      >
                        {item.gravidade || "Gravidade não informada"}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[#5f7f9d]">
                      {item.descricao || "Sem descrição informada."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.setor_origem && (
                        <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#4d7294]">
                          Origem: {item.setor_origem}
                        </span>
                      )}
                      {item.setor_responsavel && (
                        <span className="rounded-full bg-[#eef7ff] px-3 py-1 text-xs font-semibold text-[#4d7294]">
                          Responsável: {item.setor_responsavel}
                        </span>
                      )}
                      {item.tipo_ocorrencia && (
                        <span className="rounded-full bg-[#f7fbff] px-3 py-1 text-xs font-semibold text-[#597692]">
                          Tipo: {item.tipo_ocorrencia}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-[#6785a2] xl:min-w-[230px] xl:text-right">
                    <p>
                      <strong className="text-[#32597d]">Abertura:</strong>{" "}
                      {formatarDataHora(item.created_at)}
                    </p>
                    <p>
                      <strong className="text-[#32597d]">Resposta liderança:</strong>{" "}
                      {item.data_resposta_lideranca
                        ? formatarDataHora(item.data_resposta_lideranca)
                        : "-"}
                    </p>
                    <p>
                      <strong className="text-[#32597d]">Validação:</strong>{" "}
                      {item.data_validacao_qualidade
                        ? formatarDataHora(item.data_validacao_qualidade)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-[#e6f2ff] bg-[#fbfdff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                      Direcionamento pela Qualidade
                    </p>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                        Setor responsável
                      </label>
                      <select
                        value={direcionamentos[item.id] ?? ""}
                        onChange={(e) =>
                          setDirecionamentos((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                      >
                        <option value="">Selecione o setor</option>
                        {SETORES.map((setor) => (
                          <option key={setor} value={setor}>
                            {setor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                        Observação da Qualidade
                      </label>
                      <textarea
                        rows={6}
                        value={observacoes[item.id] ?? ""}
                        onChange={(e) =>
                          setObservacoes((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Descreva a análise da Qualidade, critérios de avaliação e orientações para a liderança."
                        className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSalvarObservacao(item)}
                        disabled={savingId === item.id}
                        className="rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm font-semibold text-[#2d5f8b] transition hover:bg-[#f4faff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === item.id ? "Salvando..." : "Salvar observação"}
                      </button>

                      {podeDirecionar && (
                        <button
                          onClick={() => handleDirecionar(item)}
                          disabled={savingId === item.id}
                          className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === item.id
                            ? "Processando..."
                            : "Direcionar ocorrência"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#e6f2ff] bg-[#fbfdff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                      Retorno da liderança e validação final
                    </p>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#32597d]">
                          Resposta da liderança
                        </p>
                        <div className="min-h-[170px] rounded-2xl border border-[#d8e9fb] bg-white p-4 text-sm leading-7 text-[#5f7f9d]">
                          {item.resposta_lideranca ||
                            "Ainda sem resposta registrada pela liderança."}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#e7f1fb] bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#84a5c2]">
                            Encaminhado por
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#16324f]">
                            {item.encaminhado_por_qualidade || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#e7f1fb] bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#84a5c2]">
                            Validado
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#16324f]">
                            {item.validado_qualidade ? "Sim" : "Não"}
                          </p>
                        </div>
                      </div>

                      {podeValidar && (
                        <button
                          onClick={() => handleValidarEncerrar(item)}
                          disabled={savingId === item.id}
                          className="w-full rounded-2xl bg-[#10375c] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === item.id
                            ? "Validando..."
                            : "Validar e encerrar pela Qualidade"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}