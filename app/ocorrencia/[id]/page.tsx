"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";

type Profile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  setor: string | null;
};

type Ocorrencia = {
  id: number;
  titulo: string | null;
  descricao: string;
  tipo_ocorrencia: string;
  setor_origem: string;
  setor_destino: string | null;
  gravidade: string | null;
  status: string;
  fila_atual: string | null;
  data_ocorrencia: string;
  created_at?: string;
};

type Tratativa = {
  id: number;
  ocorrencia_id: number;
  autor_id: string | null;
  autor_nome: string | null;
  setor: string | null;
  analise: string;
  acao_imediata: string;
  causa_raiz: string;
  descricao_tratativa: string;
  created_at: string;
};

type PlanoAcao5W2H = {
  id: number;
  ocorrencia_id: number;
  autor_id: string | null;
  autor_nome: string | null;
  setor: string | null;
  o_que: string;
  por_que: string;
  onde: string;
  quando: string;
  quem: string;
  como: string;
  created_at: string;
};

function normalizarRole(role: string | null | undefined) {
  if (!role) return "";

  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não informada";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(data: string | null | undefined) {
  if (!data) return "Não informada";

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleString("pt-BR");
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function BlocoTexto({ titulo, conteudo }: { titulo: string; conteudo: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
        {conteudo}
      </p>
    </div>
  );
}

export default function DetalheOcorrenciaPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [tratativas, setTratativas] = useState<Tratativa[]>([]);
  const [planos5w2h, setPlanos5w2h] = useState<PlanoAcao5W2H[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [analise, setAnalise] = useState("");
  const [acaoImediata, setAcaoImediata] = useState("");
  const [causaRaiz, setCausaRaiz] = useState("");
  const [descricaoTratativa, setDescricaoTratativa] = useState("");
  const [salvandoTratativa, setSalvandoTratativa] = useState(false);
  const [enviandoValidacao, setEnviandoValidacao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  const [oQue, setOQue] = useState("");
  const [porQue, setPorQue] = useState("");
  const [onde, setOnde] = useState("");
  const [quando, setQuando] = useState("");
  const [quem, setQuem] = useState("");
  const [como, setComo] = useState("");
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  async function carregarDetalhe() {
    setCarregando(true);
    setErro("");
    setMensagem("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfilData) {
      setErro("Perfil não encontrado.");
      setCarregando(false);
      return;
    }

    setPerfil(perfilData);

    const { data: ocorrenciaData, error: ocorrenciaError } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (ocorrenciaError || !ocorrenciaData) {
      setErro("Ocorrência não encontrada.");
      setCarregando(false);
      return;
    }

    const role = normalizarRole(perfilData.role);

    const podeVer =
      role === "qualidade" ||
      role === "diretoria" ||
      ((role === "lideranca" || role === "lider") &&
        perfilData.setor === ocorrenciaData.setor_destino);

    if (!podeVer) {
      setErro("Você não tem permissão para visualizar esta ocorrência.");
      setCarregando(false);
      return;
    }

    const { data: tratativasData, error: tratativasError } = await supabase
      .from("tratativas_ocorrencia")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaData.id)
      .order("created_at", { ascending: false });

    if (tratativasError) {
      setErro(tratativasError.message);
      setCarregando(false);
      return;
    }

    const { data: planoData, error: planoError } = await supabase
      .from("plano_acao_5w2h")
      .select("*")
      .eq("ocorrencia_id", ocorrenciaData.id)
      .order("created_at", { ascending: false });

    if (planoError) {
      setErro(planoError.message);
      setCarregando(false);
      return;
    }

    setOcorrencia(ocorrenciaData);
    setTratativas(tratativasData || []);
    setPlanos5w2h(planoData || []);
    setCarregando(false);
  }

  useEffect(() => {
    if (id) {
      carregarDetalhe();
    }
  }, [id]);

  const role = useMemo(() => normalizarRole(perfil?.role), [perfil]);

  const destinoVolta = useMemo(() => {
    if (role === "qualidade") return "/qualidade";
    if (role === "diretoria") return "/painel-executivo";
    if (role === "lideranca" || role === "lider") return "/lideranca";
    return "/";
  }, [role]);

  const ehLideranca = role === "lideranca" || role === "lider";
  const ehQualidade = role === "qualidade";
  const ehDiretoria = role === "diretoria";

  const podeRegistrarTratativa =
    !!ocorrencia &&
    ehLideranca &&
    perfil?.setor === ocorrencia.setor_destino &&
    (ocorrencia.status === "Encaminhada para tratativa" ||
      ocorrencia.status === "Em tratativa pelo setor");

  async function salvarTratativa() {
    if (!ocorrencia || !perfil) return;

    if (
      !analise.trim() ||
      !acaoImediata.trim() ||
      !causaRaiz.trim() ||
      !descricaoTratativa.trim()
    ) {
      setMensagem("Preencha todos os campos da tratativa.");
      return;
    }

    setSalvandoTratativa(true);
    setMensagem("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("tratativas_ocorrencia")
      .insert([
        {
          ocorrencia_id: ocorrencia.id,
          autor_id: user?.id ?? null,
          autor_nome: perfil.nome,
          setor: perfil.setor,
          analise: analise.trim(),
          acao_imediata: acaoImediata.trim(),
          causa_raiz: causaRaiz.trim(),
          descricao_tratativa: descricaoTratativa.trim(),
        },
      ]);

    if (insertError) {
      setMensagem(insertError.message);
      setSalvandoTratativa(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("ocorrencias")
      .update({
        status: "Em tratativa pelo setor",
        fila_atual: perfil.setor,
      })
      .eq("id", ocorrencia.id);

    if (updateError) {
      setMensagem(updateError.message);
      setSalvandoTratativa(false);
      return;
    }

    setAnalise("");
    setAcaoImediata("");
    setCausaRaiz("");
    setDescricaoTratativa("");
    setMensagem("Tratativa registrada com sucesso.");
    setSalvandoTratativa(false);

    await carregarDetalhe();
  }

  async function salvarPlano5W2H() {
    if (!ocorrencia || !perfil) return;

    if (
      !oQue.trim() ||
      !porQue.trim() ||
      !onde.trim() ||
      !quando ||
      !quem.trim() ||
      !como.trim()
    ) {
      setMensagem("Preencha todos os campos do plano de ação 5W2H.");
      return;
    }

    setSalvandoPlano(true);
    setMensagem("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("plano_acao_5w2h")
      .insert([
        {
          ocorrencia_id: ocorrencia.id,
          autor_id: user?.id ?? null,
          autor_nome: perfil.nome,
          setor: perfil.setor,
          o_que: oQue.trim(),
          por_que: porQue.trim(),
          onde: onde.trim(),
          quando,
          quem: quem.trim(),
          como: como.trim(),
        },
      ]);

    if (error) {
      setMensagem(error.message);
      setSalvandoPlano(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("ocorrencias")
      .update({
        status: "Em tratativa pelo setor",
        fila_atual: perfil.setor,
      })
      .eq("id", ocorrencia.id);

    if (updateError) {
      setMensagem(updateError.message);
      setSalvandoPlano(false);
      return;
    }

    setOQue("");
    setPorQue("");
    setOnde("");
    setQuando("");
    setQuem("");
    setComo("");
    setMensagem("Plano de ação 5W2H registrado com sucesso.");
    setSalvandoPlano(false);

    await carregarDetalhe();
  }

  async function enviarParaValidacao() {
    if (!ocorrencia) return;

    if (tratativas.length === 0) {
      setMensagem("Registre ao menos uma tratativa antes de enviar para validação.");
      return;
    }

    setEnviandoValidacao(true);
    setMensagem("");

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        status: "Aguardando validação da Qualidade",
        fila_atual: "Central da Qualidade",
      })
      .eq("id", ocorrencia.id);

    if (error) {
      setMensagem(error.message);
      setEnviandoValidacao(false);
      return;
    }

    setMensagem("Ocorrência enviada para validação da Qualidade.");
    setEnviandoValidacao(false);

    await carregarDetalhe();
  }

  async function encerrarOcorrencia() {
    if (!ocorrencia) return;

    setEncerrando(true);
    setMensagem("");

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        status: "Encerrada",
        fila_atual: "Finalizada",
      })
      .eq("id", ocorrencia.id);

    if (error) {
      setMensagem(error.message);
      setEncerrando(false);
      return;
    }

    setMensagem("Ocorrência validada e encerrada com sucesso.");
    setEncerrando(false);

    await carregarDetalhe();
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">Carregando ocorrência...</p>
        </div>
      </main>
    );
  }

  if (erro || !ocorrencia) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">Detalhe da ocorrência</h1>
          <p className="mt-4 text-sm text-red-600">
            {erro || "Ocorrência não disponível."}
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href={destinoVolta}
              className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>
            <button
              onClick={() => router.refresh()}
              className="rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
            >
              Atualizar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Detalhe da ocorrência</p>
              <h1 className="text-3xl font-bold text-slate-800">
                {ocorrencia.tipo_ocorrencia}
              </h1>
              <p className="mt-2 text-sm text-slate-600">Registro #{ocorrencia.id}</p>
            </div>

            <div className="flex gap-3">
              <Link
                href={destinoVolta}
                className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>

        {mensagem && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {mensagem}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold text-slate-800">Descrição da ocorrência</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
              {ocorrencia.descricao}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Situação atual</h2>

            <div className="mt-4 space-y-3">
              <InfoRow label="Status" value={ocorrencia.status || "Não informado"} />
              <InfoRow label="Fila atual" value={ocorrencia.fila_atual || "Não informada"} />
              <InfoRow label="Gravidade" value={ocorrencia.gravidade || "A definir"} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Informações do registro</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard label="Tipo da ocorrência" value={ocorrencia.tipo_ocorrencia} />
            <InfoCard label="Setor de origem" value={ocorrencia.setor_origem} />
            <InfoCard label="Setor responsável" value={ocorrencia.setor_destino || "A definir"} />
            <InfoCard label="Data da ocorrência" value={formatarData(ocorrencia.data_ocorrencia)} />
            <InfoCard label="Título" value={ocorrencia.titulo || ocorrencia.tipo_ocorrencia} />
            <InfoCard label="ID do registro" value={String(ocorrencia.id)} />
          </div>
        </div>

        {podeRegistrarTratativa && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-800">Registrar tratativa</h2>
              <p className="mt-2 text-sm text-slate-600">
                Preencha a análise do setor responsável para dar seguimento à ocorrência.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Análise da ocorrência
                </label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={analise}
                  onChange={(e) => setAnalise(e.target.value)}
                  placeholder="Descreva a análise realizada pelo setor."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ação imediata
                </label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={acaoImediata}
                  onChange={(e) => setAcaoImediata(e.target.value)}
                  placeholder="Informe a ação imediata adotada."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Causa raiz
                </label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={causaRaiz}
                  onChange={(e) => setCausaRaiz(e.target.value)}
                  placeholder="Registre a causa raiz identificada."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descrição da tratativa
                </label>
                <textarea
                  className="min-h-[130px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={descricaoTratativa}
                  onChange={(e) => setDescricaoTratativa(e.target.value)}
                  placeholder="Descreva a tratativa executada pelo setor."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salvarTratativa}
                  disabled={salvandoTratativa}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {salvandoTratativa ? "Salvando..." : "Salvar tratativa"}
                </button>

                <button
                  onClick={enviarParaValidacao}
                  disabled={enviandoValidacao}
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {enviandoValidacao
                    ? "Enviando..."
                    : "Enviar para validação da Qualidade"}
                </button>
              </div>
            </div>
          </div>
        )}

        {podeRegistrarTratativa && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-800">Plano de ação 5W2H</h2>
              <p className="mt-2 text-sm text-slate-600">
                Registre o plano de ação estruturado para acompanhamento da ocorrência.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  What — O que será feito
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={oQue}
                  onChange={(e) => setOQue(e.target.value)}
                  placeholder="Descreva a ação a ser realizada."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Why — Por que será feito
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={porQue}
                  onChange={(e) => setPorQue(e.target.value)}
                  placeholder="Explique a justificativa da ação."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Where — Onde será feito
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={onde}
                  onChange={(e) => setOnde(e.target.value)}
                  placeholder="Informe o local, setor ou processo."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  When — Quando será feito
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={quando}
                  onChange={(e) => setQuando(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Who — Quem será o responsável
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={quem}
                  onChange={(e) => setQuem(e.target.value)}
                  placeholder="Informe o responsável pela execução."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  How — Como será feito
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-700"
                  value={como}
                  onChange={(e) => setComo(e.target.value)}
                  placeholder="Descreva como a ação será executada."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salvarPlano5W2H}
                  disabled={salvandoPlano}
                  className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                >
                  {salvandoPlano ? "Salvando..." : "Salvar plano 5W2H"}
                </button>
              </div>
            </div>
          </div>
        )}

        {(ehQualidade || ehDiretoria || ehLideranca) && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Tratativas registradas</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Histórico das análises e ações executadas para esta ocorrência.
                </p>
              </div>

              {ehQualidade && ocorrencia.status === "Aguardando validação da Qualidade" && (
                <button
                  onClick={encerrarOcorrencia}
                  disabled={encerrando}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {encerrando ? "Encerrando..." : "Validar e encerrar"}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {tratativas.map((tratativa) => (
                <div key={tratativa.id} className="rounded-2xl border p-5">
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Autor: {tratativa.autor_nome || "Não informado"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Setor: {tratativa.setor || "Não informado"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Registro: {formatarDataHora(tratativa.created_at)}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <BlocoTexto titulo="Análise da ocorrência" conteudo={tratativa.analise} />
                    <BlocoTexto titulo="Ação imediata" conteudo={tratativa.acao_imediata} />
                    <BlocoTexto titulo="Causa raiz" conteudo={tratativa.causa_raiz} />
                    <BlocoTexto
                      titulo="Descrição da tratativa"
                      conteudo={tratativa.descricao_tratativa}
                    />
                  </div>
                </div>
              ))}

              {tratativas.length === 0 && (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                  Nenhuma tratativa foi registrada até o momento.
                </div>
              )}
            </div>
          </div>
        )}

        {(ehQualidade || ehDiretoria || ehLideranca) && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-800">Planos de ação 5W2H</h2>
              <p className="mt-2 text-sm text-slate-600">
                Registros estruturados do plano de ação relacionado à ocorrência.
              </p>
            </div>

            <div className="space-y-4">
              {planos5w2h.map((plano) => (
                <div key={plano.id} className="rounded-2xl border p-5">
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Autor: {plano.autor_nome || "Não informado"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Setor: {plano.setor || "Não informado"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Registro: {formatarDataHora(plano.created_at)}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <BlocoTexto titulo="What — O que será feito" conteudo={plano.o_que} />
                    <BlocoTexto titulo="Why — Por que será feito" conteudo={plano.por_que} />
                    <BlocoTexto titulo="Where — Onde será feito" conteudo={plano.onde} />
                    <BlocoTexto titulo="When — Quando será feito" conteudo={formatarData(plano.quando)} />
                    <BlocoTexto titulo="Who — Quem será o responsável" conteudo={plano.quem} />
                    <BlocoTexto titulo="How — Como será feito" conteudo={plano.como} />
                  </div>
                </div>
              ))}

              {planos5w2h.length === 0 && (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                  Nenhum plano de ação 5W2H foi registrado até o momento.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Acesso do perfil atual</h2>
          <p className="mt-3 text-sm text-slate-600">
            {ehLideranca
              ? "Visualização, tratativa e plano de ação restritos ao setor vinculado do perfil de Liderança Setorial."
              : "Visualização institucional permitida ao perfil atual."}
          </p>
        </div>
      </div>
    </main>
  );
}