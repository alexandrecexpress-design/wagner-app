import { Link } from 'react-router-dom'
import { Icone } from '../components/Icone'
import { SERVICOS, linkWhatsApp, WHATSAPP_TEXTO } from '../lib/servicos'
import { EMPRESA } from '../lib/termo'

// Página de entrada (divulgação): é o que a pessoa vê ao abrir o link do app.
export default function Inicio() {
  return (
    <div className="inicio">
      <section className="vitrine">
        <div className="in">
          <span className="selo-gratis">Orçamento 100% gratuito</span>
          <img className="logo" src="/logo.svg" alt="Wagner Regularização Imobiliária" width={363} height={311} />
          <h1>Seu imóvel regularizado, do jeito certo</h1>
          <p>Jurídico e engenharia na mesma empresa. Responda algumas perguntas sobre o seu caso e receba a análise em até <b>3 dias úteis</b>.</p>
          <Link className="botao grande" to="/servicos">Quero meu orçamento gratuito</Link>
          <div className="garantias">
            <span><Icone nome="orcamento" />Sem compromisso</span>
            <span><Icone nome="relogio" />Resposta em até 3 dias úteis</span>
            <span><Icone nome="balanca" />Advogados e engenheiros</span>
          </div>
        </div>
      </section>

      <main className="conteudo inicio-corpo">
        <h2>Escolha o serviço</h2>
        <p className="muted" style={{ margin: '4px 0 14px' }}>Toque no que você precisa para ver como funciona e pedir o orçamento.</p>
        {SERVICOS.map(s => (
          <Link key={s.id} className="servico" to={`/servicos/${s.id}`}>
            <span className="ico"><Icone nome={s.icone} /></span>
            <span><h3>{s.nome}</h3><p>{s.resumo}</p><span className="area">{s.area}</span></span>
            <span className="seta" aria-hidden="true">›</span>
          </Link>
        ))}

        <h2 style={{ marginTop: 28 }}>Como funciona</h2>
        <ol className="como">
          <li><b>Escolha o serviço</b><span>Usucapião, inventário, holding, regularização ou certidões.</span></li>
          <li><b>Conte sobre o seu caso</b><span>Responda as perguntas e, se quiser, envie fotos ou documentos.</span></li>
          <li><b>Receba o orçamento</b><span>Nossa equipe analisa e responde em até 3 dias úteis. Você acompanha tudo pelo app.</span></li>
        </ol>

        <Link className="botao grande" to="/servicos" style={{ marginTop: 8 }}>Começar meu orçamento gratuito</Link>
        <a className="botao wa" style={{ marginTop: 10 }} href={linkWhatsApp('Olá! Vim pelo app e quero saber mais sobre os serviços da Wagner.')} target="_blank" rel="noopener noreferrer">
          <Icone nome="whatsapp" />Prefiro falar no WhatsApp
        </a>

        <div className="ja-cliente">
          <span>Já fez um pedido?</span>
          <Link className="link" to="/entrar">Entrar para acompanhar</Link>
        </div>

        <footer className="rodape">
          <b>{EMPRESA.nome}</b><br />
          CNPJ {EMPRESA.cnpj}<br />
          {EMPRESA.endereco}<br />
          WhatsApp {WHATSAPP_TEXTO} · <Link to="/termo">Privacidade (LGPD)</Link>
        </footer>
      </main>
    </div>
  )
}
