import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Carregando, Pagina } from '../components/ui'
import { supabase, STATUS, mensagemErro, type Aviso, type Solicitacao } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { servicoPorId } from '../lib/servicos'
import { data, dataHora } from '../lib/formato'

export function progressoPrazo(s: Solicitacao) {
  const ini = new Date(s.atualizado_em > s.criado_em && s.status === 'em_analise' ? s.atualizado_em : s.criado_em).getTime()
  const fim = new Date(s.prazo).getTime()
  const p = (Date.now() - ini) / Math.max(1, fim - ini)
  return Math.min(1, Math.max(0.06, p))
}
export const atrasada = (s: Solicitacao) => s.status === 'em_analise' && new Date(s.prazo).getTime() < Date.now()

export default function Solicitacoes() {
  const { perfil, atualizarAvisos } = useAuth()
  const [params, setParams] = useSearchParams()
  const filtro = params.get('servico')
  const [lista, setLista] = useState<Solicitacao[] | null>(null)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!perfil) return
    let q = supabase.from('solicitacoes').select('*').eq('cliente_id', perfil.id).order('criado_em', { ascending: false })
    if (filtro) q = q.eq('servico', filtro)
    q.then(({ data, error }) => { if (error) setErro(mensagemErro(error)); setLista((data as Solicitacao[]) ?? []) })
    supabase.from('avisos').select('*').is('lido_em', null).order('criado_em', { ascending: false }).limit(10)
      .then(({ data }) => setAvisos((data as Aviso[]) ?? []))
  }, [perfil, filtro])

  const dispensar = async () => {
    const ids = avisos.map(a => a.id)
    setAvisos([])
    await supabase.from('avisos').update({ lido_em: new Date().toISOString() }).in('id', ids)
    atualizarAvisos()
  }

  return (
    <Pagina>
      <h1>Solicitações</h1>
      {filtro
        ? <p style={{ marginTop: 8 }}>Mostrando: <b>{servicoPorId(filtro)?.nome}</b> <button className="link" onClick={() => setParams({})}>Ver todas</button></p>
        : <p className="muted" style={{ margin: '6px 0 16px' }}>Acompanhe a análise de cada pedido.</p>}

      {avisos.length > 0 && (
        <section aria-label="Avisos novos" style={{ margin: '12px 0 18px' }}>
          <div className="entre"><h2 style={{ fontSize: 18 }}>Novidades</h2><button className="link" onClick={dispensar}>Marcar como lidas</button></div>
          {avisos.map(a => (
            <Link key={a.id} className="aviso" to={a.solicitacao_id ? `/solicitacoes/${a.solicitacao_id}` : '#'}>
              <b>{a.titulo}</b><span>{a.mensagem}</span><br /><span style={{ fontSize: 13 }}>{dataHora(a.criado_em)}</span>
            </Link>
          ))}
        </section>
      )}

      {erro && <div className="alerta">{erro}</div>}
      {lista === null ? <Carregando /> : lista.length === 0
        ? <div className="vazio"><p>Nenhuma solicitação ainda.</p><Link className="botao" style={{ marginTop: 14 }} to="/servicos">Pedir orçamento gratuito</Link></div>
        : lista.map(s => {
          const st = atrasada(s) ? { texto: 'Em análise', classe: 'p-analise' } : STATUS[s.status]
          return (
            <Link key={s.id} className="pedido" to={`/solicitacoes/${s.id}`}>
              <div className="entre" style={{ alignItems: 'baseline' }}>
                <h3>{servicoPorId(s.servico)?.nome ?? s.servico}</h3>
                <span className={'pill ' + st.classe}>{st.texto}</span>
              </div>
              <small>{s.protocolo} · enviada em {data(s.criado_em)}</small>
              {s.status === 'em_analise' && <>
                <div className="barra"><i style={{ width: `${progressoPrazo(s) * 100}%` }} /></div>
                <small>Resposta até {data(s.prazo)}</small>
              </>}
              {s.status === 'pendente_cliente' && <><br /><small style={{ color: '#ffb38a' }}>A equipe precisa de algo seu. Toque para ver.</small></>}
            </Link>
          )
        })}
    </Pagina>
  )
}
