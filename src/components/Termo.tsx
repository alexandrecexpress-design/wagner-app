import { Link } from 'react-router-dom'
import { TERMO, TERMO_VERSAO } from '../lib/termo'
import { dataSimples } from '../lib/formato'
import { Marca } from './ui'

export function TextoTermo() {
  return (
    <div className="termo">
      {TERMO.map(t => <section key={t.titulo}><h3>{t.titulo}</h3><p>{t.texto}</p></section>)}
      <p className="muted" style={{ fontSize: 13 }}>Versão de {dataSimples(TERMO_VERSAO)}.</p>
    </div>
  )
}

export function PaginaTermo() {
  return (
    <>
      <header className="topo"><div className="in"><Link to="/"><Marca /></Link></div></header>
      <main className="conteudo">
        <Link className="voltar" to="/cadastro">‹ Voltar</Link>
        <h1>Termo de consentimento e privacidade (LGPD)</h1>
        <div style={{ marginTop: 16 }}><TextoTermo /></div>
      </main>
    </>
  )
}
