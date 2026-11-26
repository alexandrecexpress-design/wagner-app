import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Perfil } from './supabase'

interface Auth {
  sessao: Session | null
  perfil: Perfil | null
  carregando: boolean
  perfilCarregando: boolean
  recuperandoSenha: boolean
  naoLidos: number
  recarregarPerfil: () => Promise<void>
  atualizarAvisos: () => Promise<void>
  sair: () => Promise<void>
  fimRecuperacao: () => void
}

const Ctx = createContext<Auth>(null as unknown as Auth)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperandoSenha, setRecuperando] = useState(false)
  const [naoLidos, setNaoLidos] = useState(0)
  const [perfilCarregando, setPerfilCarregando] = useState(false)

  const carregarPerfil = useCallback(async (uid?: string) => {
    if (!uid) { setPerfil(null); return }
    setPerfilCarregando(true)
    const { data } = await supabase.from('perfis').select('*').eq('id', uid).maybeSingle()
    setPerfil((data as Perfil) ?? null)
    setPerfilCarregando(false)
  }, [])

  const atualizarAvisos = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setNaoLidos(0); return }
    const { count } = await supabase.from('avisos').select('id', { count: 'exact', head: true }).is('lido_em', null)
    setNaoLidos(count ?? 0)
  }, [])

  useEffect(() => {
    let ativo = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return
      setSessao(data.session)
      await carregarPerfil(data.session?.user.id)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSessao(s)
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') setPerfilCarregando(true)
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT' || evento === 'USER_UPDATED') {
        // fora do callback, como recomenda o Supabase
        setTimeout(() => { carregarPerfil(s?.user.id) }, 0)
      }
    })
    return () => { ativo = false; sub.subscription.unsubscribe() }
  }, [carregarPerfil])

  useEffect(() => {
    atualizarAvisos()
    const aoVoltar = () => { if (document.visibilityState === 'visible') atualizarAvisos() }
    document.addEventListener('visibilitychange', aoVoltar)
    const t = setInterval(atualizarAvisos, 60000)
    return () => { document.removeEventListener('visibilitychange', aoVoltar); clearInterval(t) }
  }, [sessao, atualizarAvisos])

  const valor: Auth = {
    sessao, perfil, carregando, perfilCarregando, recuperandoSenha, naoLidos, atualizarAvisos,
    recarregarPerfil: () => carregarPerfil(sessao?.user.id),
    sair: async () => { await supabase.auth.signOut(); setPerfil(null) },
    fimRecuperacao: () => setRecuperando(false)
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}
