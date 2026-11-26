import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type InputHTMLAttributes } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icone } from './Icone'
import { mascaras, tamanho, type Mascara } from '../lib/formato'
import { useAuth } from '../lib/auth'
import { linkWhatsApp } from '../lib/servicos'

// ---------- Aviso rápido (toast) ----------
const ToastCtx = createContext<(m: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const t = useRef<number>()
  const mostrar = useCallback((m: string) => {
    setMsg(m); window.clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(null), 3200)
  }, [])
  return <ToastCtx.Provider value={mostrar}>{children}{msg && <div className="toast" role="status">{msg}</div>}</ToastCtx.Provider>
}

// ---------- Marca ----------
export function Marca() {
  return (
    <span className="marca">
      <img src="/marca.svg" alt="" width={58} height={36} />
      <span>Wagner<em>Regularização Imobiliária</em></span>
    </span>
  )
}

export function Topo({ largo }: { largo?: boolean }) {
  const { perfil } = useAuth()
  return (
    <header className="topo">
      <div className={largo ? 'in largo' : 'in'}>
        <Link to="/servicos" aria-label="Início"><Marca /></Link>
        {perfil && <small>Olá, {perfil.nome.split(' ')[0]}</small>}
      </div>
    </header>
  )
}

export function Menu() {
  const { naoLidos, perfil } = useAuth()
  return (
    <nav className="menu" aria-label="Menu">
      <div className="in">
        <NavLink to="/servicos"><Icone nome="grade" />Serviços</NavLink>
        <NavLink to="/solicitacoes"><Icone nome="lista" />
          <span>Solicitações{naoLidos > 0 && <span className="badge" aria-label={`${naoLidos} avisos novos`}>{naoLidos}</span>}</span>
        </NavLink>
        <a href={linkWhatsApp('Olá! Tenho uma dúvida sobre os serviços da Wagner.')} target="_blank" rel="noopener noreferrer">
          <Icone nome="whatsapp" />Dúvidas
        </a>
        {perfil?.equipe
          ? <NavLink to="/painel"><Icone nome="painel" />Painel</NavLink>
          : <NavLink to="/perfil"><Icone nome="usuario" />Perfil</NavLink>}
      </div>
    </nav>
  )
}

export function Pagina({ children, largo }: { children: ReactNode; largo?: boolean }) {
  return <><Topo largo={largo} /><main className={largo ? 'conteudo largo' : 'conteudo'}>{children}</main><Menu /></>
}

export function Carregando() {
  return <div className="carregando" role="status"><span className="giro" />Carregando…</div>
}

// ---------- Campos ----------
interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string; rotulo: string; valor: string; aoMudar: (v: string) => void
  erro?: string; mascara?: Mascara; opcional?: boolean
}
export function Campo({ id, rotulo, valor, aoMudar, erro, mascara, opcional, type = 'text', ...resto }: CampoProps) {
  const [ver, setVer] = useState(false)
  const senha = type === 'password'
  return (
    <div className={erro ? 'campo ruim' : 'campo'}>
      <label htmlFor={id}>{rotulo}{opcional && <span className="opc"> (opcional)</span>}</label>
      <div className={senha ? 'senha' : undefined}>
        <input id={id} name={id} className="entrada" type={senha && ver ? 'text' : type} value={valor}
          inputMode={mascara ? 'numeric' : resto.inputMode}
          aria-invalid={erro ? true : undefined} aria-describedby={erro ? id + '-erro' : undefined}
          onChange={e => aoMudar(mascara ? mascaras[mascara](e.target.value) : e.target.value)} {...resto} />
        {senha && <button type="button" onClick={() => setVer(!ver)}>{ver ? 'Ocultar' : 'Mostrar'}</button>}
      </div>
      {erro && <div className="erro" id={id + '-erro'}>{erro}</div>}
    </div>
  )
}

export function Opcoes({ nome, rotulo, opcoes, valor, aoMudar, varias, erro, opcional }: {
  nome: string; rotulo: string; opcoes: string[]; valor: string; aoMudar: (v: string) => void
  varias?: boolean; erro?: string; opcional?: boolean
}) {
  const marcados = varias ? valor.split(', ').filter(Boolean) : [valor]
  const alternar = (o: string) => {
    if (!varias) return aoMudar(o)
    const novo = marcados.includes(o) ? marcados.filter(x => x !== o) : [...marcados, o]
    aoMudar(opcoes.filter(x => novo.includes(x)).join(', '))
  }
  return (
    <fieldset className={erro ? 'campo ruim' : 'campo'}>
      <legend className="pergunta">{rotulo}{opcional && <span className="opc"> (opcional)</span>}{varias && <span className="opc"> (pode marcar mais de uma)</span>}</legend>
      <div className="chips">
        {opcoes.map(o => (
          <label key={o}>
            <input type={varias ? 'checkbox' : 'radio'} name={nome} value={o} checked={marcados.includes(o)} onChange={() => alternar(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
      {erro && <div className="erro">{erro}</div>}
    </fieldset>
  )
}

// ---------- Envio de arquivos ----------
export function AreaArquivos({ id, aoEscolher, desativado }: { id: string; aoEscolher: (f: File[]) => void; desativado?: boolean }) {
  const [sobre, setSobre] = useState(false)
  return (
    <label htmlFor={id} className={sobre ? 'soltar sobre' : 'soltar'}
      onDragOver={e => { e.preventDefault(); setSobre(true) }} onDragLeave={() => setSobre(false)}
      onDrop={e => { e.preventDefault(); setSobre(false); if (!desativado) aoEscolher([...e.dataTransfer.files]) }}>
      <Icone nome="enviar" />
      <b>Toque para escolher arquivos</b>
      <span>ou arraste para cá. PDF, JPG ou PNG, até 10 MB cada.</span>
      <input type="file" id={id} multiple hidden disabled={desativado}
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,application/pdf,image/*"
        onChange={e => { aoEscolher([...(e.target.files ?? [])]); e.target.value = '' }} />
    </label>
  )
}

export function ListaArquivos({ itens, aoRemover, aoAbrir }: {
  itens: { nome: string; tamanho?: number | null; extra?: string }[]
  aoRemover?: (i: number) => void; aoAbrir?: (i: number) => void
}) {
  if (!itens.length) return null
  return (
    <ul className="arquivos">
      {itens.map((a, i) => (
        <li key={i}>
          <span className="ico pequeno"><Icone nome="documento" /></span>
          <span className="nm">{a.nome}<br /><small>{[tamanho(a.tamanho), a.extra].filter(Boolean).join(' · ')}</small></span>
          {aoRemover && <button className="x" type="button" onClick={() => aoRemover(i)} aria-label={`Remover ${a.nome}`}>×</button>}
          {aoAbrir && <button className="x" type="button" onClick={() => aoAbrir(i)} aria-label={`Baixar ${a.nome}`}><Icone nome="baixar" /></button>}
        </li>
      ))}
    </ul>
  )
}
