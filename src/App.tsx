import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { configurado } from './lib/supabase'
import { Carregando, useToast } from './components/ui'
import Inicio from './pages/Inicio'
import { apagarRascunho, enviarPedido, lerRascunho } from './lib/pedido'
import { servicoPorId } from './lib/servicos'
import Acesso from './pages/Acesso'
import RecuperarSenha from './pages/RecuperarSenha'
import NovaSenha from './pages/NovaSenha'
import Servicos from './pages/Servicos'
import ServicoPagina from './pages/Servico'
import Orcamento from './pages/Orcamento'
import Solicitacoes from './pages/Solicitacoes'
import SolicitacaoPagina from './pages/Solicitacao'
import PerfilPagina from './pages/Perfil'
import { PaginaTermo } from './components/Termo'
import Painel from './painel/Painel'
import PainelSolicitacao from './painel/PainelSolicitacao'

function Protegida({ children, equipe }: { children: ReactNode; equipe?: boolean }) {
  const { sessao, perfil, carregando, perfilCarregando, sair } = useAuth()
  const local = useLocation()
  if (carregando || (sessao && !perfil && perfilCarregando)) return <Carregando />
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />
  if (!perfil) {
    return (
      <main className="conteudo">
        <h1>Cadastro não encontrado</h1>
        <p className="muted" style={{ margin: '10px 0 18px' }}>Sua conta existe, mas o cadastro não foi concluído. Fale com a gente pelo WhatsApp ou crie a conta de novo.</p>
        <button className="botao" onClick={sair}>Sair</button>
      </main>
    )
  }
  if (equipe && !perfil.equipe) return <Navigate to="/servicos" replace />
  return <>{children}</>
}

// Pedido guardado no aparelho (quando o cadastro exigiu confirmar o e-mail): envia ao entrar.
function useEnviarRascunho() {
  const { perfil } = useAuth()
  const navegar = useNavigate()
  const toast = useToast()
  const rodando = useRef(false)
  useEffect(() => {
    if (!perfil || perfil.equipe || rodando.current) return
    rodando.current = true
    ;(async () => {
      const r = await lerRascunho()
      if (!r || r.email.toLowerCase() !== perfil.email.toLowerCase()) { rodando.current = false; return }
      try {
        const { sol } = await enviarPedido(perfil.id, r.servico, r.respostas, r.arquivos)
        await apagarRascunho()
        toast(`Seu pedido de ${servicoPorId(r.servico)?.nome ?? 'orçamento'} foi enviado. Protocolo ${sol.protocolo}.`)
        navegar(`/solicitacoes/${sol.id}`)
      } catch { rodando.current = false }
    })()
  }, [perfil, navegar, toast])
}

export default function App() {
  const { sessao, perfil, carregando, recuperandoSenha } = useAuth()
  const navegar = useNavigate()
  useEnviarRascunho()

  useEffect(() => { if (recuperandoSenha) navegar('/nova-senha') }, [recuperandoSenha, navegar])

  if (!configurado) {
    return (
      <main className="conteudo">
        <h1>Falta configurar o Supabase</h1>
        <p className="muted" style={{ marginTop: 10 }}>Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja o arquivo LEIA-ME.md).</p>
      </main>
    )
  }

  const inicio = sessao ? (perfil?.equipe ? '/painel' : '/servicos') : '/entrar'
  return (
    <Routes>
      <Route path="/" element={carregando ? <Carregando /> : sessao ? <Protegida><Navigate to={inicio} replace /></Protegida> : <Inicio />} />
      <Route path="/entrar" element={sessao && perfil ? <Navigate to={inicio} replace /> : <Acesso modo="entrar" />} />
      <Route path="/cadastro" element={sessao && perfil ? <Navigate to={inicio} replace /> : <Acesso modo="cadastro" />} />
      <Route path="/termo" element={<PaginaTermo />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/servicos/:id" element={<ServicoPagina />} />
      <Route path="/servicos/:id/orcamento" element={<Orcamento />} />
      <Route path="/solicitacoes" element={<Protegida><Solicitacoes /></Protegida>} />
      <Route path="/solicitacoes/:id" element={<Protegida><SolicitacaoPagina /></Protegida>} />
      <Route path="/perfil" element={<Protegida><PerfilPagina /></Protegida>} />
      <Route path="/painel" element={<Protegida equipe><Painel /></Protegida>} />
      <Route path="/painel/:id" element={<Protegida equipe><PainelSolicitacao /></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
