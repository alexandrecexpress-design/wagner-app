import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AreaArquivos, Carregando, ListaArquivos, Pagina, useToast } from '../components/ui'
import { Icone } from '../components/Icone'
import { supabase, mensagemErro, type Documento, type Solicitacao } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { servicoPorId, linkWhatsApp, WHATSAPP_TEXTO } from '../lib/servicos'
import { arquivoAceito, data, dataLonga, reais } from '../lib/formato'
import { abrirDocumento, enviarDocumentos } from '../lib/arquivos'

export default function SolicitacaoPagina() {
  const { id } = useParams()
  const { perfil, atualizarAvisos } = useAuth()
  const toast = useToast()
  const [s, setS] = useState<Solicitacao | null | undefined>(undefined)
  const [docs, setDocs] = useState<Documento[]>([])
  const [enviando, setEnviando] = useState('')

  const carregar = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('solicitacoes').select('*').eq('id', id!).maybeSingle(),
      supabase.from('documentos').select('*').eq('solicitacao_id', id!).order('criado_em')
    ])
    setS((a.data as Solicitacao) ?? null)
    setDocs((b.data as Documento[]) ?? [])
  }, [id])

  useEffect(() => {
    carregar()
    // avisos desta solicitação passam a contar como lidos
    supabase.from('avisos').update({ lido_em: new Date().toISOString() }).eq('solicitacao_id', id!).is('lido_em', null)
      .then(() => atualizarAvisos())
  }, [carregar, id, atualizarAvisos])

  if (s === undefined) return <Pagina><Carregando /></Pagina>
  if (s === null || !perfil) return <Pagina><Link className="voltar" to="/solicitacoes">‹ Solicitações</Link><p className="vazio">Solicitação não encontrada.</p></Pagina>

  const sv = servicoPorId(s.servico)
  const pronto = s.status === 'orcamento_enviado'
  const encerrada = s.status === 'encerrada'
  const pendente = s.status === 'pendente_cliente'

  const enviar = async (fs: File[]) => {
    const ok = fs.filter(arquivoAceito)
    if (ok.length < fs.length) toast(`${fs.length - ok.length} arquivo(s) ignorado(s): use PDF, JPG ou PNG até 10 MB`)
    if (!ok.length) return
    setEnviando(`Enviando 0 de ${ok.length}…`)
    const falhas = await enviarDocumentos(s.cliente_id, s.id, ok, n => setEnviando(`Enviando ${n} de ${ok.length}…`))
    setEnviando('')
    toast(falhas.length ? `Não foi possível enviar: ${falhas.join(', ')}` : 'Documentos enviados')
    carregar()
  }
  const abrir = (d: Documento) => abrirDocumento(d.caminho, d.nome).catch(e => toast(mensagemErro(e)))

  const docsEquipe = docs.filter(d => d.da_equipe)
  const docsCliente = docs.filter(d => !d.da_equipe)

  return (
    <Pagina>
      <Link className="voltar" to="/solicitacoes">‹ Solicitações</Link>
      <h1>{sv?.nome ?? s.servico}</h1>
      <p className="muted" style={{ marginTop: 4 }}>Protocolo {s.protocolo}</p>

      <ol className="etapas">
        <li className="feito"><span className="ponto" /><b>Solicitação recebida</b><span>{data(s.criado_em)}</span></li>
        <li className={pronto || encerrada ? 'feito' : 'agora'}><span className="ponto" />
          <b>{pendente ? 'Aguardando você' : 'Em análise pela equipe'}</b>
          <span>{pendente ? 'Veja abaixo o que a equipe pediu e envie pelo app.' : pronto || encerrada ? 'Concluída' : `Prazo: até ${dataLonga(s.prazo)}`}</span>
        </li>
        <li className={pronto ? 'agora' : encerrada ? 'feito' : ''}><span className="ponto" />
          <b>{encerrada ? 'Encerrada' : 'Orçamento pronto'}</b>
          <span>{pronto ? 'Veja os detalhes abaixo.' : encerrada ? '' : 'Você será avisado aqui e por e-mail.'}</span>
        </li>
      </ol>

      {(s.resposta_equipe || s.valor_orcamento != null || docsEquipe.length > 0) && (
        <section className="cartao" style={{ borderColor: 'var(--ouro)', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, color: 'var(--ouro)' }}>{pendente ? 'O que a equipe precisa' : 'Resposta da equipe'}</h2>
          {s.valor_orcamento != null && <p style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 28, margin: '8px 0' }}>{reais(s.valor_orcamento)}</p>}
          {s.resposta_equipe && <p style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{s.resposta_equipe}</p>}
          <ListaArquivos itens={docsEquipe.map(d => ({ nome: d.nome, tamanho: d.tamanho, extra: 'enviado pela equipe' }))} aoAbrir={i => abrir(docsEquipe[i])} />
        </section>
      )}

      <h2 style={{ margin: '8px 0 10px' }}>Seus documentos</h2>
      {docsCliente.length
        ? <ListaArquivos itens={docsCliente.map(d => ({ nome: d.nome, tamanho: d.tamanho, extra: data(d.criado_em) }))} aoAbrir={i => abrir(docsCliente[i])} />
        : <p className="muted">Nenhum documento enviado.</p>}
      {!encerrada && (
        <div style={{ marginTop: 12 }}>
          {enviando ? <div className="carregando" style={{ padding: 20 }}><span className="giro" />{enviando}</div>
            : <AreaArquivos id="mais" aoEscolher={enviar} />}
        </div>
      )}

      <h2 style={{ margin: '24px 0 10px' }}>Suas respostas</h2>
      <div className="cartao"><dl className="dados">
        {s.respostas.map(r => <div key={r.id}><dt>{r.pergunta}</dt><dd>{r.resposta}</dd></div>)}
      </dl></div>

      <a className="botao wa" style={{ marginTop: 18 }} href={linkWhatsApp(`Olá! Sobre a solicitação ${s.protocolo} (${sv?.nome}):`)} target="_blank" rel="noopener noreferrer">
        <Icone nome="whatsapp" />Falar sobre esta solicitação
      </a>
      <p className="nota">WhatsApp do atendimento: {WHATSAPP_TEXTO}</p>
    </Pagina>
  )
}
