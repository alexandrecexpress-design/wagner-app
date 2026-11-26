import { cpfValido, idade, soDigitos } from './formato'

export interface DadosPessoais {
  nome: string; cpf: string; rg: string; nascimento: string; email: string; celular: string
  cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string
}
export const DADOS_VAZIOS: DadosPessoais = {
  nome: '', cpf: '', rg: '', nascimento: '', email: '', celular: '', cep: '', rua: '', numero: '',
  complemento: '', bairro: '', cidade: '', uf: ''
}
export type Erros = Partial<Record<string, string>>

export function validarDados(d: DadosPessoais, novo: boolean): Erros {
  const e: Erros = {}
  const obrig: (keyof DadosPessoais)[] = ['nome', 'rg', 'nascimento', 'celular', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf']
  if (novo) obrig.push('cpf', 'email')
  for (const k of obrig) if (!String(d[k] ?? '').trim()) e[k] = 'Preencha este campo'
  if (d.nome.trim() && d.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome'
  if (novo && d.cpf && !cpfValido(d.cpf)) e.cpf = 'CPF inválido'
  if (novo && d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) e.email = 'E-mail inválido'
  if (d.celular && soDigitos(d.celular).length < 10) e.celular = 'Número incompleto'
  if (d.cep && soDigitos(d.cep).length !== 8) e.cep = 'CEP deve ter 8 números'
  if (d.nascimento) {
    const a = idade(d.nascimento)
    if (isNaN(a) || a > 120) e.nascimento = 'Data inválida'
    else if (a < 18) e.nascimento = 'É preciso ter 18 anos ou mais'
  }
  return e
}

/** Formato que vai para o banco (só números em CPF, CEP e celular). */
export const paraBanco = (d: DadosPessoais) => ({
  nome: d.nome.trim().replace(/\s+/g, ' '), cpf: soDigitos(d.cpf), rg: d.rg.trim(), nascimento: d.nascimento,
  celular: soDigitos(d.celular), cep: soDigitos(d.cep), rua: d.rua.trim(), numero: d.numero.trim(),
  complemento: d.complemento.trim(), bairro: d.bairro.trim(), cidade: d.cidade.trim(), uf: d.uf.toUpperCase()
})
