import { useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase, mensagemErro } from '../lib/supabase'
import { Campo } from '../components/ui'
import { FormDadosPessoais } from '../components/DadosPessoais'
import { DADOS_VAZIOS, paraBanco, validarDados, type DadosPessoais, type Erros } from '../lib/validacao'

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
  const navegar = useNavigate()
  const local = useLocation()

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    if (!email.trim() || !senha) { setErro('Informe e-mail e senha.'); return }
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) { setErro(mensagemErro(error)); return }
    navegar((local.state as { de?: string })?.de || '/', { replace: true })
  }

  return (
    <form onSubmit={enviar} noValidate>
      {erro && <div className="alerta" role="alert">{erro}</div>}
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
  const [d, setD] = useState<DadosPessoais>(DADOS_VAZIOS)
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [lgpd, setLgpd] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmar, setConfirmar] = useState('')
  const navegar = useNavigate()

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    const er = validarDados(d, true)
    if (senha.length < 8) er.senha = 'Mínimo 8 caracteres'
    if (senha !== senha2) er.senha2 = 'As senhas não conferem'
    if (!lgpd) er.lgpd = 'Necessário para continuar'
    setErros(er)
    if (Object.keys(er).length) {
      setTimeout(() => (document.querySelector('.ruim input, .ruim select') as HTMLElement | null)?.focus(), 0)
      return
    }
    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: d.email.trim(), password: senha,
      options: { emailRedirectTo: window.location.origin + '/entrar', data: paraBanco(d) }
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
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Não chegou? Veja a caixa de spam ou lixo eletrônico.</p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h2>Cadastro</h2>
      <p className="muted" style={{ marginTop: 4 }}>Leva cerca de 2 minutos. Usamos seus dados apenas para analisar e contratar os serviços.</p>
      {erro && <div className="alerta" role="alert" style={{ marginTop: 14 }}>{erro}</div>}
      <FormDadosPessoais d={d} setD={setD} erros={erros} novo />
      <fieldset className="grupo"><legend>Acesso</legend>
        <div className="duas">
          <Campo id="senha" rotulo="Senha (mín. 8 caracteres)" type="password" valor={senha} aoMudar={setSenha} erro={erros.senha} autoComplete="new-password" />
          <Campo id="senha2" rotulo="Confirmar senha" type="password" valor={senha2} aoMudar={setSenha2} erro={erros.senha2} autoComplete="new-password" />
        </div>
        <div className={erros.lgpd ? 'campo ruim' : 'campo'}>
          <label className="marcar">
            <input type="checkbox" checked={lgpd} onChange={e => setLgpd(e.target.checked)} />
            <span>Autorizo a Wagner Regularização Imobiliária a usar meus dados e documentos para analisar meu caso e prestar os serviços contratados, conforme a LGPD.</span>
          </label>
          {erros.lgpd && <div className="erro">{erros.lgpd}</div>}
        </div>
      </fieldset>
      <button className="botao" type="submit" disabled={enviando}>{enviando ? 'Criando conta…' : 'Criar conta'}</button>
    </form>
  )
}
