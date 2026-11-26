import { useState, type FormEvent } from 'react'
import { Pagina, useToast } from '../components/ui'
import { FormDadosPessoais } from '../components/DadosPessoais'
import { useAuth } from '../lib/auth'
import { supabase, mensagemErro, type Perfil } from '../lib/supabase'
import { cpfOculto, dataSimples, mascaras } from '../lib/formato'
import { paraBanco, validarDados, type DadosPessoais, type Erros } from '../lib/validacao'
import { Link } from 'react-router-dom'

const paraForm = (p: Perfil): DadosPessoais => ({
  nome: p.nome, cpf: mascaras.cpf(p.cpf), rg: p.rg, nascimento: p.nascimento, email: p.email,
  celular: mascaras.celular(p.celular), cep: mascaras.cep(p.cep), rua: p.rua, numero: p.numero,
  complemento: p.complemento ?? '', bairro: p.bairro, cidade: p.cidade, uf: p.uf
})

export default function PerfilPagina() {
  const { perfil, recarregarPerfil, sair } = useAuth()
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [d, setD] = useState<DadosPessoais | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  if (!perfil) return null

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!d) return
    const er = validarDados(d, false); setErros(er)
    if (Object.keys(er).length) return
    setSalvando(true)
    const { cpf: _c, ...campos } = paraBanco(d)
    void _c
    const { error } = await supabase.from('perfis').update(campos).eq('id', perfil.id)
    setSalvando(false)
    if (error) { toast(mensagemErro(error)); return }
    await recarregarPerfil(); setEditando(false); toast('Dados atualizados')
  }

  const p = perfil
  return (
    <Pagina>
      <h1>Meu perfil</h1>
      {editando && d
        ? <form onSubmit={salvar} noValidate>
            <FormDadosPessoais d={d} setD={f => setD(x => f(x!))} erros={erros} novo={false} />
            <p className="nota" style={{ textAlign: 'left', marginTop: 0, marginBottom: 14 }}>Para mudar CPF ou e-mail, fale com a gente pelo WhatsApp.</p>
            <div className="linha">
              <button type="button" className="botao sec" onClick={() => setEditando(false)}>Cancelar</button>
              <button className="botao" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        : <>
            <div className="cartao" style={{ marginTop: 16 }}><dl className="dados">
              {[['Nome', p.nome], ['CPF', cpfOculto(p.cpf)], ['RG', p.rg], ['Nascimento', dataSimples(p.nascimento)],
                ['E-mail', p.email], ['Celular', mascaras.celular(p.celular)],
                ['Endereço', `${p.rua}, ${p.numero}${p.complemento ? ' - ' + p.complemento : ''}, ${p.bairro}, ${p.cidade}/${p.uf}, CEP ${mascaras.cep(p.cep)}`]]
                .map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl></div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <button className="botao sec" onClick={() => { setD(paraForm(p)); setErros({}); setEditando(true) }}>Editar dados</button>
              <Link className="botao sec" to="/recuperar-senha">Trocar senha</Link>
              <button className="botao sec" onClick={sair}>Sair</button>
            </div>
          </>}
    </Pagina>
  )
}
