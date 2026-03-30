"use client";

import Link from "next/link";

const modulos = [
  {
    titulo: "Registro e Tratativa",
    descricao:
      "Cadastro estruturado de ocorrências, não conformidades, eventos adversos e acompanhamento completo das tratativas.",
    href: "/sistema",
    destaque: "Fluxo com triagem pela Qualidade",
  },
  {
    titulo: "Painel da Qualidade",
    descricao:
      "Visualização central para análise, direcionamento por setor, acompanhamento de status e validação final.",
    href: "/sistema",
    destaque: "Visão global da operação",
  },
  {
    titulo: "Indicadores e Monitoramento",
    descricao:
      "Acompanhamento dos registros por status, setor, severidade e evolução do plano de ação.",
    href: "/sistema",
    destaque: "Base para dashboard executivo",
  },
];

const recursos = [
  "Abertura anônima ou identificada",
  "Triagem inicial pela Qualidade",
  "Direcionamento por setor responsável",
  "Status automático por etapa do fluxo",
  "Análise de causa raiz",
  "Plano de ação 5W3H",
  "Protocolo de Londres",
  "Bow Tie e força da intervenção",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Gestão de Qualidade
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                Sistema de Gestão de Qualidade hospitalar com foco em ocorrências,
                não conformidades e melhoria contínua
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Plataforma profissional para gestão de ocorrências, não
                conformidades, eventos adversos e tratativas, com fluxo
                estruturado pela Qualidade, direcionamento por setor, análise e
                validação final.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/sistema"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Acessar sistema
                </Link>

                <Link
                  href="/sistema"
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Abrir painel da Qualidade
                </Link>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-4 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <ResumoCard
                titulo="Fluxo estruturado"
                texto="Registro, triagem, análise, plano de ação, validação e encerramento."
              />
              <ResumoCard
                titulo="Perfis do sistema"
                texto="Qualidade, liderança setorial, diretoria e abertura anônima."
              />
              <ResumoCard
                titulo="Visão profissional"
                texto="Layout limpo, hospitalar e pronto para evolução comercial."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Indicador titulo="Triagem pela Qualidade" valor="Centralizada" />
          <Indicador titulo="Direcionamento" valor="Por setor" />
          <Indicador titulo="Análise estruturada" valor="Completa" />
          <Indicador titulo="Validação final" valor="Rastreável" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                Estrutura principal
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Painel executivo da Qualidade
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Tela inicial institucional para apresentar o sistema de forma
                profissional, organizada e coerente com o módulo operacional já
                construído.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {modulos.map((item) => (
                <Link
                  key={item.titulo}
                  href={item.href}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                    {item.destaque}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.descricao}
                  </p>
                  <div className="mt-5 text-sm font-semibold text-cyan-700">
                    Acessar módulo
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Recursos do sistema
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Funcionalidades-chave
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Base funcional para operação da Qualidade, gestão setorial e visão
              estratégica da diretoria.
            </p>

            <div className="mt-6 space-y-3">
              {recursos.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-600" />
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Aplicação prática
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Fluxo operacional da Gestão de Qualidade
            </h2>

            <div className="mt-6 space-y-4">
              <Etapa
                numero="01"
                titulo="Registro"
                descricao="Abertura de ocorrência, não conformidade ou evento, inclusive com possibilidade de registro anônimo."
              />
              <Etapa
                numero="02"
                titulo="Triagem"
                descricao="Análise inicial pela Qualidade com classificação, observações e direcionamento ao setor responsável."
              />
              <Etapa
                numero="03"
                titulo="Análise"
                descricao="Investigação estruturada com causa raiz, Protocolo de Londres, Bow Tie e definição da força da intervenção."
              />
              <Etapa
                numero="04"
                titulo="Plano de ação"
                descricao="Construção e monitoramento do 5W3H até a conclusão das ações propostas."
              />
              <Etapa
                numero="05"
                titulo="Validação final"
                descricao="Retorno para a Qualidade, validação da efetividade e encerramento ou reabertura do caso."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Direcionamento
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Acesso rápido ao sistema
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Entrada principal da plataforma, mantendo uma apresentação limpa,
              profissional e alinhada à proposta de venda e implantação.
            </p>

            <div className="mt-6 grid gap-4">
              <Link
                href="/sistema"
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  Sistema de Gestão de Qualidade
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Acesso ao módulo operacional com cadastro, painel da Qualidade,
                  tratativas, análises e plano de ação.
                </p>
              </Link>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Estrutura preparada para expansão
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Base pronta para separar futuramente áreas específicas como
                  dashboard executivo, módulo da liderança, diretoria, abertura
                  externa por QR Code e indicadores avançados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Indicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{valor}</h3>
    </div>
  );
}

function ResumoCard({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">{titulo}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{texto}</p>
    </div>
  );
}

function Etapa({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
        {numero}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{descricao}</p>
      </div>
    </div>
  );
}