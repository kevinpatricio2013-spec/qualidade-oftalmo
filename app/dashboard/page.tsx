'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Ocorrencia = {
  id: number
  numero_ocorrencia: string | null
  titulo: string
  gravidade: 'Leve' | 'Moderada' | 'Grave' | 'Crítica' | null
  status:
    | 'Aberto'
    | 'Classificação pela Qualidade'
    | 'Encaminhado ao setor'
    | 'Em tratativa'
    | 'Aguardando validação da Qualidade'
    | 'Concluído'
    | 'Cancelado'
    | null
  setor_origem: string | null
  setor_destino: string | null
  responsavel: string | null
  prazo: string | null
  data_ocorrencia: string | null
  data_conclusao: string | null
  created_at: string | null
}

type Perfil = {
  id: string
  nome: string
  email: string
  perfil: 'qualidade' | 'lider' | 'colaborador' | 'diretoria'
  setor: string | null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [lista, setLista] = useState<Ocorrencia[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  async function carregarTudo() {
    setLoading(true)

    const sessionResult = await supabase.auth.getSession()
    const userId = sessionResult.data.session?.user?.id

    if (userId) {
      const perfilResult = await supabase
        .from('usuarios')
        .select('id, nome, email, perfil, setor')
        .eq('id', userId)
        .single()

      if (!perfilResult.error) {
        setPerfil(perfilResult.data)
      }
    }

    const ocorrenciasResult = await supabase
      .from('ocorrencias')
      .select(`
        id,
        numero_ocorrencia,
        titulo,
        gravidade,
        status,
        setor_origem,
        setor_destino,
        responsavel,
        prazo,
        data_ocorrencia,
        data_conclusao,
        created_at
      `)
      .order('id', { ascending: false })

    if (!ocorrenciasResult.error) {
      setLista(ocorrenciasResult.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const indicadores = useMemo(() => {
    const hoje = new Date(new Date().toDateString())

    const abertas = lista.filter((x) => x.status === 'Aberto').length
    const classificacao = lista.filter((x) => x.status === 'Classificação pela Qualidade').length
    const encaminhadas = lista.filter((x) => x.status === 'Encaminhado ao setor').length
    const tratativa = lista.filter((x) => x.status === 'Em tratativa').length
    const validacao = lista.filter((x) => x.status === 'Aguardando validação da Qualidade').length
    const concluidas = lista.filter((x) => x.status === 'Concluído').length
    const canceladas = lista.filter((x) => x.status === 'Cancelado').length

    const atrasadas = lista.filter((x) => {
      if (!x.prazo) return false
      if (x.status === 'Concluído' || x.status === 'Cancelado') return false
      return new Date(x.prazo) < hoje
    }).length

    const criticas = lista.filter((x) => x.gravidade === 'Crítica').length
    const graves = lista.filter((x) => x.gravidade === 'Grave').length

    return {
      total: lista.length,
      abertas,
      classificacao,
      encaminhadas,
      tratativa,
      validacao,
      concluidas,
      canceladas,
      atrasadas,
      criticas,
      graves,
    }
  }, [lista])

  const porGravidade = useMemo(() => {
    return [
      { nome: 'Leve', valor: lista.filter((x) => x.gravidade === 'Leve').length },
      { nome: 'Moderada', valor: lista.filter((x) => x.gravidade === 'Moderada').length },
      { nome: 'Grave', valor: lista.filter((x) => x.gravidade === 'Grave').length },
      { nome: 'Crítica', valor: lista.filter((x) => x.gravidade === 'Crítica').length },
    ]
  }, [lista])

  const porStatus = useMemo(() => {
    return [
      { nome: 'Aberto', valor: lista.filter((x) => x.status === 'Aberto').length },
      { nome: 'Classificação', valor: lista.filter((x) => x.status === 'Classificação pela Qualidade').length },
      { nome: 'Encaminhado', valor: lista.filter((x) => x.status === 'Encaminhado ao setor').length },
      { nome: 'Tratativa', valor: lista.filter((x) => x.status === 'Em tratativa').length },
      { nome: 'Validação', valor: lista.filter((x) => x.status === 'Aguardando validação da Qualidade').length },
      { nome: 'Concluído', valor: lista.filter((x) => x.status === 'Concluído').length },
      { nome: 'Cancelado', valor: lista.filter((x) => x.status === 'Cancelado').length },
    ]
  }, [lista])

  const porSetor = useMemo(() => {
    const mapa = new Map<string, number>()

    lista.forEach((item) => {
      const chave = item.setor_destino || item.setor_origem || 'Não informado'
      mapa.set(chave, (mapa.get(chave) || 0) + 1)
    })

    return Array.from(mapa.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [lista])

  const atrasadasLista = useMemo(() => {
    const hoje = new Date(new Date().toDateString())

    return lista
      .filter((x) => {
        if (!x.prazo) return false
        if (x.status === 'Concluído' || x.status === 'Cancelado') return false
        return new Date(x.prazo) < hoje
      })
      .sort((a, b) => {
        if (!a.prazo || !b.prazo) return 0
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime()
      })
  }, [lista])

  const topSetores = porSetor.slice(0, 8)

  function cardStyle(): React.CSSProperties {
    return {
      background: '#fff',
      border: '1px solid #d7e3ea',
      borderRadius: 18,
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
    }
  }

  function badgeStyle(valor?: string | null): React.CSSProperties {
    const base: React.CSSProperties = {
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      marginRight: 8,
      marginBottom: 8,
    }

    if (valor === 'Crítica' || valor === 'Grave') {
      return { ...base, background: '#fee2e2', color: '#991b1b' }
    }

    if (valor === 'Moderada') {
      return { ...base, background: '#fef3c7', color: '#92400e' }
    }

    if (valor === 'Leve') {
      return { ...base, background: '#dcfce7', color: '#166534' }
    }

    if (valor === 'Concluído') {
      return { ...base, background: '#dcfce7', color: '#166534' }
    }

    if (valor === 'Aberto') {
      return { ...base, background: '#dbeafe', color: '#1d4ed8' }
    }

    if (valor === 'Em tratativa') {
      return { ...base, background: '#ffedd5', color: '#9a3412' }
    }

    if (valor === 'Aguardando validação da Qualidade') {
      return { ...base, background: '#fef9c3', color: '#854d0e' }
    }

    if (valor === 'Classificação pela Qualidade') {
      return { ...base, background: '#e0f2fe', color: '#0c4a6e' }
    }

    if (valor === 'Encaminhado ao setor') {
      return { ...base, background: '#ede9fe', color: '#5b21b6' }
    }

    return { ...base, background: '#e2e8f0', color: '#334155' }
  }

  function barra(valor: number, max: number): React.CSSProperties {
    const largura = max > 0 ? `${(valor / max) * 100}%` : '0%'

    return {
      width: largura,
      height: 10,
      borderRadius: 999,
      background: 'linear-gradient(90deg, #0f766e 0%, #164e63 100%)',
    }
  }

  const maxStatus = Math.max(...porStatus.map((x) => x.valor), 1)
  const maxGravidade = Math.max(...porGravidade.map((x) => x.valor), 1)
  const maxSetor = Math.max(...topSetores.map((x) => x.valor), 1)

  if (loading) {
    return <main style={{ padding: 24 }}>Carregando dashboard...</main>
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0f7fa 0%, #f8fbfd 45%, #eef5f8 100%)',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 20,
            padding: 24,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #0f766e 0%, #164e63 100%)',
            color: '#fff',
            boxShadow: '0 12px 30px rgba(15, 118, 110, 0.25)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              opacity: 0.9,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Gestão da Qualidade Hospitalar
          </div>

          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>
            Dashboard Gerencial de Ocorrências
          </h1>

          <p style={{ marginTop: 10, marginBottom: 0 }}>
            {perfil ? (
              <>
                Usuário: <strong>{perfil.nome || perfil.email}</strong> | Perfil:{' '}
                <strong>{perfil.perfil}</strong>
                {perfil.setor ? (
                  <>
                    {' '}| Setor: <strong>{perfil.setor}</strong>
                  </>
                ) : null}
              </>
            ) : (
              'Visão consolidada do sistema'
            )}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>TOTAL</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
              {indicadores.total}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>ABERTAS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1d4ed8', marginTop: 8 }}>
              {indicadores.abertas}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>EM TRATATIVA</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#c2410c', marginTop: 8 }}>
              {indicadores.tratativa}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>CONCLUÍDAS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#15803d', marginTop: 8 }}>
              {indicadores.concluidas}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>ATRASADAS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#b91c1c', marginTop: 8 }}>
              {indicadores.atrasadas}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>CRÍTICAS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#991b1b', marginTop: 8 }}>
              {indicadores.criticas}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ ...cardStyle(), padding: 24 }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Ocorrências por status</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              {porStatus.map((item) => (
                <div key={item.nome}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 6,
                      fontSize: 14,
                      color: '#334155',
                    }}
                  >
                    <strong>{item.nome}</strong>
                    <span>{item.valor}</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 10,
                      background: '#e2e8f0',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={barra(item.valor, maxStatus)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 24 }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Ocorrências por gravidade</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              {porGravidade.map((item) => (
                <div key={item.nome}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 6,
                      fontSize: 14,
                      color: '#334155',
                    }}
                  >
                    <strong>{item.nome}</strong>
                    <span>{item.valor}</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 10,
                      background: '#e2e8f0',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={barra(item.valor, maxGravidade)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 20,
          }}
        >
          <div style={{ ...cardStyle(), padding: 24 }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Ranking por setor</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              {topSetores.length === 0 ? (
                <p style={{ color: '#64748b' }}>Sem dados para exibir.</p>
              ) : (
                topSetores.map((item) => (
                  <div key={item.nome}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 6,
                        fontSize: 14,
                        color: '#334155',
                      }}
                    >
                      <strong>{item.nome}</strong>
                      <span>{item.valor}</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 10,
                        background: '#e2e8f0',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={barra(item.valor, maxSetor)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 24 }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Ocorrências atrasadas</h2>

            {atrasadasLista.length === 0 ? (
              <p style={{ color: '#64748b' }}>Nenhuma ocorrência atrasada.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {atrasadasLista.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 14,
                      background: '#fffaf9',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
                      {item.numero_ocorrencia || `OCORRÊNCIA #${item.id}`}
                    </div>

                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      {item.titulo}
                    </div>

                    <div style={{ marginBottom: 6 }}>
                      {item.status && <span style={badgeStyle(item.status)}>{item.status}</span>}
                      {item.gravidade && (
                        <span style={badgeStyle(item.gravidade)}>{item.gravidade}</span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, color: '#475569' }}>
                      <strong>Setor:</strong> {item.setor_destino || item.setor_origem || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      <strong>Prazo:</strong> {item.prazo || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      <strong>Responsável:</strong> {item.responsavel || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}