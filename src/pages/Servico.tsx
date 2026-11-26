import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Pagina } from '../components/ui'
import { Icone } from '../components/Icone'
import { servicoPorId, linkWhatsApp, WHATSAPP_TEXTO } from '../lib/servicos'
import { supabase } from '../lib/supabase'

export default function ServicoPagina() {
  const { id } = useParams()
  const s = servicoPorId(id)
  const [qtd, setQtd] = useState<number | null>(null)

  useEffect(() => {
    if (!s) return
    supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('servico', s.id)
      .then(({ count }) => setQtd(count ?? 0))
  }, [s])

  if (!s) return <Navigate to="/servicos" replace />
  return (
    <Pagina>
      <Link className="voltar" to="/servicos">‹ Serviços</Link>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '6px 0 12px' }}>
        <span className="ico"><Icone nome={s.icone} /></span>
        <div><h1>{s.nome}</h1><span className="area">{s.area}</span></div>
      </div>
      <p>{s.descricao}</p>
      <h2 style={{ margin: '24px 0 12px' }}>O que você quer fazer?</h2>
      <Link className="opcao" to={`/servicos/${s.id}/orcamento`}>
        <span className="ico"><Icone nome="orcamento" /></span>
        <span><b>Orçamento gratuito</b><span>Responda algumas perguntas e envie documentos, se quiser. Análise em até 3 dias úteis.</span></span>
      </Link>
      <Link className="opcao" to={`/solicitacoes?servico=${s.id}`}>
        <span className="ico"><Icone nome="relogio" /></span>
        <span><b>Acompanhar solicitação</b><span>{qtd === null ? 'Veja o andamento dos seus pedidos.' : qtd ? `Você tem ${qtd} ${qtd > 1 ? 'solicitações' : 'solicitação'} deste serviço.` : 'Nenhuma solicitação deste serviço ainda.'}</span></span>
      </Link>
      <a className="opcao wa" href={linkWhatsApp(`Olá! Tenho uma dúvida sobre ${s.nome}.`)} target="_blank" rel="noopener noreferrer">
        <span className="ico"><Icone nome="whatsapp" /></span>
        <span><b>Dúvidas</b><span>Fale com o atendimento no WhatsApp {WHATSAPP_TEXTO}</span></span>
      </a>
    </Pagina>
  )
}
