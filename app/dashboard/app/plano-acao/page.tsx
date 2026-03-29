'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Ocorrencia = {
  id: number
  numero_ocorrencia: string | null
  titulo: string
  status: string | null
  setor_origem: string | null
  setor_destino: string | null
  gravidade: string | null
}

type PlanoAcao = {
  id: number
  ocorrencia_id: number
  what_text: string | null
  why_text: string | null
  where_text: string | null
  when_date: string | null
  who_text: string | null
  how_text: string | null
  how_much_text: string | null
  status: 'Pendente' | 'Em andamento' | 'Concluído' | 'Cancelado' | null
  responsavel: string | null
  prazo: string | null
  evidencia: string | null
  observacao: string | null
  created_at: string | null
  updated_at: string | null
}

const statusPlano = ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'] as const

const initialForm = {
  ocorrencia_id: '',
  what_text: '',
  why_text: '',
  where_text: '',
  when_date: '',
  who_text: '',
  how_text: '',
  how_much_text: '',
  status: 'Pendente',
  responsavel: '',
  prazo: '',
  evidencia: '',
  observacao: '',
}

export default function PlanoAcaoPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [lista, setLista] = useState<PlanoAcao[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [filtroOcorrencia, setFiltroOcorrencia] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const [form, setForm] = useState(initialForm)

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function limparFormulario() {
    setEditingId(null)
    setForm(initialForm)
  }

  async function buscarOcorrencias() {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('id, numero_ocorrencia, titulo, status, setor_origem, setor_destino, gravidade')
      .order('id', { ascending: false })

    if (error) {
      alert(`Erro ao buscar ocorrências: ${error.message}`)
      return
    }

    setOcorrencias(data || [])
  }

  async function buscarPlanos() {
    setLoading(true)

    const { data, error } = await supabase
      .from('planos_acao')
      .select('*')
      .order('id', { ascending: false })

    setLoading(false)

    if (error) {
      alert(`Erro ao buscar planos de ação: ${error.message}`)
      return
    }

    setLista(data || [])
  }

  useEffect(() => {
    buscarOcorrencias()
    buscarPlanos()
  }, [])

  async function salvar() {
    if (!form.ocorrencia_id) {
      alert('Selecione a ocorrência.')
      return
    }

    if (!form.what_text.trim()) {
      alert('Preencha o campo What.')
      return
    }

    if (!form.why_text.trim()) {
      alert('Preencha o campo Why.')
      return
    }

    if (!form.who_text.trim()) {
      alert('Preencha o responsável da ação.')
      return
    }

    setSaving(true)

    const payload = {
      ocorrencia_id: Number(form.ocorrencia_id),
      what_text: form.what_text.trim() || null,
      why_text: form.why_text.trim() || null,
      where_text: form.where_text.trim() || null,
      when_date: form.when_date || null,
      who_text: form.who_text.trim() || null,
      how_text: form.how_text.trim() || null,
      how_much_text: form.how_much_text.trim() || null,
      status: form.status || 'Pendente',
      responsavel: form.responsavel.trim() || null,
      prazo: form.prazo || null,
      evidencia: form.evidencia.trim() || null,
      observacao: form.observacao.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('planos_acao')
        .update(payload)
        .eq('id', editingId)

      setSaving(false)

      if (error) {
        alert(`Erro ao atualizar plano: ${error.message}`)
        return
      }
    } else {
      const { error } = await supabase
        .from('planos_acao')
        .insert([payload])

      setSaving(false)

      if (error) {
        alert(`Erro ao salvar plano: ${error.message}`)
        return
      }
    }

    limparFormulario()
    await buscarPlanos()
  }

  function editar(item: PlanoAcao) {
    setEditingId(item.id)
    setForm({
      ocorrencia_id: String(item.ocorrencia_id || ''),
      what_text: item.what_text || '',
      why_text: item.why_text || '',
      where_text: item.where_text || '',
      when_date: item.when_date || '',
      who_text: item.who_text || '',
      how_text: item.how_text || '',
      how_much_text: item.how_much_text || '',
      status: (item.status as typeof initialForm.status) || 'Pendente',
      responsavel: item.responsavel || '',
      prazo: item.prazo || '',
      evidencia: item.evidencia || '',
      observacao: item.observacao || '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function excluir(id: number) {
    const confirmar = window.confirm('Deseja realmente excluir este plano de ação?')
    if (!confirmar) return

    const { error } = await supabase
      .from('planos_acao')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Erro ao excluir plano: ${error.message}`)
      return
    }

    if (editingId === id) {
      limparFormulario()
    }

    await buscarPlanos()
  }

  async function alterarStatus(id: number, novoStatus: string) {
    const { error } = await supabase
      .from('planos_acao')
      .update({ status: novoStatus })
      .eq('id', id)

    if (error) {
      alert(`Erro ao alterar status: ${error.message}`)
      return
    }

    await buscarPlanos()
  }

  function getOcorrenciaInfo(ocorrenciaId: number) {
    return ocorrencias.find((o) => o.id === ocorrenciaId)
  }

  const listaFiltrada = useMemo(() => {
    return lista.filter((item) => {
      const matchOcorrencia =
        !filtroOcorrencia || String(item.ocorrencia_id) === filtroOcorrencia

      const matchStatus =
        !filtroStatus || item.status === filtroStatus

      return matchOcorrencia && matchStatus
    })
  }, [lista, filtroOcorrencia, filtroStatus])

  function cardStyle(): React.CSSProperties {
    return {
      background: '#fff',
      border: '1px solid #d7e3ea',
      borderRadius: 18,
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
    }
  }

  function inputStyle(): React.CSSProperties {
    return {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      border: '1px solid #cbd5e1',
      fontSize: 14,
      outline: 'none',
      background: '#fff',
    }
  }

  function labelStyle(): React.CSSProperties {
    return {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 700,
      color: '#334155',
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

    if (valor === 'Concluído') {
      return { ...base, background: '#dcfce7', color: '#166534' }
    }

    if (valor === 'Em andamento') {
      return { ...base, background: '#ffedd5', color: '#9a3412' }
    }

    if (valor === 'Pendente') {
      return { ...base, background: '#dbeafe', color: '#1d4ed8' }
    }

    if (valor === 'Cancelado') {
      return { ...base, background: '#e5e7eb', color: '#374151' }
    }

    return { ...base, background: '#e2e8f0', color: '#334155' }
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
            Plano de Ação 5W2H
          </h1>

          <p style={{ marginTop: 10, marginBottom: 0 }}>
            Cadastro, acompanhamento e atualização das ações vinculadas às ocorrências.
          </p>
        </div>

        <div style={{ ...cardStyle(), padding: 24, marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, color: '#0f172a' }}>
              {editingId ? 'Editar plano de ação' : 'Novo plano de ação'}
            </h2>

            {editingId && (
              <button
                onClick={limparFormulario}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#0f172a',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle()}>Ocorrência *</label>
              <select
                value={form.ocorrencia_id}
                onChange={(e) => handleChange('ocorrencia_id', e.target.value)}
                style={inputStyle()}
              >
                <option value="">Selecione</option>
                {ocorrencias.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.numero_ocorrencia || `#${item.id}`} - {item.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle()}>What (O que será feito?) *</label>
              <textarea
                value={form.what_text}
                onChange={(e) => handleChange('what_text', e.target.value)}
                rows={3}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle()}>Why (Por que será feito?) *</label>
              <textarea
                value={form.why_text}
                onChange={(e) => handleChange('why_text', e.target.value)}
                rows={3}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle()}>Where (Onde?)</label>
              <input
                value={form.where_text}
                onChange={(e) => handleChange('where_text', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>When (Quando?)</label>
              <input
                type="date"
                value={form.when_date}
                onChange={(e) => handleChange('when_date', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Who (Quem?) *</label>
              <input
                value={form.who_text}
                onChange={(e) => handleChange('who_text', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>How (Como?)</label>
              <input
                value={form.how_text}
                onChange={(e) => handleChange('how_text', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>How much (Quanto custa?)</label>
              <input
                value={form.how_much_text}
                onChange={(e) => handleChange('how_much_text', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={inputStyle()}
              >
                {statusPlano.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle()}>Responsável</label>
              <input
                value={form.responsavel}
                onChange={(e) => handleChange('responsavel', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Prazo</label>
              <input
                type="date"
                value={form.prazo}
                onChange={(e) => handleChange('prazo', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle()}>Evidência</label>
              <textarea
                value={form.evidencia}
                onChange={(e) => handleChange('evidencia', e.target.value)}
                rows={2}
                style={{ ...inputStyle(), resize: 'vertical' }}
                placeholder="Ex.: protocolo revisado, treinamento realizado, print, ata"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle()}>Observação</label>
              <textarea
                value={form.observacao}
                onChange={(e) => handleChange('observacao', e.target.value)}
                rows={3}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={salvar}
              disabled={saving}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: 'none',
                background: '#0f766e',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                minWidth: 170,
              }}
            >
              {saving ? 'Salvando...' : editingId ? 'Atualizar plano' : 'Salvar plano'}
            </button>

            <button
              onClick={limparFormulario}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#0f172a',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Limpar formulário
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, color: '#0f172a' }}>Filtros</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle()}>Ocorrência</label>
              <select
                value={filtroOcorrencia}
                onChange={(e) => setFiltroOcorrencia(e.target.value)}
                style={inputStyle()}
              >
                <option value="">Todas</option>
                {ocorrencias.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.numero_ocorrencia || `#${item.id}`} - {item.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle()}>Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={inputStyle()}
              >
                <option value="">Todos</option>
                {statusPlano.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, color: '#0f172a' }}>Lista de planos de ação</h2>

            <div
              style={{
                background: '#ecfeff',
                color: '#155e75',
                border: '1px solid #bae6fd',
                padding: '8px 12px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {listaFiltrada.length} registro(s)
            </div>
          </div>

          {loading ? (
            <p style={{ color: '#64748b' }}>Carregando registros...</p>
          ) : listaFiltrada.length === 0 ? (
            <p style={{ color: '#64748b' }}>Nenhum plano de ação encontrado.</p>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {listaFiltrada.map((item) => {
                const ocorrencia = getOcorrenciaInfo(item.ocorrencia_id)

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #dbe7ee',
                      borderRadius: 16,
                      padding: 18,
                      background: '#fcfeff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
                          {ocorrencia?.numero_ocorrencia || `OCORRÊNCIA #${item.ocorrencia_id}`}
                        </div>

                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: 10,
                            color: '#0f172a',
                            fontSize: 18,
                          }}
                        >
                          {ocorrencia?.titulo || 'Ocorrência não encontrada'}
                        </h3>

                        <div style={{ marginBottom: 8 }}>
                          {item.status && (
                            <span style={badgeStyle(item.status)}>
                              {item.status}
                            </span>
                          )}
                          {ocorrencia?.gravidade && (
                            <span style={badgeStyle(ocorrencia.gravidade)}>
                              {ocorrencia.gravidade}
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: 10, color: '#334155', fontSize: 14 }}>
                          <p><strong>What:</strong> {item.what_text || '-'}</p>
                          <p><strong>Why:</strong> {item.why_text || '-'}</p>
                          <p><strong>Who:</strong> {item.who_text || '-'}</p>
                          <p><strong>Where:</strong> {item.where_text || '-'}</p>
                          <p><strong>When:</strong> {item.when_date || '-'}</p>
                          <p><strong>How:</strong> {item.how_text || '-'}</p>
                          <p><strong>How much:</strong> {item.how_much_text || '-'}</p>
                          <p><strong>Responsável:</strong> {item.responsavel || '-'}</p>
                          <p><strong>Prazo:</strong> {item.prazo || '-'}</p>
                          <p><strong>Evidência:</strong> {item.evidencia || '-'}</p>
                          <p><strong>Observação:</strong> {item.observacao || '-'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => editar(item)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#0ea5e9',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => alterarStatus(item.id, 'Em andamento')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#f59e0b',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Iniciar
                        </button>

                        <button
                          onClick={() => alterarStatus(item.id, 'Concluído')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#16a34a',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Concluir
                        </button>

                        <button
                          onClick={() => excluir(item.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#dc2626',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}