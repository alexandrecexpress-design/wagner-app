import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Campo, Pagina, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { supabase, mensagemErro } from '../lib/supabase'
import { mascaras } from '../lib/formato'
import { perfilParaBanco, validarPerfil, type DadosPerfil, type Erros } from '../lib/validacao'

export default function PerfilPagina() {
  const { perfil, recarregarPerfil, sair } = useAuth()
  const toast = useToast()
  const [d, setD] = useState<DadosPerfil | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  if (!perfil) return null

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!d) return
    const er = validarPerfil(d); setErros(er)
    if (Object.keys(er).length) return
    setSalvando(true)
    const { error } = await supabase.from('perfis').update(perfilParaBanco(d)).eq('id', perfil.id)
    setSalvando(false)
    if (error) { toast(mensagemErro(error)); return }
    await recarregarPerfil(); setD(null); toast('Dados atualizados')
  }

  return (
    <Pagina>
      <h1>Meu perfil</h1>
      {d
        ? <form onSubmit={salvar} noValidate style={{ marginTop: 16 }}>
            <Campo id="nome" rotulo="Nome completo" valor={d.nome} aoMudar={v => setD({ ...d, nome: v })} erro={erros.nome} autoComplete="name" />
            <Campo id="celular" rotulo="WhatsApp ou telefone" valor={d.celular} aoMudar={v => setD({ ...d, celular: v })} erro={erros.celular} mascara="celular" autoComplete="tel-national" />
            <p className="nota" style={{ textAlign: 'left', marginTop: 0, marginBottom: 14 }}>Para mudar o e-mail, fale com a gente pelo WhatsApp.</p>
            <div className="linha">
              <button type="button" className="botao sec" onClick={() => setD(null)}>Cancelar</button>
              <button className="botao" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        : <>
            <div className="cartao" style={{ marginTop: 16 }}><dl className="dados">
              <div><dt>Nome</dt><dd>{perfil.nome}</dd></div>
              <div><dt>E-mail</dt><dd>{perfil.email}</dd></div>
              <div><dt>WhatsApp ou telefone</dt><dd>{mascaras.celular(perfil.celular)}</dd></div>
            </dl></div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <button className="botao sec" onClick={() => { setD({ nome: perfil.nome, celular: mascaras.celular(perfil.celular) }); setErros({}) }}>Editar dados</button>
              <Link className="botao sec" to="/recuperar-senha">Trocar senha</Link>
              <Link className="botao sec" to="/termo">Termo de privacidade (LGPD)</Link>
              <button className="botao sec" onClick={sair}>Sair</button>
            </div>
          </>}
    </Pagina>
  )
}
