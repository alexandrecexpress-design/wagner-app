import { useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase, mensagemErro } from '../lib/supabase'
import { Campo } from '../components/ui'
import { TextoTermo } from '../components/Termo'
import { CADASTRO_VAZIO, validarCadastro, type DadosCadastro, type Erros } from '../lib/validacao'
import { TERMO_VERSAO } from '../lib/termo'
import { soDigitos } from '../lib/formato'

function Capa() {
  return (
    <section className="capa">
      <div className="in">
        <img className="logo" src="/logo.svg" alt="Wagner Regularização Imobiliária" width={363} height={311} />
        <h1>Jurídico e engenharia para regularizar seu imóvel</h1>
        <p>Uma empresa completa: advogados e engenheiros cuidando do seu caso do início ao registro. Orçamento gratuito pelo app.</p>
        <div className="tags"><b>Jurídico</b><b>Engenharia</b><b>Certidões</b></div>
      </div>
    </section>
  )
}

export default function Acesso({ modo }: { modo: 'entrar' | 'cadastro' }) {
  return (
    <>
      <Capa />
      <main className="conteudo">
        <nav className="abas" aria-label="Acesso">
          <NavLink to="/entrar" replace>Entrar</NavLink>
          <NavLink to="/cadastro" replace>Criar conta</NavLink>
        </nav>
        {modo === 'entrar' ? <Entrar /> : <Cadastro />}
      </main>
    </>
  )
}

function Entrar() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [naoConfirmado, setNaoConfirmado] = useState(false)
  const navegar = useNavigate()
  const local = useLocation()

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    if (!email.trim() || !senha) { setErro('Informe e-mail e senha.'); return }
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) { setErro(mensagemErro(error)); setNaoConfirmado(/not confirmed/i.test(error.message)); return }
    navegar((local.state as { de?: string })?.de || '/', { replace: true })
  }

  return (
    <form onSubmit={enviar} noValidate>
      {erro && <div className="alerta" role="alert">{erro}</div>}
      {naoConfirmado && <ReenviarConfirmacao email={email.trim()} />}
      <Campo id="email" rotulo="E-mail" type="email" valor={email} aoMudar={setEmail} autoComplete="email" />
      <Campo id="senha" rotulo="Senha" type="password" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
      <button className="botao" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      <div className="entre">
        <Link className="link" to="/recuperar-senha">Esqueci minha senha</Link>
        <Link className="link" to="/cadastro" replace>Criar conta</Link>
      </div>
    </form>
  )
}

function Cadastro() {
  const [d, setD] = useState<DadosCadastro>(CADASTRO_VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmar, setConfirmar] = useState('')
  const navegar = useNavigate()
  const m = <K extends keyof DadosCadastro>(k: K) => (v: DadosCadastro[K]) => {
    setD(x => ({ ...x, [k]: v }))
    setErros(er => (er[k] ? { ...er, [k]: undefined } : er))
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    const er = validarCadastro(d)
    setErros(er)
    if (Object.keys(er).length) {
      setTimeout(() => (document.querySelector('.ruim input') as HTMLElement | null)?.focus(), 0)
      return
    }
    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: d.email.trim(), password: d.senha,
      options: {
        emailRedirectTo: window.location.origin + '/entrar',
        data: { nome: d.nome.trim().replace(/\s+/g, ' '), celular: soDigitos(d.celular), lgpd: 'true', lgpd_versao: TERMO_VERSAO }
      }
    })
    setEnviando(false)
    if (error) { setErro(mensagemErro(error)); window.scrollTo(0, 0); return }
    if (data.session) navegar('/servicos', { replace: true })
    else { setConfirmar(d.email.trim()); window.scrollTo(0, 0) }
  }

  if (confirmar) {
    return (
      <div className="sucesso" role="status">
        <h2>Confirme seu e-mail</h2>
        <p style={{ marginTop: 8 }}>Enviamos um link para <b>{confirmar}</b>. Abra o e-mail e toque no link para ativar sua conta. Depois é só entrar.</p>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Não chegou? Veja a caixa de spam ou lixo eletrônico. Se ainda assim não aparecer, peça outro:</p>
        <ReenviarConfirmacao email={confirmar} />
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h2>Criar conta</h2>
      <p className="muted" style={{ margin: '4px 0 16px' }}>Leva menos de 1 minuto.</p>
      {erro && <div className="alerta" role="alert">{erro}</div>}
      <Campo id="nome" rotulo="Nome completo" valor={d.nome} aoMudar={m('nome')} erro={erros.nome} autoComplete="name" />
      <Campo id="email" rotulo="E-mail" type="email" valor={d.email} aoMudar={m('email')} erro={erros.email} autoComplete="email" />
      <Campo id="celular" rotulo="WhatsApp ou telefone" valor={d.celular} aoMudar={m('celular')} erro={erros.celular}
        mascara="celular" autoComplete="tel-national" placeholder="(00) 00000-0000" />
      <div className="duas">
        <Campo id="senha" rotulo="Senha (mín. 8 caracteres)" type="password" valor={d.senha} aoMudar={m('senha')} erro={erros.senha} autoComplete="new-password" />
        <Campo id="senha2" rotulo="Confirmar senha" type="password" valor={d.senha2} aoMudar={m('senha2')} erro={erros.senha2} autoComplete="new-password" />
      </div>
      <details className="termo-caixa">
        <summary>Ler o Termo de Consentimento e Privacidade (LGPD)</summary>
        <TextoTermo />
      </details>
      <div className={erros.termo ? 'campo ruim' : 'campo'}>
        <label className="marcar">
          <input type="checkbox" id="termo" checked={d.termo} onChange={e => m('termo')(e.target.checked)} />
          <span>Li e aceito o <b>Termo de Consentimento e Privacidade</b> e autorizo a Wagner Regularização Imobiliária a tratar meus dados pessoais e os documentos que eu enviar para analisar meu caso e prestar os serviços, conforme a Lei nº 13.709/2018 (LGPD).</span>
        </label>
        {erros.termo && <div className="erro">{erros.termo}</div>}
      </div>
      <button className="botao" type="submit" disabled={enviando}>{enviando ? 'Criando conta…' : 'Criar conta'}</button>
    </form>
  )
}

function ReenviarConfirmacao({ email }: { email: string }) {
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok' | string>('')
  const reenviar = async () => {
    setEstado('enviando')
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin + '/entrar' } })
    setEstado(error ? mensagemErro(error) : 'ok')
  }
  if (estado === 'ok') return <p style={{ margin: '10px 0' }}>Novo e-mail enviado para <b>{email}</b>. Pode levar alguns minutos.</p>
  return (
    <div style={{ margin: '10px 0 14px' }}>
      <button type="button" className="botao sec" onClick={reenviar} disabled={estado === 'enviando' || !email}>
        {estado === 'enviando' ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
      </button>
      {estado && estado !== 'enviando' && <div className="erro">{estado}</div>}
      <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>Ainda com problema? Fale com a gente no WhatsApp (11) 94200-4495.</p>
    </div>
  )
}
