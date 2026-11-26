import { supabase } from './supabase'
import { arquivoAceito, nomeSeguro } from './formato'

const BUCKET = 'documentos'

/** Envia arquivos para a pasta privada da solicitação e registra cada um. Retorna os nomes que falharam. */
export async function enviarDocumentos(clienteId: string, solicitacaoId: string, arquivos: File[],
  aoProgredir?: (feitos: number) => void): Promise<string[]> {
  const falhas: string[] = []
  let feitos = 0
  for (const f of arquivos) {
    if (!arquivoAceito(f)) { falhas.push(f.name); continue }
    const caminho = `${clienteId}/${solicitacaoId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${nomeSeguro(f.name)}`
    const up = await supabase.storage.from(BUCKET).upload(caminho, f, { contentType: f.type || undefined, upsert: false })
    if (up.error) { falhas.push(f.name); continue }
    const { error } = await supabase.from('documentos').insert({
      solicitacao_id: solicitacaoId, caminho, nome: f.name, tamanho: f.size, tipo: f.type || null
    })
    if (error) falhas.push(f.name)
    aoProgredir?.(++feitos)
  }
  return falhas
}

/** Abre um documento privado com um link temporário (2 minutos). */
export async function abrirDocumento(caminho: string, nome: string) {
  const janela = window.open('', '_blank')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 120, { download: nome })
  if (error || !data) { janela?.close(); throw error ?? new Error('sem link') }
  if (janela) janela.location.href = data.signedUrl
  else window.location.href = data.signedUrl
}
