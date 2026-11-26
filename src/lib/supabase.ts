import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configurado = Boolean(url && chave)

export const supabase = createClient(url || 'http://localhost', chave || 'sem-chave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

export type Status = 'em_analise' | 'pendente_cliente' | 'orcamento_enviado' | 'encerrada'

export interface Perfil {
  id: string; nome: string; cpf: string; rg: string; nascimento: string; email: string; celular: string
  cep: string; rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string
  equipe: boolean
}
export interface Resposta { id: string; pergunta: string; resposta: string }
export interface Solicitacao {
  id: string; protocolo: string; cliente_id: string; servico: string; respostas: Resposta[]
  status: Status; prazo: string; resposta_equipe: string | null; valor_orcamento: number | null
  criado_em: string; atualizado_em: string
}
export interface Documento {
  id: string; solicitacao_id: string; caminho: string; nome: string; tamanho: number | null
  tipo: string | null; da_equipe: boolean; criado_em: string
}
export interface Aviso {
  id: string; solicitacao_id: string | null; titulo: string; mensagem: string; lido_em: string | null; criado_em: string
}

export const STATUS: Record<Status, { texto: string; classe: string }> = {
  em_analise: { texto: 'Em análise', classe: 'p-analise' },
  pendente_cliente: { texto: 'Aguardando você', classe: 'p-pendente' },
  orcamento_enviado: { texto: 'Orçamento pronto', classe: 'p-pronto' },
  encerrada: { texto: 'Encerrada', classe: 'p-encerrada' }
}

// Traduz os erros mais comuns do Supabase
export function mensagemErro(e: unknown): string {
  const m = (e as { message?: string })?.message || String(e)
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.'
  if (/User already registered/i.test(m)) return 'Este e-mail já tem cadastro. Entre ou recupere a senha.'
  if (/Database error saving new user/i.test(m)) return 'Não foi possível criar a conta. Se este CPF já tem cadastro, entre ou recupere a senha.'
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão. Verifique sua internet e tente de novo.'
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para fazer isso.'
  if (/exceeded the maximum allowed size|Payload too large/i.test(m)) return 'Arquivo maior que 10 MB.'
  if (/mime type/i.test(m)) return 'Tipo de arquivo não aceito. Use PDF, JPG ou PNG.'
  return 'Algo deu errado. Tente de novo em instantes.'
}
