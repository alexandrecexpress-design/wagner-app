import { useState } from 'react'
import { Campo } from './ui'
import { UFS, soDigitos } from '../lib/formato'
import type { DadosPessoais, Erros } from '../lib/validacao'

export function FormDadosPessoais({ d, setD, erros, novo }: {
  d: DadosPessoais; setD: (f: (d: DadosPessoais) => DadosPessoais) => void; erros: Erros; novo: boolean
}) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const m = (k: keyof DadosPessoais) => (v: string) => setD(x => ({ ...x, [k]: v }))

  // Preenche o endereço pelo CEP (ViaCEP, serviço público gratuito)
  const aoMudarCep = async (v: string) => {
    m('cep')(v)
    const c = soDigitos(v)
    if (c.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const j = await r.json()
      if (!j.erro) setD(x => ({ ...x, rua: j.logradouro || x.rua, bairro: j.bairro || x.bairro, cidade: j.localidade || x.cidade, uf: j.uf || x.uf }))
    } catch { /* sem internet ou serviço fora: a pessoa digita */ }
    setBuscandoCep(false)
  }

  return (
    <>
      <fieldset className="grupo"><legend>Dados pessoais</legend>
        <Campo id="nome" rotulo="Nome completo" valor={d.nome} aoMudar={m('nome')} erro={erros.nome} autoComplete="name" />
        <div className="duas">
          {novo
            ? <Campo id="cpf" rotulo="CPF" valor={d.cpf} aoMudar={m('cpf')} erro={erros.cpf} mascara="cpf" placeholder="000.000.000-00" />
            : <div className="campo"><label>CPF</label><div className="entrada" style={{ display: 'flex', alignItems: 'center', background: 'var(--sup)' }}>{d.cpf}</div></div>}
          <Campo id="rg" rotulo="RG" valor={d.rg} aoMudar={m('rg')} erro={erros.rg} />
        </div>
        <Campo id="nascimento" rotulo="Data de nascimento" type="date" valor={d.nascimento} aoMudar={m('nascimento')} erro={erros.nascimento} autoComplete="bday" />
      </fieldset>
      <fieldset className="grupo"><legend>Contato</legend>
        <div className="duas">
          {novo
            ? <Campo id="email" rotulo="E-mail" type="email" valor={d.email} aoMudar={m('email')} erro={erros.email} autoComplete="email" />
            : <div className="campo"><label>E-mail</label><div className="entrada" style={{ display: 'flex', alignItems: 'center', background: 'var(--sup)', overflowWrap: 'anywhere' }}>{d.email}</div></div>}
          <Campo id="celular" rotulo="Celular (WhatsApp)" valor={d.celular} aoMudar={m('celular')} erro={erros.celular} mascara="celular" autoComplete="tel-national" placeholder="(00) 00000-0000" />
        </div>
      </fieldset>
      <fieldset className="grupo"><legend>Endereço</legend>
        <div className="duas">
          <Campo id="cep" rotulo={buscandoCep ? 'CEP (buscando…)' : 'CEP'} valor={d.cep} aoMudar={aoMudarCep} erro={erros.cep} mascara="cep" autoComplete="postal-code" placeholder="00000-000" />
          <div />
        </div>
        <div className="rua">
          <Campo id="rua" rotulo="Rua / Avenida" valor={d.rua} aoMudar={m('rua')} erro={erros.rua} autoComplete="address-line1" />
          <Campo id="numero" rotulo="Número" valor={d.numero} aoMudar={m('numero')} erro={erros.numero} />
        </div>
        <div className="duas">
          <Campo id="complemento" rotulo="Complemento" opcional valor={d.complemento} aoMudar={m('complemento')} autoComplete="address-line2" />
          <Campo id="bairro" rotulo="Bairro" valor={d.bairro} aoMudar={m('bairro')} erro={erros.bairro} />
        </div>
        <div className="cidade">
          <Campo id="cidade" rotulo="Cidade" valor={d.cidade} aoMudar={m('cidade')} erro={erros.cidade} autoComplete="address-level2" />
          <div className={erros.uf ? 'campo ruim' : 'campo'}>
            <label htmlFor="uf">UF</label>
            <select id="uf" className="entrada" value={d.uf} onChange={e => m('uf')(e.target.value)}>
              <option value="">--</option>
              {UFS.map(u => <option key={u}>{u}</option>)}
            </select>
            {erros.uf && <div className="erro">{erros.uf}</div>}
          </div>
        </div>
      </fieldset>
    </>
  )
}
