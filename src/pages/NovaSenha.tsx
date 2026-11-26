import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, mensagemErro } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Campo, Carregando, Marca, useToast } from '../components/ui'

export default function NovaSenha() {
  const { sessao, carregando, fimRecuperacao } = useAuth()
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()
  const toast = useToast()

  const enviar = async (e: FormEvent) => {
    e.preventDefault(); setErro('')
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (senha !== senha2) { setErro('As senhas não conferem.'); return }
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) { setErro(mensagemErro(error)); return }
    fimRecuperacao(); toast('Senha alterada.'); navegar('/', { replace: true })
  }

  return (
    <>
      <header className="topo"><div className="in"><Marca /></div></header>
      <main className="conteudo">
        <h1>Criar nova senha</h1>
        {carregando ? <Carregando /> : !sessao
          ? <div className="alerta" style={{ marginTop: 16 }}>Este link expirou ou já foi usado. <Link to="/recuperar-senha">Peça um novo link</Link>.</div>
          : <form onSubmit={enviar} noValidate style={{ marginTop: 16 }}>
              {erro && <div className="alerta" role="alert">{erro}</div>}
              <Campo id="senha" rotulo="Nova senha (mín. 8 caracteres)" type="password" valor={senha} aoMudar={setSenha} autoComplete="new-password" />
              <Campo id="senha2" rotulo="Confirmar nova senha" type="password" valor={senha2} aoMudar={setSenha2} autoComplete="new-password" />
              <button className="botao" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar nova senha'}</button>
            </form>}
      </main>
    </>
  )
}
