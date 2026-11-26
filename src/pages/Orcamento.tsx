import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AreaArquivos, Campo, ListaArquivos, Opcoes, Pagina, useToast } from '../components/ui'
import { servicoPorId, type Pergunta } from '../lib/servicos'
import { supabase, mensagemErro, type Solicitacao } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { arquivoAceito, dataLonga, dataSimples } from '../lib/formato'
import { enviarDocumentos } from '../lib/arquivos'
import { Icone } from '../components/Icone'

export default function Orcamento() {
  const { id } = useParams()
  const s = servicoPorId(id)
  const { perfil } = useAuth()
  const navegar = useNavigate()
  const toast = useToast()
  const [passo, setPasso] = useState(0)
  const [resp, setResp] = useState<Record<string, string>>({})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [arquivos, setArquivos] = useState<File[]>([])
  const [prazo, setPrazo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState('')
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState<{ sol: Solicitacao; falhas: string[] } | null>(null)

  useEffect(() => {
    if (passo === 2) supabase.rpc('previsao_prazo').then(({ data }) => setPrazo((data as string) ?? null))
    window.scrollTo(0, 0)
  }, [passo])

  if (!s || !perfil) return <Navigate to="/servicos" replace />

  const respostaDe = (p: Pergunta) => (resp[p.id] ?? '').trim()

  const avancarPerguntas = (e: FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    s.perguntas.forEach(p => { if (!p.opcional && !respostaDe(p)) er[p.id] = 'Responda esta pergunta' })
    setErros(er)
    if (Object.keys(er).length) {
      setTimeout(() => document.querySelector('.ruim')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0)
      return
    }
    setPasso(1)
  }

  const adicionar = (fs: File[]) => {
    const ok = fs.filter(arquivoAceito)
    if (ok.length < fs.length) toast(`${fs.length - ok.length} arquivo(s) ignorado(s): use PDF, JPG ou PNG até 10 MB`)
    setArquivos(a => [...a, ...ok].slice(0, 20))
  }

  const enviar = async () => {
    setErro(''); setEnviando('Enviando respostas…')
    const respostas = s.perguntas.filter(p => respostaDe(p)).map(p => ({
      id: p.id, pergunta: p.texto, resposta: p.tipo === 'data' ? dataSimples(respostaDe(p)) : respostaDe(p)
    }))
    const { data, error } = await supabase.from('solicitacoes')
      .insert({ servico: s.id, respostas, cliente_id: perfil.id }).select().single()
    if (error || !data) { setEnviando(''); setErro(mensagemErro(error)); return }
    let falhas: string[] = []
    if (arquivos.length) {
      setEnviando(`Enviando documentos (0 de ${arquivos.length})…`)
      falhas = await enviarDocumentos(perfil.id, data.id, arquivos, n => setEnviando(`Enviando documentos (${n} de ${arquivos.length})…`))
    }
    setEnviando('')
    setFeito({ sol: data as Solicitacao, falhas })
    window.scrollTo(0, 0)
  }

  if (feito) {
    const { sol, falhas } = feito
    const enviados = arquivos.length - falhas.length
    return (
      <Pagina>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginTop: 12 }}>Solicitação enviada</h1>
          <p className="muted" style={{ marginTop: 8 }}>Recebemos suas respostas{enviados > 0 ? ` e ${enviados} documento${enviados > 1 ? 's' : ''}` : ''}.</p>
          <div className="carimbo">
            <small>Protocolo</small><div className="num">{sol.protocolo}</div>
            <small style={{ marginTop: 12 }}>Resposta até</small><div className="prazo">{dataLonga(sol.prazo)}</div>
          </div>
          {falhas.length > 0 && <div className="alerta" style={{ textAlign: 'left' }}>Não conseguimos enviar: {falhas.join(', ')}. Você pode tentar de novo na página da solicitação.</div>}
          <p style={{ marginBottom: 18 }}>Você será avisado no app e por e-mail quando o orçamento estiver pronto.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="botao" onClick={() => navegar(`/solicitacoes/${sol.id}`)}>Acompanhar solicitação</button>
            <Link className="botao sec" to="/servicos">Voltar aos serviços</Link>
          </div>
        </div>
      </Pagina>
    )
  }

  const titulos = ['Perguntas', 'Documentos', 'Revisar e enviar']
  return (
    <Pagina>
      {passo === 0
        ? <Link className="voltar" to={`/servicos/${s.id}`}>‹ {s.nome}</Link>
        : <button className="voltar" onClick={() => setPasso(passo - 1)}>‹ Voltar</button>}
      <h1>Orçamento gratuito</h1>
      <p className="muted" style={{ marginTop: 4 }}>{s.nome}</p>
      <div className="passos">{titulos.map((t, i) => <div key={t} className={i === passo ? 'atual' : i < passo ? 'feito' : ''}>{t}</div>)}</div>

      {passo === 0 && (
        <form onSubmit={avancarPerguntas} noValidate>
          {s.perguntas.map(p => {
            const v = resp[p.id] ?? ''
            const mudar = (x: string) => { setResp(r => ({ ...r, [p.id]: x })); setErros(e => ({ ...e, [p.id]: '' })) }
            if (p.tipo === 'opcoes' || p.tipo === 'varias') {
              return <Opcoes key={p.id} nome={p.id} rotulo={p.texto} opcoes={p.opcoes!} valor={v} aoMudar={mudar}
                varias={p.tipo === 'varias'} erro={erros[p.id]} opcional={p.opcional} />
            }
            if (p.tipo === 'longo') {
              return (
                <div key={p.id} className={erros[p.id] ? 'campo ruim' : 'campo'}>
                  <label htmlFor={'p-' + p.id}>{p.texto}{p.opcional && <span className="opc"> (opcional)</span>}</label>
                  <textarea id={'p-' + p.id} className="entrada" value={v} maxLength={3000} onChange={e => mudar(e.target.value)} />
                </div>
              )
            }
            return <Campo key={p.id} id={'p-' + p.id} rotulo={p.texto} valor={v} aoMudar={mudar} erro={erros[p.id]} opcional={p.opcional}
              type={p.tipo === 'numero' ? 'number' : p.tipo === 'data' ? 'date' : 'text'} min={p.tipo === 'numero' ? 0 : undefined} maxLength={200} />
          })}
          <button className="botao" type="submit">Continuar</button>
        </form>
      )}

      {passo === 1 && (
        <>
          <div className="dica"><b>Envio opcional.</b> Documentos ajudam a gente a fazer um orçamento mais preciso. Exemplos úteis:
            <ul>{s.documentos.map(d => <li key={d}>{d}</li>)}</ul>
          </div>
          <AreaArquivos id="arquivos" aoEscolher={adicionar} />
          <ListaArquivos itens={arquivos.map(f => ({ nome: f.name, tamanho: f.size }))} aoRemover={i => setArquivos(a => a.filter((_, k) => k !== i))} />
          <div className="linha" style={{ marginTop: 16 }}>
            <button className="botao sec" onClick={() => setPasso(0)}>Voltar</button>
            <button className="botao" onClick={() => setPasso(2)}>{arquivos.length ? 'Continuar' : 'Pular e continuar'}</button>
          </div>
        </>
      )}

      {passo === 2 && (
        <>
          {erro && <div className="alerta" role="alert">{erro}</div>}
          <div className="cartao">
            <dl className="dados">
              {s.perguntas.filter(p => respostaDe(p)).map(p => (
                <div key={p.id}><dt>{p.texto}</dt><dd>{p.tipo === 'data' ? dataSimples(respostaDe(p)) : respostaDe(p)}</dd></div>
              ))}
              <div><dt>Documentos</dt><dd>{arquivos.length ? arquivos.map(f => f.name).join(', ') : 'Nenhum enviado'}</dd></div>
            </dl>
          </div>
          <p style={{ margin: '16px 0' }}>
            <Icone nome="relogio" className="inline" /> Prazo de análise: {prazo ? <>até <b>{dataLonga(prazo)}</b> (3 dias úteis)</> : '3 dias úteis'}.
          </p>
          <div className="linha">
            <button className="botao sec" onClick={() => setPasso(1)} disabled={!!enviando}>Voltar</button>
            <button className="botao" onClick={enviar} disabled={!!enviando}>{enviando || 'Enviar solicitação'}</button>
          </div>
        </>
      )}
    </Pagina>
  )
}
