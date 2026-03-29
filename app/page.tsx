'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import SistemaPage from './sistema/page'

type Perfil = {
  id: string
  nome: string
  email: string
  perfil: 'qualidade' | 'lider' | 'colaborador' | 'diretoria'
  setor: string | null
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [perfilCadastro, setPerfilCadastro] = useState<
    'qualidade' | 'lider' | 'colaborador' | 'diretoria'
  >('colaborador')
  const [setorCadastro, setSetorCadastro] = useState('')

  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [loading, setLoading] = useState(true)
  const [entrando, setEntrando] = useState(false)

  const [session, setSession] = useState<any>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null)

      if (data.session?.user) {
        await carregarPerfil(data.session.user.id)
      }

      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (session?.user) {
        await carregarPerfil(session.user.id)
      } else {
        setPerfil(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, setor')
      .eq('id', userId)
      .single()

    if (error) {
      console.log('Erro ao carregar perfil:', error)
      return
    }

    setPerfil(data)
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setEntrando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setEntrando(false)

    if (error) {
      alert(error.message)
    }
  }

  async function handleCadastro(e: FormEvent) {
    e.preventDefault()
    setEntrando(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          perfil: perfilCadastro,
          setor:
            perfilCadastro === 'colaborador' || perfilCadastro === 'lider'
              ? setorCadastro
              : null,
        },
      },
    })

    setEntrando(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Cadastro realizado com sucesso!')
    setModo('login')
    setNome('')
    setEmail('')
    setPassword('')
    setPerfilCadastro('colaborador')
    setSetorCadastro('')
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <main style={{ padding: 24 }}>Carregando sistema...</main>
  }

  if (session && perfil) {
    return <SistemaPage perfil={perfil} onLogout={sair} />
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eef7f9 0%, #f8fbfd 100%)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          borderRadius: 20,
          padding: 28,
          border: '1px solid #d8e4ea',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div
          style={{
            marginBottom: 20,
            padding: 20,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #0f766e 0%, #164e63 100%)',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>
            Gestão Hospitalar
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: 24 }}>
            Sistema de Ocorrências
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setModo('login')}
            style={modo === 'login' ? botaoAtivo : botaoInativo}
          >
            Entrar
          </button>

          <button
            onClick={() => setModo('cadastro')}
            style={modo === 'cadastro' ? botaoAtivo : botaoInativo}
          >
            Cadastrar
          </button>
        </div>

        {modo === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              style={campo}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              style={campo}
            />

            <button disabled={entrando} style={botaoPrincipal}>
              {entrando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastro} style={{ display: 'grid', gap: 12 }}>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              style={campo}
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              style={campo}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              style={campo}
            />

            <select
              value={perfilCadastro}
              onChange={(e) =>
                setPerfilCadastro(
                  e.target.value as 'qualidade' | 'lider' | 'colaborador' | 'diretoria'
                )
              }
              style={campo}
            >
              <option value="colaborador">Colaborador</option>
              <option value="lider">Líder</option>
              <option value="qualidade">Qualidade</option>
              <option value="diretoria">Diretoria</option>
            </select>

            {(perfilCadastro === 'colaborador' || perfilCadastro === 'lider') && (
              <input
                value={setorCadastro}
                onChange={(e) => setSetorCadastro(e.target.value)}
                placeholder="Setor"
                style={campo}
              />
            )}

            <button disabled={entrando} style={botaoPrincipal}>
              {entrando ? 'Salvando...' : 'Cadastrar'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

const campo: React.CSSProperties = {
  padding: '12px',
  borderRadius: 10,
  border: '1px solid #ccc',
}

const botaoPrincipal: React.CSSProperties = {
  padding: '12px',
  borderRadius: 10,
  border: 'none',
  background: '#0f766e',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const botaoAtivo: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 10,
  border: 'none',
  background: '#0f766e',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const botaoInativo: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 10,
  border: 'none',
  background: '#e2e8f0',
  color: '#0f172a',
  fontWeight: 'bold',
  cursor: 'pointer',
}