"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase";

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
  observacao_qualidade: string | null;
  created_at: string | null;
};

type Plano5W2H = {
  oQue: string;
  porQue: string;
  onde: string;
  quando: string;
  quem: string;
  como: string;
  quantoCusta: string;
};

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

function texto5W2H(plano: Plano5W2H, tratativa: string) {
  return [
    "TRATATIVA DA LIDERANÇA",
    tratativa || "-",
    "",
    "PLANO 5W2H",
    `O que será feito: ${plano.oQue || "-"}`,
    `Por que será feito: ${plano.porQue || "-"}`,
    `Onde será feito: ${plano.onde || "-"}`,
    `Quando será feito: ${plano.quando || "-"}`,
    `Quem será responsável: ${plano.quem || "-"}`,
    `Como será feito: ${plano.como || "-"}`,
    `Quanto custa / recurso necessário: ${plano.quantoCusta || "-"}`,
  ].join("\n");
}

export default function SistemaLiderancaPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [busca, setBusca] = useState("");
  const [tratativas, setTratativas] = useState<Record<string, string>>({});
  const [planos, setPlanos] = useState<Record<string, Plano5W2H>>({});

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

      const perfil = profileData as Profile | null;
      setProfile(perfil);

      if (!perfil?.setor) {
        setOcorrencias([]);
        return;
      }

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
          observacao_qualidade,
          created_at
        `
        )
        .eq("setor_responsavel", perfil.setor)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar ocorrências da liderança:", error);
        alert(`Erro ao carregar ocorrências: ${error.message}`);
        return;
      }

      const lista = (data ?? []) as Ocorrencia[];
      setOcorrencias(lista);

      const mapaTratativas: Record<string, string> = {};
      const mapaPlanos: Record<string, Plano5W2H> = {};

      lista.forEach((item) => {
        mapaTratativas[item.id] = "";

        mapaPlanos[item.id] = {
          oQue: "",
          porQue: "",
          onde: item.setor_responsavel ?? perfil.setor ?? "",
          quando: "",
          quem: perfil.nome || perfil.email || "",
          como: "",
          quantoCusta: "",
        };
      });

      setTratativas(mapaTratativas);
      setPlanos(mapaPlanos);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao carregar a área da Liderança.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((item) => {
      const texto = `${item.titulo ?? ""} ${item.descricao ?? ""} ${item.tipo_ocorrencia ?? ""} ${item.setor_origem ?? ""}`
        .toLowerCase();

      return busca.trim()
        ? texto.includes(busca.trim().toLowerCase())
        : true;
    });
  }, [ocorrencias, busca]);

  const indicadores = useMemo(() => {
    return {
      total: ocorrencias.length,
      direcionadas: ocorrencias.filter(
        (item) => item.status === "Direcionada para Liderança"
      ).length,
      emTratativa: ocorrencias.filter(
        (item) => item.status === "Em tratativa pela Liderança"
      ).length,
      aguardandoValidacao: ocorrencias.filter(
        (item) => item.status === "Aguardando validação da Qualidade"
      ).length,
      encerradas: ocorrencias.filter((item) => item.status === "Encerrada")
        .length,
    };
  }, [ocorrencias]);

  function atualizarPlano(
    id: string,
    campo: keyof Plano5W2H,
    valor: string
  ) {
    setPlanos((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor,
      },
    }));
  }

  async function handleEnviarTratativa(item: Ocorrencia) {
    const tratativa = tratativas[item.id] ?? "";
    const plano = planos[item.id];

    if (!tratativa.trim()) {
      alert("Descreva a tratativa realizada pela liderança.");
      return;
    }

    setSavingId(item.id);

    try {
      const respostaFinal = texto5W2H(plano, tratativa);

      const { error } = await supabase
        .from("ocorrencias")
        .update({
          resposta_lideranca: respostaFinal,
          data_resposta_lideranca: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error("Erro ao enviar tratativa:", error);
        alert(`Erro ao enviar tratativa: ${error.message}`);
        return;
      }

      await carregarDados();
      alert("Tratativa e 5W2H enviados para validação da Qualidade.");
    } catch (error) {
      console.error(error);
      alert("Erro inesperado ao enviar tratativa.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-[#dcecff] bg-white p-6 shadow-sm">
          <div className="h-6 w-56 animate-pulse rounded bg-[#e7f1fb]" />
          <div className="mt-4 h-4 w-80 animate-pulse rounded bg-[#eef5fb]" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#dcecff] bg-gradient-to-r from-[#ecf7ff] via-[#f6fbff] to-white p-6 shadow-[0_20px_60px_rgba(25,118,210,0.10)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7ea6ca]">
              Área da Liderança
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#10375c] sm:text-3xl">
              Tratativa setorial com 5W2H integrado
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d7b99]">
              Nesta tela, a liderança visualiza apenas as ocorrências do seu setor,
              registra a tratativa realizada e devolve a ocorrência para a
              Qualidade validar. O redirecionamento não acontece aqui.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sistema"
              className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
            >
              Voltar para o sistema
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Setor do líder</p>
          <h2 className="mt-2 text-2xl font-bold text-[#12385f]">
            {profile?.setor || "-"}
          </h2>
        </div>
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Total</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">{indicadores.total}</h2>
        </div>
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Direcionadas</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.direcionadas}
          </h2>
        </div>
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Em tratativa</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.emTratativa}
          </h2>
        </div>
        <div className="rounded-3xl border border-[#deecfb] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#7a9bb9]">Aguardando validação</p>
          <h2 className="mt-2 text-3xl font-bold text-[#12385f]">
            {indicadores.aguardandoValidacao}
          </h2>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-[#32597d]">
          Buscar ocorrência do setor
        </label>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por título, descrição, setor de origem ou tipo..."
          className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
        />
      </section>

      {!profile?.setor ? (
        <div className="rounded-[28px] border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
            🩺
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
            Perfil sem setor vinculado
          </h3>
          <p className="mt-2 text-sm text-[#6482a0]">
            Para a liderança visualizar suas ocorrências, o perfil precisa ter o
            setor corretamente preenchido na tabela <strong>profiles</strong>.
          </p>
        </div>
      ) : ocorrenciasFiltradas.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#d8e9fb] bg-[#f9fcff] p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5ff] text-2xl">
            📋
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#12385f]">
            Nenhuma ocorrência para este setor
          </h3>
          <p className="mt-2 text-sm text-[#6482a0]">
            Quando a Qualidade direcionar ocorrências para <strong>{profile.setor}</strong>,
            elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <section className="space-y-5">
          {ocorrenciasFiltradas.map((item) => {
            const planoAtual = planos[item.id] || {
              oQue: "",
              porQue: "",
              onde: item.setor_responsavel ?? profile.setor ?? "",
              quando: "",
              quem: profile.nome || profile.email || "",
              como: "",
              quantoCusta: "",
            };

            return (
              <article
                key={item.id}
                className="rounded-[28px] border border-[#deecfb] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-[#12385f]">
                        {item.titulo || "Ocorrência sem título"}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Sem status"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#5f7f9d]">
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
                      {item.gravidade && (
                        <span className="rounded-full bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#5c6d92]">
                          Gravidade: {item.gravidade}
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
                      <strong className="text-[#32597d]">Resposta:</strong>{" "}
                      {item.data_resposta_lideranca
                        ? formatarDataHora(item.data_resposta_lideranca)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-[#e6f2ff] bg-[#fbfdff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                      Orientação da Qualidade
                    </p>

                    <div className="mt-4 min-h-[180px] rounded-2xl border border-[#d8e9fb] bg-white p-4 text-sm leading-6 text-[#5f7f9d]">
                      {item.observacao_qualidade || "Sem orientação registrada pela Qualidade."}
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                        Tratativa da liderança
                      </label>
                      <textarea
                        rows={7}
                        value={tratativas[item.id] ?? ""}
                        onChange={(e) =>
                          setTratativas((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Descreva o que foi analisado, o que foi corrigido, as ações executadas e o retorno do setor."
                        className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#e6f2ff] bg-[#fbfdff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                      Plano 5W2H integrado
                    </p>

                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                          O que será feito
                        </label>
                        <input
                          value={planoAtual.oQue}
                          onChange={(e) => atualizarPlano(item.id, "oQue", e.target.value)}
                          className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                          Por que será feito
                        </label>
                        <input
                          value={planoAtual.porQue}
                          onChange={(e) =>
                            atualizarPlano(item.id, "porQue", e.target.value)
                          }
                          className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                            Onde
                          </label>
                          <input
                            value={planoAtual.onde}
                            onChange={(e) =>
                              atualizarPlano(item.id, "onde", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                            Quando
                          </label>
                          <input
                            value={planoAtual.quando}
                            onChange={(e) =>
                              atualizarPlano(item.id, "quando", e.target.value)
                            }
                            placeholder="Prazo da ação"
                            className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                            Quem
                          </label>
                          <input
                            value={planoAtual.quem}
                            onChange={(e) =>
                              atualizarPlano(item.id, "quem", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                            Quanto custa / recurso
                          </label>
                          <input
                            value={planoAtual.quantoCusta}
                            onChange={(e) =>
                              atualizarPlano(item.id, "quantoCusta", e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                          Como será feito
                        </label>
                        <textarea
                          rows={4}
                          value={planoAtual.como}
                          onChange={(e) =>
                            atualizarPlano(item.id, "como", e.target.value)
                          }
                          className="w-full rounded-2xl border border-[#d8e9fb] bg-white px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7]"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => handleEnviarTratativa(item)}
                        disabled={savingId === item.id}
                        className="w-full rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,153,230,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === item.id
                          ? "Enviando..."
                          : "Enviar tratativa e devolver para a Qualidade"}
                      </button>
                    </div>
                  </div>
                </div>

                {item.resposta_lideranca && (
                  <div className="mt-6 rounded-3xl border border-[#e6f2ff] bg-[#f8fbff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87a7c5]">
                      Última resposta enviada
                    </p>
                    <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-[#5f7f9d]">
                      {item.resposta_lideranca}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}