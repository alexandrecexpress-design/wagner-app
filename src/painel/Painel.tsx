import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carregando, Pagina } from '../components/ui'
import { supabase, STATUS, mensagemErro, type Solicitacao, type Status } from '../lib/supabase'
import { SERVICOS, servicoPorId } from '../lib/servicos'
import { data, mascaras } from '../lib/formato'
import { atrasada } from '../pages/Solicitacoes'
import { useAuth } from '../lib/auth'

type Linha = Solicitacao & { perfis: { nome: string; celular: string; email: string } | null }
type Filtro = Status | 'atrasadas' | 'todas'

export default function Painel() {
  const { sair, perfil } = useAuth()
  const navegar = useNavigate()
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('em_analise')
  const [servico, setServico] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    supabase.from('solicitacoes').select('*, perfis(nome, celular, email)').order('criado_em', { ascending: false }).limit(1000)
      .then(({ data, error }) => { if (error) setErro(mensagemErro(error)); setLinhas((data as Linha[]) ?? []) })
  }, [])

  const contagem = useMemo(() => {
    const c: Record<string, number> = { todas: 0, atrasadas: 0, em_analise: 0, pendente_cliente: 0, orcamento_enviado: 0, encerrada: 0 }
    for (const l of linhas ?? []) { c.todas++; c[l.status]++; if (atrasada(l)) c.atrasadas++ }
    return c
  }, [linhas])

  const visiveis = useMemo(() => {
    const b = busca.trim().toLowerCase()
    const bDig = b.replace(/\D/g, '')
    return (linhas ?? []).filter(l =>
      (filtro === 'todas' || (filtro === 'atrasadas' ? atrasada(l) : l.status === filtro)) &&
      (!servico || l.servico === servico) &&
      (!b || l.protocolo.toLowerCase().includes(b) || (l.perfis?.nome ?? '').toLowerCase().includes(b) || (l.perfis?.email ?? '').toLowerCase().includes(b) ||
        (bDig.length >= 3 && ((l.perfis?.celular ?? '').includes(bDig))))
    ).sort((a, b) => filtro === 'em_analise' || filtro === 'atrasadas' ? a.prazo.localeCompare(b.prazo) : b.criado_em.localeCompare(a.criado_em))
  }, [linhas, filtro, servico, busca])

  const cards: [Filtro, string][] = [['em_analise', 'Em análise'], ['atrasadas', 'Prazo vencido'], ['pendente_cliente', 'Aguardando cliente'],
    ['orcamento_enviado', 'Orçamento enviado'], ['encerrada', 'Encerradas'], ['todas', 'Todas']]

  return (
    <Pagina largo>
      <div className="entre">
        <h1>Painel da equipe</h1>
        <span className="muted" style={{ fontSize: 14 }}>{perfil?.nome} · <button className="link" onClick={sair}>Sair</button></span>
      </div>
      <div className="contadores">
        {cards.map(([k, t]) => (
          <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            <b style={k === 'atrasadas' && contagem.atrasadas ? { color: '#ff9b8f' } : undefined}>{contagem[k] ?? 0}</b><span>{t}</span>
          </button>
        ))}
      </div>
      <div className="filtros">
        <div className="campo"><label htmlFor="busca">Buscar</label>
          <input id="busca" className="entrada" placeholder="Protocolo, nome, e-mail ou telefone" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <div className="campo" style={{ flex: '0 1 240px' }}><label htmlFor="fserv">Serviço</label>
          <select id="fserv" className="entrada" value={servico} onChange={e => setServico(e.target.value)}>
            <option value="">Todos</option>{SERVICOS.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select></div>
      </div>
      {erro && <div className="alerta">{erro}</div>}
      {linhas === null ? <Carregando /> : visiveis.length === 0 ? <p className="vazio">Nenhuma solicitação neste filtro.</p> : (
        <div className="tabela-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Status</th><th>Serviço</th><th>Protocolo</th><th>Prazo</th><th>Telefone</th></tr></thead>
            <tbody>
              {visiveis.map(l => {
                const venc = atrasada(l)
                return (
                  <tr key={l.id} onClick={() => navegar(`/painel/${l.id}`)} tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') navegar(`/painel/${l.id}`) }}>
                    <td><b>{l.perfis?.nome ?? '—'}</b><br /><span className="muted" style={{ fontSize: 13 }}>{data(l.criado_em)}</span></td>
                    <td><span className={'pill ' + (venc ? 'p-atrasado' : STATUS[l.status].classe)}>{venc ? 'Prazo vencido' : STATUS[l.status].texto}</span></td>
                    <td>{servicoPorId(l.servico)?.nome}</td>
                    <td className="esconde"><span className="nw">{l.protocolo}</span></td>
                    <td><span className="nw">{l.status === 'em_analise' ? data(l.prazo) : '—'}</span></td>
                    <td className="esconde"><span className="nw">{l.perfis ? mascaras.celular(l.perfis.celular) : ''}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Pagina>
  )
}
