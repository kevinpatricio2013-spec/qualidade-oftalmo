"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import StatusBadge from "@/src/components/sistema/StatusBadge";
import {
  SETORES,
  STATUS_FLUXO,
  formatarData,
  formatarDataHora,
  statusAnterior,
  statusSeguinte,
} from "@/src/lib/qualidade";
import type { Ocorrencia, StatusOcorrencia } from "@/src/types/ocorrencia";

export default function OcorrenciaDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarOcorrencia() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErro(error.message);
      setOcorrencia(null);
      setCarregando(false);
      return;
    }

    setOcorrencia(data as Ocorrencia);
    setCarregando(false);
  }

  useEffect(() => {
    if (!Number.isNaN(id)) {
      carregarOcorrencia();
    }
  }, [id]);

  const proximoStatus = useMemo(
    () => (ocorrencia ? statusSeguinte(ocorrencia.status) : null),
    [ocorrencia]
  );

  const voltarStatus = useMemo(
    () => (ocorrencia ? statusAnterior(ocorrencia.status) : null),
    [ocorrencia]
  );

  async function atualizarCampo(campo: keyof Ocorrencia, valor: string | null) {
    if (!ocorrencia) return;

    setSalvando(true);
    const { data, error } = await supabase
      .from("ocorrencias")
      .update({
        [campo]: valor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ocorrencia.id)
      .select("*")
      .single();

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setOcorrencia(data as Ocorrencia);
  }

  async function atualizarStatus(status: StatusOcorrencia) {
    if (!ocorrencia) return;

    setSalvando(true);
    const { data, error } = await supabase
      .from("ocorrencias")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ocorrencia.id)
      .select("*")
      .single();

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setOcorrencia(data as Ocorrencia);
  }

  async function excluirOcorrencia() {
    if (!ocorrencia) return;
    const confirmou = window.confirm("Deseja realmente excluir esta ocorrência?");
    if (!confirmou) return;

    const { error } = await supabase.from("ocorrencias").delete().eq("id", ocorrencia.id);

    if (error) {
      setErro(error.message);
      return;
    }

    router.push("/sistema");
  }

  if (carregando) {
    return <div className="text-sm text-slate-500">Carregando ocorrência...</div>;
  }

  if (erro && !ocorrencia) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        Erro ao carregar ocorrência: {erro}
      </div>
    );
  }

  if (!ocorrencia) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
        Ocorrência não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Detalhe da ocorrência
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              #{ocorrencia.id} — {ocorrencia.titulo}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusBadge status={ocorrencia.status} />
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                Gravidade: {ocorrencia.gravidade || "—"}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                Setor destino: {ocorrencia.setor_destino || "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sistema"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar ao sistema
            </Link>
            <button
              onClick={excluirOcorrencia}
              className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Excluir
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Setor de origem" value={ocorrencia.setor_origem} />
          <InfoCard label="Responsável" value={ocorrencia.responsavel} />
          <InfoCard label="Prazo" value={formatarData(ocorrencia.prazo)} />
          <InfoCard label="Abertura" value={formatarDataHora(ocorrencia.created_at)} />
        </div>

        {erro ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        ) : null}

        {salvando ? (
          <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Salvando alterações...
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Movimentação no fluxo</h3>
        <div className="mt-5 flex flex-wrap gap-3">
          {voltarStatus ? (
            <button
              onClick={() => atualizarStatus(voltarStatus)}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar para: {voltarStatus}
            </button>
          ) : null}

          {proximoStatus ? (
            <button
              onClick={() => atualizarStatus(proximoStatus)}
              className="rounded-2xl bg-sky-700 px-4 py-3 font-semibold text-white hover:opacity-95"
            >
              Avançar para: {proximoStatus}
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STATUS_FLUXO.map((item) => (
            <button
              key={item}
              onClick={() => atualizarStatus(item)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                ocorrencia.status === item
                  ? "border-sky-700 bg-sky-50 text-sky-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TextAreaCard
          titulo="Descrição"
          valor={ocorrencia.descricao}
          onSalvar={(valor) => atualizarCampo("descricao", valor)}
        />

        <SelectCard
          titulo="Setor destino"
          valor={ocorrencia.setor_destino}
          opcoes={SETORES}
          onSalvar={(valor) => atualizarCampo("setor_destino", valor)}
        />

        <TextAreaCard
          titulo="Ação imediata"
          valor={ocorrencia.acao_imediata}
          onSalvar={(valor) => atualizarCampo("acao_imediata", valor)}
        />

        <TextAreaCard
          titulo="Análise de causa"
          valor={ocorrencia.analise_causa}
          onSalvar={(valor) => atualizarCampo("analise_causa", valor)}
        />

        <TextAreaCard
          titulo="Tratativa"
          valor={ocorrencia.tratativa}
          onSalvar={(valor) => atualizarCampo("tratativa", valor)}
        />

        <TextAreaCard
          titulo="Validação da Qualidade"
          valor={ocorrencia.validacao_qualidade}
          onSalvar={(valor) => atualizarCampo("validacao_qualidade", valor)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Plano de ação 5W2H</h3>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <TextAreaCard
            titulo="O que"
            valor={ocorrencia.o_que}
            onSalvar={(valor) => atualizarCampo("o_que", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Por que"
            valor={ocorrencia.por_que}
            onSalvar={(valor) => atualizarCampo("por_que", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Onde"
            valor={ocorrencia.onde}
            onSalvar={(valor) => atualizarCampo("onde", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Quando"
            valor={ocorrencia.quando}
            onSalvar={(valor) => atualizarCampo("quando", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Quem"
            valor={ocorrencia.quem}
            onSalvar={(valor) => atualizarCampo("quem", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Como"
            valor={ocorrencia.como}
            onSalvar={(valor) => atualizarCampo("como", valor)}
            compacto
          />
          <TextAreaCard
            titulo="Quanto"
            valor={ocorrencia.quanto}
            onSalvar={(valor) => atualizarCampo("quanto", valor)}
            compacto
          />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

function TextAreaCard({
  titulo,
  valor,
  onSalvar,
  compacto = false,
}: {
  titulo: string;
  valor?: string | null;
  onSalvar: (valor: string) => void | Promise<void>;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState(valor || "");

  useEffect(() => {
    setTexto(valor || "");
  }, [valor]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-slate-900">{titulo}</h4>
        <button
          onClick={() => onSalvar(texto)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Salvar
        </button>
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={compacto ? 4 : 6}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600"
        placeholder={`Preencha ${titulo.toLowerCase()}...`}
      />
    </div>
  );
}

function SelectCard({
  titulo,
  valor,
  opcoes,
  onSalvar,
}: {
  titulo: string;
  valor?: string | null;
  opcoes: string[];
  onSalvar: (valor: string) => void | Promise<void>;
}) {
  const [selecionado, setSelecionado] = useState(valor || "");

  useEffect(() => {
    setSelecionado(valor || "");
  }, [valor]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-slate-900">{titulo}</h4>
        <button
          onClick={() => onSalvar(selecionado)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Salvar
        </button>
      </div>

      <select
        value={selecionado}
        onChange={(e) => setSelecionado(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-600"
      >
        <option value="">Selecione</option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}