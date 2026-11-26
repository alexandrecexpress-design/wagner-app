import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, mensagemErro } from '../lib/supabase'
import { Campo, Marca } from '../components/ui'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setErro('Informe um e-mail válido.'); return }
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/nova-senha' })
    setEnviando(false)
    if (error) setErro(mensagemErro(error)); else setOk(true)
  }

  return (
    <>
      <header className="topo"><div className="in"><Link to="/entrar"><Marca /></Link></div></header>
      <main className="conteudo">
        <Link className="voltar" to="/entrar">‹ Entrar</Link>
        <h1>Recuperar senha</h1>
        {ok
          ? <div className="sucesso" style={{ marginTop: 16 }} role="status">Se houver uma conta com <b>{email}</b>, você vai receber um e-mail com o link para criar uma nova senha.</div>
          : <form onSubmit={enviar} noValidate style={{ marginTop: 16 }}>
              <p className="muted" style={{ marginBottom: 14 }}>Informe o e-mail do cadastro. Enviaremos um link para você criar uma nova senha.</p>
              {erro && <div className="alerta" role="alert">{erro}</div>}
              <Campo id="email" rotulo="E-mail" type="email" valor={email} aoMudar={setEmail} autoComplete="email" />
              <button className="botao" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar link'}</button>
            </form>}
      </main>
    </>
  )
}
