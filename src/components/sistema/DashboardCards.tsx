"use client";

interface CardItem {
  titulo: string;
  valor: number | string;
  subtitulo?: string;
}

interface DashboardCardsProps {
  items: CardItem[];
}

export default function DashboardCards({ items }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.titulo}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{item.titulo}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{item.valor}</p>
          {item.subtitulo ? (
            <p className="mt-2 text-sm text-slate-500">{item.subtitulo}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}