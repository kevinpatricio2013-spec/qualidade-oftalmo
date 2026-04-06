import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "../../src/components/logout-button";

export default function SistemaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/sistema" className="block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Gestão da Qualidade
              </p>
              <h1 className="text-base font-bold text-slate-900 md:text-lg">
                Sistema Hospitalar
              </h1>
            </div>
          </Link>

          <LogoutButton />
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}