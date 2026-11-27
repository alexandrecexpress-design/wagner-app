import { supabase, type Resposta, type Solicitacao } from './supabase'
import { enviarDocumentos } from './arquivos'

/** Cria a solicitação e envia os documentos. Exige pessoa logada. */
export async function enviarPedido(clienteId: string, servico: string, respostas: Resposta[], arquivos: File[],
  aoProgredir?: (msg: string) => void): Promise<{ sol: Solicitacao; falhas: string[] }> {
  aoProgredir?.('Enviando respostas…')
  const { data, error } = await supabase.from('solicitacoes')
    .insert({ servico, respostas, cliente_id: clienteId }).select().single()
  if (error || !data) throw error ?? new Error('sem retorno')
  let falhas: string[] = []
  if (arquivos.length) {
    aoProgredir?.(`Enviando documentos (0 de ${arquivos.length})…`)
    falhas = await enviarDocumentos(clienteId, data.id, arquivos, n => aoProgredir?.(`Enviando documentos (${n} de ${arquivos.length})…`))
  }
  return { sol: data as Solicitacao, falhas }
}

// ---------- Rascunho guardado no aparelho ----------
// Usado quando a conta precisa confirmar o e-mail antes de entrar: o pedido (com os arquivos)
// fica guardado neste aparelho e é enviado sozinho assim que a pessoa entrar.
export interface Rascunho { servico: string; respostas: Resposta[]; arquivos: File[]; email: string; criado: number }

const BANCO = 'wagner', LOJA = 'rascunho', CHAVE = 'pedido'
function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, falha) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA)
    r.onsuccess = () => ok(r.result)
    r.onerror = () => falha(r.error)
  })
}
async function operar<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const db = await abrir()
    return await new Promise<T>((ok, falha) => {
      const req = f(db.transaction(LOJA, modo).objectStore(LOJA))
      req.onsuccess = () => ok(req.result as T)
      req.onerror = () => falha(req.error)
    })
  } catch { return undefined }
}
export const guardarRascunho = (r: Rascunho) => operar<void>('readwrite', s => s.put(r, CHAVE))
export const apagarRascunho = () => operar<void>('readwrite', s => s.delete(CHAVE))
export async function lerRascunho(): Promise<Rascunho | undefined> {
  const r = await operar<Rascunho>('readonly', s => s.get(CHAVE))
  // descarta rascunhos com mais de 30 dias
  if (r && Date.now() - r.criado > 30 * 864e5) { await apagarRascunho(); return undefined }
  return r
}
