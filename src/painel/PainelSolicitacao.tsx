import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AreaArquivos, Carregando, ListaArquivos, Pagina, useToast } from '../components/ui'
import { Icone } from '../components/Icone'
import { supabase, STATUS, mensagemErro, type Documento, type Perfil, type Solicitacao, type Status } from '../lib/supabase'
import { servicoPorId, linkWhatsApp } from '../lib/servicos'
import { arquivoAceito, data, dataHora, dataLonga, mascaras, reais } from '../lib/formato'
import { abrirDocumento, enviarDocumentos } from '../lib/arquivos'
import { atrasada } from '../pages/Solicitacoes'

export default function PainelSolicitacao() {
  const { id } = useParams()
  const toast = useToast()
  const [s, setS] = useState<Solicitacao | null | undefined>(undefined)
  const [cli, setCli] = useState<Perfil | null>(null)
  const [docs, setDocs] = useState<Documento[]>([])
  const [status, setStatus] = useState<Status>('em_analise')
  const [resposta, setResposta] = useState('')
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState('')

  const carregar = useCallback(async () => {
    const { data: sol } = await supabase.from('solicitacoes').select('*').eq('id', id!).maybeSingle()
    setS((sol as Solicitacao) ?? null)
    if (!sol) return
    const x = sol as Solicitacao
    setStatus(x.status); setResposta(x.resposta_equipe ?? '')
    setValor(x.valor_orcamento != null ? String(x.valor_orcamento).replace('.', ',') : '')
    const [p, d] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', x.cliente_id).maybeSingle(),
      supabase.from('documentos').select('*').eq('solicitacao_id', x.id).order('criado_em')
    ])
    setCli((p.data as Perfil) ?? null); setDocs((d.data as Documento[]) ?? [])
  }, [id])
  useEffect(() => { carregar() }, [carregar])

  if (s === undefined) return <Pagina largo><Carregando /></Pagina>
  if (s === null) return <Pagina largo><Link className="voltar" to="/painel">‹ Painel</Link><p className="vazio">Solicitação não encontrada.</p></Pagina>

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    const v = valor.trim() ? Number(valor.replace(/\./g, '').replace(',', '.')) : null
    if (v !== null && (isNaN(v) || v < 0)) { toast('Valor inválido'); return }
    if (status === 'pendente_cliente' && !resposta.trim()) { toast('Escreva para o cliente o que está faltando.'); return }
    setSalvando(true)
    const { error } = await supabase.from('solicitacoes')
      .update({ status, resposta_equipe: resposta.trim() || null, valor_orcamento: v }).eq('id', s.id)
    setSalvando(false)
    if (error) { toast(mensagemErro(error)); return }
    toast('Salvo. O cliente foi avisado no app e por e-mail.')
    carregar()
  }

  const anexar = async (fs: File[]) => {
    const ok = fs.filter(arquivoAceito)
    if (!ok.length) { toast('Use PDF, JPG ou PNG até 10 MB'); return }
    setEnviando('Enviando…')
    const falhas = await enviarDocumentos(s.cliente_id, s.id, ok)
    setEnviando('')
    toast(falhas.length ? `Falhou: ${falhas.join(', ')}` : 'Arquivo anexado. O cliente verá na solicitação.')
    carregar()
  }
  const abrir = (d: Documento) => abrirDocumento(d.caminho, d.nome).catch(err => toast(mensagemErro(err)))
  const sv = servicoPorId(s.servico)
  const docsCli = docs.filter(d => !d.da_equipe), docsEq = docs.filter(d => d.da_equipe)
  const venc = atrasada(s)

  return (
    <Pagina largo>
      <Link className="voltar" to="/painel">‹ Painel</Link>
      <div className="entre" style={{ marginBottom: 16 }}>
        <div><h1>{sv?.nome} · {cli?.nome ?? ''}</h1>
          <p className="muted" style={{ marginTop: 4 }}>{s.protocolo} · recebida em {dataHora(s.criado_em)}</p></div>
        <span className={'pill ' + (venc ? 'p-atrasado' : STATUS[s.status].classe)}>{venc ? 'Prazo vencido' : STATUS[s.status].texto}</span>
      </div>

      <div className="colunas">
        <div>
          <section className="cartao" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Respostas do cliente</h2>
            <dl className="dados">{s.respostas.map(r => <div key={r.id}><dt>{r.pergunta}</dt><dd>{r.resposta}</dd></div>)}</dl>
          </section>
          <section className="cartao" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Documentos do cliente ({docsCli.length})</h2>
            {docsCli.length ? <ListaArquivos itens={docsCli.map(d => ({ nome: d.nome, tamanho: d.tamanho, extra: data(d.criado_em) }))} aoAbrir={i => abrir(docsCli[i])} />
              : <p className="muted" style={{ marginTop: 8 }}>Nenhum documento enviado.</p>}
          </section>
          {cli && (
            <section className="cartao">
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Cliente</h2>
              <dl className="dados">
                <div><dt>Nome</dt><dd>{cli.nome}</dd></div>
                <div><dt>E-mail</dt><dd>{cli.email}</dd></div>
                <div><dt>WhatsApp ou telefone</dt><dd>{mascaras.celular(cli.celular)}</dd></div>
              </dl>
              <a className="botao wa" style={{ marginTop: 12 }} target="_blank" rel="noopener noreferrer"
                href={linkWhatsApp(`Olá, ${cli.nome.split(' ')[0]}! Aqui é da Wagner Regularização Imobiliária, sobre a solicitação ${s.protocolo} (${sv?.nome}).`, '55' + cli.celular)}>
                <Icone nome="whatsapp" />Chamar cliente no WhatsApp
              </a>
            </section>
          )}
        </div>

        <form className="cartao" onSubmit={salvar} style={{ borderColor: 'var(--ouro)', position: 'sticky', top: 12 }}>
          <h2 style={{ fontSize: 18 }}>Responder</h2>
          {s.status === 'em_analise' && <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Prazo: {dataLonga(s.prazo)}</p>}
          <div className="campo" style={{ marginTop: 12 }}>
            <label htmlFor="status">Status</label>
            <select id="status" className="entrada" value={status} onChange={e => setStatus(e.target.value as Status)}>
              <option value="em_analise">Em análise</option>
              <option value="pendente_cliente">Aguardando cliente (pedir documento ou informação)</option>
              <option value="orcamento_enviado">Orçamento enviado</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="valor">Valor do orçamento (R$)</label>
            <input id="valor" className="entrada" inputMode="decimal" placeholder="Ex.: 3.500,00" value={valor} onChange={e => setValor(e.target.value.replace(/[^\d.,]/g, ''))} />
            {valor && !isNaN(Number(valor.replace(/\./g, '').replace(',', '.'))) && <small className="muted">{reais(Number(valor.replace(/\./g, '').replace(',', '.')))}</small>}
          </div>
          <div className="campo">
            <label htmlFor="resp">Mensagem para o cliente</label>
            <textarea id="resp" className="entrada" style={{ minHeight: 150 }} maxLength={4000} value={resposta} onChange={e => setResposta(e.target.value)}
              placeholder={status === 'pendente_cliente' ? 'Ex.: Envie o carnê de IPTU dos últimos 5 anos.' : 'Ex.: Usucapião extrajudicial, inclui planta, memorial e registro. Prazo estimado de 8 a 12 meses.'} />
          </div>
          <button className="botao" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar e avisar cliente'}</button>
          <h3 style={{ margin: '20px 0 8px' }}>Anexar para o cliente</h3>
          <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Proposta em PDF, contrato ou outro arquivo. O cliente vê na página da solicitação.</p>
          {enviando ? <div className="carregando" style={{ padding: 16 }}><span className="giro" />{enviando}</div> : <AreaArquivos id="anexo" aoEscolher={anexar} />}
          <ListaArquivos itens={docsEq.map(d => ({ nome: d.nome, tamanho: d.tamanho, extra: data(d.criado_em) }))} aoAbrir={i => abrir(docsEq[i])} />
        </form>
      </div>
    </Pagina>
  )
}
