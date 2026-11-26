import { Link } from 'react-router-dom'
import { Pagina } from '../components/ui'
import { Icone } from '../components/Icone'
import { SERVICOS } from '../lib/servicos'

export default function Servicos() {
  return (
    <Pagina>
      <h1>Serviços</h1>
      <p className="muted" style={{ margin: '6px 0 16px' }}>Escolha o serviço para ver detalhes e pedir um orçamento gratuito.</p>
      <div className="duo">
        <div><span className="ico"><Icone nome="balanca" /></span><span><b>Jurídico</b><span>Usucapião, inventário, holding, escrituras e registros</span></span></div>
        <div><span className="ico"><Icone nome="regua" /></span><span><b>Engenharia</b><span>Plantas, levantamento topográfico, memorial descritivo e habite-se</span></span></div>
      </div>
      {SERVICOS.map(s => (
        <Link key={s.id} className="servico" to={`/servicos/${s.id}`}>
          <span className="ico"><Icone nome={s.icone} /></span>
          <span><h3>{s.nome}</h3><p>{s.resumo}</p><span className="area">{s.area}</span></span>
          <span className="seta" aria-hidden="true">›</span>
        </Link>
      ))}
    </Pagina>
  )
}
