import Link from "next/link";

const indicadores = [
  {
    titulo: "Ocorrências registradas",
    valor: "128",
    descricao: "Monitoramento centralizado de notificações e não conformidades.",
  },
  {
    titulo: "Setores monitorados",
    valor: "24",
    descricao: "Acompanhamento por área assistencial, administrativa e de apoio.",
  },
  {
    titulo: "Tratativas em andamento",
    valor: "18",
    descricao: "Plano de ação, responsáveis e prazos sob gestão contínua.",
  },
  {
    titulo: "Conformidade operacional",
    valor: "94%",
    descricao: "Visão executiva de desempenho e resposta institucional.",
  },
];

const modulos = [
  {
    titulo: "Gestão de Ocorrências",
    descricao:
      "Registro estruturado de eventos, não conformidades e desvios assistenciais ou operacionais.",
  },
  {
    titulo: "Tratativas e Responsáveis",
    descricao:
      "Definição clara de responsáveis, acompanhamento das ações e controle de prazos.",
  },
  {
    titulo: "Plano de Ação 5W2H",
    descricao:
      "Padronização das ações corretivas e preventivas com visão objetiva e executiva.",
  },
  {
    titulo: "Indicadores e Monitoramento",
    descricao:
      "Painéis com leitura rápida para apoio à tomada de decisão e gestão da qualidade.",
  },
];

const destaques = [
  "Fluxo organizado para registro, análise e acompanhamento de ocorrências",
  "Interface limpa, hospitalar e preparada para uso institucional",
  "Leitura gerencial com foco em qualidade, segurança e rastreabilidade",
  "Estrutura pronta para expansão de dashboard, filtros e inteligência operacional",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.06),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-800">
                Sistema hospitalar • Gestão da qualidade e ocorrências
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Gestão de Ocorrências
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Plataforma para registro, acompanhamento e análise de ocorrências,
                não conformidades e planos de ação, com visual executivo e
                organização hospitalar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sistema"
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Acessar sistema
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Ver dashboard
                </Link>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Visão institucional
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Resumo executivo
                  </h2>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Operacional
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {indicadores.map((item) => (
                  <div
                    key={item.titulo}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-medium text-slate-500">{item.titulo}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {item.valor}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {modulos.map((item) => (
            <div
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 h-10 w-10 rounded-2xl bg-cyan-100" />
              <h3 className="text-lg font-semibold text-slate-900">{item.titulo}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.descricao}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                Direcionamento
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Estrutura pensada para gestão hospitalar
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {destaques.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Acesso rápido
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Navegação principal do projeto
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Use os atalhos abaixo para validar as rotas principais e apresentar
              o projeto de forma organizada.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 transition hover:bg-slate-700"
              >
                <span>
                  <span className="block text-sm text-slate-300">Página inicial</span>
                  <span className="block font-semibold text-white">/</span>
                </span>
                <span className="text-cyan-300">Abrir</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 transition hover:bg-slate-700"
              >
                <span>
                  <span className="block text-sm text-slate-300">Painel executivo</span>
                  <span className="block font-semibold text-white">/dashboard</span>
                </span>
                <span className="text-cyan-300">Abrir</span>
              </Link>

              <Link
                href="/sistema"
                className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 transition hover:bg-slate-700"
              >
                <span>
                  <span className="block text-sm text-slate-300">Módulo operacional</span>
                  <span className="block font-semibold text-white">/sistema</span>
                </span>
                <span className="text-cyan-300">Abrir</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-800">
                Apresentação institucional
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Página inicial pronta para demonstração
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Esta tela já entrega uma primeira impressão mais madura,
                organizada e alinhada a um sistema hospitalar real.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sistema"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
              >
                Entrar no sistema
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-white px-5 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                Visualizar dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}