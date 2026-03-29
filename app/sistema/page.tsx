'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Perfil = {
  id: string
  nome: string
  email: string
  perfil: 'qualidade' | 'lider' | 'colaborador' | 'diretoria'
  setor: string | null
}

type Props = {
  perfil: Perfil
  onLogout: () => void
}

type Ocorrencia = {
  id: number
  numero_ocorrencia: string | null
  titulo: string
  descricao: string | null
  tipo_ocorrencia: string | null
  gravidade: string | null
  status: string | null
  setor_origem: string | null
  setor_destino: string | null
  responsavel: string | null
  data_ocorrencia: string | null
  prazo: string | null
  usuario_id: string | null
}

const setores = [
  'Agendamento',
  'Autorização',
  'Centro Cirúrgico',
  'CME',
  'Comissões Hospitalares',
  'Compras',
  'Consultório Médico',
  'Contas Médicas',
  'Controlador de Acesso',
  'Diretoria',
  'Facilities',
  'Farmácia / OPME',
  'Faturamento',
  'Financeiro',
  'Fornecedores Externos',
  'Gestão da Informação',
  'Gestão de Pessoas',
  'Higiene',
  'Qualidade',
  'Recepção',
  'Engenharia Clínica',
  'Pronto Atendimento',
]

const tiposOcorrencia = [
  'Não conformidade',
  'Evento adverso',
  'Incidente sem dano',
  'Quase falha',
  'Reclamação',
  'Oportunidade de melhoria',
]

const gravidades = ['Leve', 'Moderada', 'Grave', 'Crítica']

export default function SistemaPage({ perfil, onLogout }: Props) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoOcorrencia, setTipoOcorrencia] = useState('')
  const [setorOrigem, setSetorOrigem] = useState('')
  const [setorDestino, setSetorDestino] = useState('')
  const [gravidade, setGravidade] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState('')
  const [responsavel, setResponsavel] = useState('')

  const [lista, setLista] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    if ((perfil.perfil === 'colaborador' || perfil.perfil === 'lider') && perfil.setor) {
      setSetorOrigem(perfil.setor)
    }
  }, [perfil])

  async function buscar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('ocorrencias')
      .select('id, numero_ocorrencia, titulo, descricao, tipo_ocorrencia, gravidade, status, setor_origem, setor_destino, responsavel, data_ocorrencia, prazo, usuario_id')
      .order('id', { ascending: false })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setLista(data || [])
  }

  useEffect(() => {
    buscar()
  }, [])

  async function salvar() {
    if (!titulo.trim()) return alert('Preencha o título.')
    if (!tipoOcorrencia) return alert('Selecione o tipo de ocorrência.')
    if (!setorOrigem) return alert('Selecione o setor de origem.')
    if (!gravidade) return alert('Selecione a gravidade.')
    if (!dataOcorrencia) return alert('Selecione a data da ocorrência.')

    setSaving(true)

    const { error } = await supabase
      .from('ocorrencias')
      .insert([
        {
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          tipo_ocorrencia: tipoOcorrencia || null,
          setor_origem: setorOrigem || null,
          setor_destino: setorDestino || null,
          gravidade: gravidade || null,
          status: 'Aberto',
          data_ocorrencia: dataOcorrencia || null,
          responsavel: responsavel.trim() || null,
          usuario_id: perfil.id,
        },
      ])

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    setTitulo('')
    setDescricao('')
    setTipoOcorrencia('')
    setSetorDestino('')
    setGravidade('')
    setDataOcorrencia('')
    setResponsavel('')

    if ((perfil.perfil === 'colaborador' || perfil.perfil === 'lider') && perfil.setor) {
      setSetorOrigem(perfil.setor)
    } else {
      setSetorOrigem('')
    }

    await buscar()
  }

  const listaFiltrada = useMemo(() => {
    return lista.filter((item) => {
      const texto = filtroTexto.toLowerCase()

      const matchTexto =
        !texto ||
        item.numero_ocorrencia?.toLowerCase().includes(texto) ||
        item.titulo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.responsavel?.toLowerCase().includes(texto)

      const matchStatus = !filtroStatus || item.status === filtroStatus

      return matchTexto && matchStatus
    })
  }, [lista, filtroTexto, filtroStatus])

  return (
    <main style={{ minHeight: '100vh', background: '#f4f8fb', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 20,
            padding: 24,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #0f766e 0%, #164e63 100%)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>
                Sistema Hospitalar
              </div>
              <h1 style={{ margin: '8px 0 0', fontSize: 28 }}>Gestão de Ocorrências</h1>
              <p style={{ margin: '10px 0 0' }}>
                Usuário: <strong>{perfil.nome || perfil.email}</strong> | Perfil: <strong>{perfil.perfil}</strong>
                {perfil.setor ? <> | Setor: <strong>{perfil.setor}</strong></> : null}
              </p>
            </div>

            <button onClick={onLogout} style={botaoSecundario}>
              Sair
            </button>
          </div>
        </div>

        <div style={card}>
          <h2>Nova ocorrência</h2>

          <div style={grid}>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" style={campo} />

            <select value={tipoOcorrencia} onChange={(e) => setTipoOcorrencia(e.target.value)} style={campo}>
              <option value="">Tipo de ocorrência</option>
              {tiposOcorrencia.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={setorOrigem}
              onChange={(e) => setSetorOrigem(e.target.value)}
              style={campo}
              disabled={perfil.perfil === 'colaborador' || perfil.perfil === 'lider'}
            >
              <option value="">Setor de origem</option>
              {setores.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={setorDestino} onChange={(e) => setSetorDestino(e.target.value)} style={campo}>
              <option value="">Setor destino</option>
              {setores.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={gravidade} onChange={(e) => setGravidade(e.target.value)} style={campo}>
              <option value="">Gravidade</option>
              {gravidades.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} style={campo} />
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável" style={campo} />

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição"
              style={{ ...campo, minHeight: 110, gridColumn: '1 / -1' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={salvar} disabled={saving} style={botaoPrincipal}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        <div style={card}>
          <h2>Filtros</h2>

          <div style={grid}>
            <input
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por texto"
              style={campo}
            />

            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={campo}>
              <option value="">Todos os status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em tratativa">Em tratativa</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        </div>

        <div style={card}>
          <h2>Lista de ocorrências</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : listaFiltrada.length === 0 ? (
            <p>Nenhum registro encontrado.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {listaFiltrada.map((item) => (
                <div key={item.id} style={{ border: '1px solid #dbe7ee', borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
                    {item.numero_ocorrencia || `OCORRÊNCIA #${item.id}`}
                  </div>
                  <h3 style={{ marginTop: 0 }}>{item.titulo}</h3>
                  <p><strong>Status:</strong> {item.status || '-'}</p>
                  <p><strong>Gravidade:</strong> {item.gravidade || '-'}</p>
                  <p><strong>Setor origem:</strong> {item.setor_origem || '-'}</p>
                  <p><strong>Setor destino:</strong> {item.setor_destino || '-'}</p>
                  <p><strong>Responsável:</strong> {item.responsavel || '-'}</p>
                  <p><strong>Data:</strong> {item.data_ocorrencia || '-'}</p>
                  <p><strong>Prazo:</strong> {item.prazo || '-'}</p>
                  {item.descricao ? <p><strong>Descrição:</strong> {item.descricao}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 24,
  marginBottom: 20,
  border: '1px solid #dbe7ee',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

const campo: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
}

const botaoPrincipal: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#0f766e',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const botaoSecundario: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
}