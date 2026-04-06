"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../../src/lib/supabase";

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

const TIPOS_OCORRENCIA = [
  "Não conformidade",
  "Incidente",
  "Evento adverso",
  "Falha de processo",
  "Oportunidade de melhoria",
  "Reclamação",
  "Desvio assistencial",
  "Desvio administrativo",
];

const GRAVIDADES = ["Baixa", "Média", "Alta"];

export default function NovaOcorrenciaPage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setorOrigem, setSetorOrigem] = useState("");
  const [gravidade, setGravidade] = useState("");
  const [tipoOcorrencia, setTipoOcorrencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");

    if (!titulo || !descricao || !setorOrigem || !gravidade || !tipoOcorrencia) {
      setMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    setEnviando(true);

    try {
      const { error } = await supabase.from("ocorrencias").insert([
        {
          titulo,
          descricao,
          setor_origem: setorOrigem,
          gravidade,
          tipo_ocorrencia: tipoOcorrencia,
        },
      ]);

      if (error) {
        console.error("Erro ao criar ocorrência:", error);
        setMensagem(`Erro ao criar ocorrência: ${error.message}`);
        setEnviando(false);
        return;
      }

      setTitulo("");
      setDescricao("");
      setSetorOrigem("");
      setGravidade("");
      setTipoOcorrencia("");
      setMensagem("Ocorrência registrada com sucesso.");
    } catch (error) {
      console.error("Erro inesperado:", error);
      setMensagem("Erro inesperado ao registrar a ocorrência.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f9ff]">
      <div className="mx-auto w-full max-w-[1350px] px-6 py-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#dff1ff] to-[#eef8ff] text-3xl shadow-sm">
              📝
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ea4c8]">
                Registro público
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#10375c] sm:text-3xl">
                Nova ocorrência
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
            >
              Voltar para início
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-[#d8e9fb] bg-[#f7fbff] px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-white"
            >
              Entrar no sistema
            </Link>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.85fr]">
          <section className="rounded-[32px] border border-[#dcecff] bg-gradient-to-r from-[#ecf7ff] via-[#f7fbff] to-white p-6 shadow-[0_24px_80px_rgba(59,130,246,0.10)] lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7ea6ca]">
              Abertura da ocorrência
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#10375c] sm:text-4xl">
              Registro inicial para análise da Qualidade
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e7d9b] sm:text-base">
              Utilize este formulário para registrar uma ocorrência no sistema.
              O direcionamento do setor responsável será realizado depois pela
              equipe da Qualidade, conforme o fluxo institucional definido.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#e4effa] bg-white p-5 shadow-sm">
                <p className="text-2xl">🔎</p>
                <h3 className="mt-3 text-base font-bold text-[#12385f]">
                  Análise pela Qualidade
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                  Toda ocorrência entra primeiro na etapa de avaliação técnica.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#e4effa] bg-white p-5 shadow-sm">
                <p className="text-2xl">➡️</p>
                <h3 className="mt-3 text-base font-bold text-[#12385f]">
                  Direcionamento correto
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                  O colaborador não precisa escolher o setor responsável.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#e4effa] bg-white p-5 shadow-sm">
                <p className="text-2xl">✅</p>
                <h3 className="mt-3 text-base font-bold text-[#12385f]">
                  Fluxo controlado
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                  A liderança trata e a Qualidade valida antes do encerramento.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
              Orientação de preenchimento
            </p>

            <div className="mt-5 space-y-4">
              {[
                "Descreva a ocorrência com clareza e objetividade.",
                "Informe o setor de origem correto.",
                "Selecione a gravidade conforme impacto percebido.",
                "Escolha o tipo de ocorrência mais adequado.",
                "O setor responsável será definido pela Qualidade.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-2xl border border-[#edf5fb] bg-[#fbfdff] p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5f4ff] text-sm font-bold text-[#0f5d99]">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#4f6f8f]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-[32px] border border-[#deecfb] bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
              Formulário
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#12385f]">
              Informações da ocorrência
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                  Título da ocorrência
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: atraso no preparo de sala"
                  className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                  Setor de origem
                </label>
                <select
                  value={setorOrigem}
                  onChange={(e) => setSetorOrigem(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
                >
                  <option value="">Selecione o setor</option>
                  {SETORES.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                Descrição da ocorrência
              </label>
              <textarea
                rows={7}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o ocorrido com o máximo de clareza possível."
                className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm leading-7 text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                  Gravidade
                </label>
                <select
                  value={gravidade}
                  onChange={(e) => setGravidade(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
                >
                  <option value="">Selecione a gravidade</option>
                  {GRAVIDADES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#32597d]">
                  Tipo de ocorrência
                </label>
                <select
                  value={tipoOcorrencia}
                  onChange={(e) => setTipoOcorrencia(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8e9fb] bg-[#fbfdff] px-4 py-3 text-sm text-[#16324f] outline-none transition focus:border-[#8fc8f7] focus:bg-white"
                >
                  <option value="">Selecione o tipo</option>
                  {TIPOS_OCORRENCIA.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {mensagem && (
              <div className="rounded-2xl border border-[#d8e9fb] bg-[#f7fbff] px-4 py-3 text-sm font-medium text-[#32597d]">
                {mensagem}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={enviando}
                className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Registrar ocorrência"}
              </button>

              <Link
                href="/"
                className="rounded-2xl border border-[#d8e9fb] bg-white px-6 py-3.5 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}