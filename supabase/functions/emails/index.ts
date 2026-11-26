// Envia e-mails a partir de webhooks do banco (Supabase > Database > Webhooks):
//  - INSERT em "avisos"       -> e-mail para o cliente (status mudou, orçamento pronto etc.)
//  - INSERT em "solicitacoes" -> e-mail para a equipe (novo pedido)
// Segredos (Supabase > Edge Functions > Secrets):
//  RESEND_API_KEY, EMAIL_REMETENTE, EMAIL_EQUIPE, APP_URL, WEBHOOK_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (k: string) => Deno.env.get(k) ?? ''
const SERVICOS: Record<string, string> = {
  usucapiao: 'Usucapião', inventario: 'Inventário', holding: 'Holding Patrimonial',
  regularizacao: 'Regularização de imóvel', certidoes: 'Certidões em geral'
}
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function modelo(titulo: string, corpo: string, botao: string, link: string) {
  return `<!doctype html><html><body style="margin:0;background:#0c0b09;font-family:Arial,Helvetica,sans-serif;color:#fbf8f3">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0b09;padding:24px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#17150f;border:1px solid #3a3326;border-radius:14px">
  <tr><td style="padding:20px 24px;border-bottom:1px solid #ffbd59">
    <div style="font-weight:800;letter-spacing:2px;font-size:18px">WAGNER</div>
    <div style="color:#ffbd59;font-size:11px;letter-spacing:2px">REGULARIZAÇÃO IMOBILIÁRIA</div></td></tr>
  <tr><td style="padding:24px">
    <h1 style="font-size:22px;margin:0 0 12px;color:#ffbd59">${esc(titulo)}</h1>
    <div style="font-size:16px;line-height:1.55;white-space:pre-line">${corpo}</div>
    <p style="margin:24px 0 8px"><a href="${esc(link)}" style="display:inline-block;background:#ffbd59;color:#111;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${esc(botao)}</a></p>
  </td></tr>
  <tr><td style="padding:16px 24px;color:#e9bfa3;font-size:13px;border-top:1px solid #3a3326">
    Dúvidas? WhatsApp (11) 94200-4495. Este é um e-mail automático.</td></tr>
  </table></td></tr></table></body></html>`
}

async function enviarEmail(para: string, assunto: string, html: string) {
  const r = await fetch(env('RESEND_URL') || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('EMAIL_REMETENTE'), to: [para], subject: assunto, html })
  })
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('método não permitido', { status: 405 })
  if (!env('WEBHOOK_SECRET') || req.headers.get('x-webhook-secret') !== env('WEBHOOK_SECRET')) {
    return new Response('não autorizado', { status: 401 })
  }
  const { type, table, record } = await req.json()
  if (type !== 'INSERT' || !record) return new Response('ignorado')

  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  const app = env('APP_URL').replace(/\/$/, '')

  try {
    if (table === 'avisos') {
      const { data: p } = await db.from('perfis').select('nome, email').eq('id', record.usuario_id).single()
      if (!p?.email) return new Response('sem e-mail')
      const corpo = `Olá, ${esc(p.nome.split(' ')[0])}!\n\n${esc(record.mensagem)}`
      const link = record.solicitacao_id ? `${app}/solicitacoes/${record.solicitacao_id}` : `${app}/solicitacoes`
      await enviarEmail(p.email, record.titulo, modelo(record.titulo, corpo, 'Abrir no app', link))
    } else if (table === 'solicitacoes') {
      if (!env('EMAIL_EQUIPE')) return new Response('sem e-mail da equipe')
      const { data: p } = await db.from('perfis').select('nome, celular').eq('id', record.cliente_id).single()
      const servico = SERVICOS[record.servico] ?? record.servico
      const respostas = (record.respostas ?? []).map((r: { pergunta: string; resposta: string }) =>
        `<b>${esc(r.pergunta)}</b><br>${esc(r.resposta)}`).join('<br><br>')
      const corpo = `Cliente: <b>${esc(p?.nome)}</b>\nCelular: ${esc(p?.celular)}\nProtocolo: ${esc(record.protocolo)}\n\n${respostas}`
      await enviarEmail(env('EMAIL_EQUIPE'), `Nova solicitação ${record.protocolo}: ${servico}`,
        modelo(`Nova solicitação: ${servico}`, corpo, 'Abrir no painel', `${app}/painel/${record.id}`))
    }
    return new Response('ok')
  } catch (e) {
    console.error(e)
    return new Response('erro ao enviar', { status: 500 })
  }
})
