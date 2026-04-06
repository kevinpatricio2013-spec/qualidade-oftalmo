import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f9ff]">
      <section className="relative overflow-hidden border-b border-[#e4effa] bg-gradient-to-br from-[#eef7ff] via-white to-[#f6fbff]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[-80px] top-[-80px] h-64 w-64 rounded-full bg-[#d9efff] blur-3xl" />
          <div className="absolute right-[-100px] top-10 h-72 w-72 rounded-full bg-[#eaf6ff] blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/3 h-72 w-72 rounded-full bg-[#dff1ff] blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-10 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#dff1ff] to-[#eef8ff] text-3xl shadow-sm">
                🏥
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7ea4c8]">
                  Sistema Hospitalar
                </p>
                <h1 className="mt-1 text-xl font-bold text-[#10375c] sm:text-2xl">
                  Gestão da Qualidade
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-2xl border border-[#d8e9fb] bg-white px-5 py-3 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
              >
                Entrar no sistema
              </Link>

              <Link
                href="/ocorrencia/nova"
                className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
              >
                Nova ocorrência
              </Link>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.2fr_0.9fr] lg:py-20">
            <div>
              <p className="inline-flex rounded-full border border-[#d8e9fb] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f97bd] shadow-sm">
                Plataforma profissional para qualidade hospitalar
              </p>

              <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-[#10375c] sm:text-5xl xl:text-6xl">
                Gestão de ocorrências com fluxo estruturado para Qualidade e
                Liderança
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-8 text-[#5f7f9d] sm:text-lg">
                Sistema voltado para rotina hospitalar, com abertura pública de
                ocorrência, direcionamento pela Qualidade, tratativa pela
                liderança e validação final com visual executivo, claro e
                profissional.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/ocorrencia/nova"
                  className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.01]"
                >
                  Registrar ocorrência
                </Link>

                <Link
                  href="/login"
                  className="rounded-2xl border border-[#d8e9fb] bg-white px-6 py-3.5 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
                >
                  Acessar área interna
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[28px] border border-[#e4effa] bg-white p-5 shadow-sm">
                  <p className="text-2xl">📋</p>
                  <h3 className="mt-3 text-base font-bold text-[#12385f]">
                    Registro simples
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                    Abertura pública sem login, com formulário direto e claro.
                  </p>
                </div>

                <div className="rounded-[28px] border border-[#e4effa] bg-white p-5 shadow-sm">
                  <p className="text-2xl">✅</p>
                  <h3 className="mt-3 text-base font-bold text-[#12385f]">
                    Fluxo controlado
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                    A Qualidade direciona e valida. A liderança trata e devolve.
                  </p>
                </div>

                <div className="rounded-[28px] border border-[#e4effa] bg-white p-5 shadow-sm">
                  <p className="text-2xl">📊</p>
                  <h3 className="mt-3 text-base font-bold text-[#12385f]">
                    Visão gerencial
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6482a0]">
                    Painéis internos com padrão hospitalar profissional.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[32px] border border-[#e3f0fb] bg-white p-6 shadow-[0_20px_70px_rgba(59,130,246,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                  Fluxo do sistema
                </p>

                <div className="mt-5 space-y-4">
                  {[
                    "Colaborador abre ocorrência sem login",
                    "Qualidade analisa e direciona",
                    "Liderança trata a ocorrência",
                    "Liderança registra 5W2H",
                    "Qualidade valida",
                    "Qualidade encerra",
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
              </div>

              <div className="rounded-[32px] border border-[#e3f0fb] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a8c9]">
                  Acesso rápido
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/ocorrencia/nova"
                    className="rounded-2xl border border-[#e3f0fb] bg-[#f8fbff] px-5 py-4 text-sm font-semibold text-[#275982] transition hover:bg-white"
                  >
                    Abrir nova ocorrência
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-2xl border border-[#e3f0fb] bg-[#f8fbff] px-5 py-4 text-sm font-semibold text-[#275982] transition hover:bg-white"
                  >
                    Entrar na área autenticada
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4 border-t border-[#e4effa] pt-6 text-sm text-[#6c8baa] sm:flex-row sm:items-center sm:justify-between">
            <p>Sistema de Gestão da Qualidade Hospitalar</p>
            <p>Visual profissional · fluxo controlado · operação hospitalar</p>
          </div>
        </div>
      </section>
    </main>
  );
}