import { soDigitos } from './formato'

export type Erros = Partial<Record<string, string>>
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())

// ---------- Cadastro (nome, e-mail, WhatsApp/telefone, senha, termo) ----------
export interface DadosCadastro { nome: string; email: string; celular: string; senha: string; senha2: string; termo: boolean }
export const CADASTRO_VAZIO: DadosCadastro = { nome: '', email: '', celular: '', senha: '', senha2: '', termo: false }

export function validarCadastro(d: DadosCadastro): Erros {
  const e: Erros = {}
  const nome = d.nome.trim()
  if (!nome) e.nome = 'Preencha seu nome completo'
  else if (nome.split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome'
  if (!d.email.trim()) e.email = 'Preencha seu e-mail'
  else if (!emailOk(d.email)) e.email = 'E-mail inválido'
  const tel = soDigitos(d.celular)
  if (!tel) e.celular = 'Preencha seu WhatsApp ou telefone'
  else if (tel.length < 10) e.celular = 'Número incompleto (inclua o DDD)'
  if (d.senha.length < 8) e.senha = 'Mínimo 8 caracteres'
  if (d.senha !== d.senha2) e.senha2 = 'As senhas não conferem'
  if (!d.termo) e.termo = 'Para criar a conta, é preciso aceitar o termo'
  return e
}

// ---------- Perfil (só nome e telefone podem ser alterados; e-mail é o do login) ----------
export interface DadosPerfil { nome: string; celular: string }

export function validarPerfil(d: DadosPerfil): Erros {
  const e: Erros = {}
  if (!d.nome.trim()) e.nome = 'Preencha este campo'
  else if (d.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome'
  const tel = soDigitos(d.celular)
  if (!tel) e.celular = 'Preencha este campo'
  else if (tel.length < 10) e.celular = 'Número incompleto (inclua o DDD)'
  return e
}

export const perfilParaBanco = (d: DadosPerfil) => ({ nome: d.nome.trim().replace(/\s+/g, ' '), celular: soDigitos(d.celular) })
