import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f9ff]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-b border-[#e4effa] bg-gradient-to-br from-[#eef7ff] via-white to-[#f6fbff]">
        {/* efeitos de fundo */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[-80px] top-[-80px] h-64 w-64 rounded-full bg-[#d9efff] blur-3xl" />
          <div className="absolute right-[-100px] top-10 h-72 w-72 rounded-full bg-[#eaf6ff] blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/3 h-72 w-72 rounded-full bg-[#dff1ff] blur-3xl" />
        </div>

        <div className="relative w-full max-w-[1200px] px-6 text-center">
          {/* TÍTULO PRINCIPAL */}
          <h1 className="text-4xl font-bold text-[#10375c] sm:text-5xl xl:text-6xl">
            Gestão da Qualidade
          </h1>

          {/* SUBTÍTULO SUAVE (opcional e elegante) */}
          <p className="mt-6 text-base text-[#5f7f9d] sm:text-lg">
            Sistema hospitalar para gestão de ocorrências com fluxo estruturado,
            controle pela Qualidade e tratativa pela Liderança.
          </p>

          {/* BOTÕES PRINCIPAIS */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ocorrencia/nova"
              className="rounded-2xl bg-gradient-to-r from-[#7fc4ff] to-[#9ad4ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(67,153,230,0.22)] transition hover:scale-[1.02]"
            >
              Registrar ocorrência
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-[#d8e9fb] bg-white px-6 py-3.5 text-sm font-semibold text-[#275982] transition hover:bg-[#f6fbff]"
            >
              Acessar sistema
            </Link>
          </div>

          {/* BLOCO DE FLUXO (mantido mais abaixo, discreto) */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Abertura sem login",
              "Direcionamento pela Qualidade",
              "Tratativa pela Liderança",
              "Registro do plano 5W2H",
              "Validação final",
              "Encerramento controlado",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[#e4effa] bg-white px-4 py-3 text-sm text-[#4f6f8f]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e5f4ff] text-xs font-bold text-[#0f5d99]">
                  {index + 1}
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}