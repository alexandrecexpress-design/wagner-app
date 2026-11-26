// Testa a função de e-mails com Supabase e Resend simulados: deno run -A tests/teste_emails.ts
const enviados: { to: string[]; subject: string; html: string }[] = []
const mock = Deno.serve({ port: 8787, onListen() {} }, async (req) => {
  const u = new URL(req.url)
  if (u.pathname === '/resend') { enviados.push(await req.json()); return Response.json({ id: 'x' }) }
  if (u.pathname === '/rest/v1/perfis') return Response.json({ nome: 'Maria <b>Souza</b>', email: 'maria@ex.com', celular: '11987654321' })
  return new Response('?', { status: 404 })
})
const fn = new Deno.Command(Deno.execPath(), {
  args: ['run', '-A', 'supabase/functions/emails/index.ts'],
  env: { SUPABASE_URL: 'http://localhost:8787', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_URL: 'http://localhost:8787/resend',
    RESEND_API_KEY: 'r', EMAIL_REMETENTE: 'Wagner <app@wagner.com>', EMAIL_EQUIPE: 'equipe@wagner.com', APP_URL: 'https://app.wagner.com/', WEBHOOK_SECRET: 's3' },
  stdout: 'null', stderr: 'inherit'
}).spawn()
await new Promise(r => setTimeout(r, 2500))
const post = (body: unknown, secret = 's3') => fetch('http://localhost:8000', { method: 'POST', headers: { 'x-webhook-secret': secret }, body: JSON.stringify(body) })
const ok = (c: boolean, m: string) => { if (!c) { console.error('FALHOU:', m); fn.kill(); Deno.exit(1) } }

let r = await post({ type: 'INSERT', table: 'avisos', record: {} }, 'errado'); await r.text()
ok(r.status === 401, 'segredo errado deve dar 401')
r = await post({ type: 'INSERT', table: 'avisos', record: { usuario_id: 'u', solicitacao_id: 'abc', titulo: 'Seu orçamento está pronto', mensagem: 'Linha 1\n<script>' } }); await r.text()
ok(r.status === 200 && enviados.length === 1, 'aviso enviado')
ok(enviados[0].to[0] === 'maria@ex.com' && enviados[0].subject === 'Seu orçamento está pronto', 'destino e assunto')
ok(enviados[0].html.includes('https://app.wagner.com/solicitacoes/abc') && !enviados[0].html.includes('<script>') && !enviados[0].html.includes('<b>Souza'), 'link e escape')
r = await post({ type: 'INSERT', table: 'solicitacoes', record: { id: 'sid', cliente_id: 'u', servico: 'usucapiao', protocolo: 'WAG-2026-00001', respostas: [{ pergunta: 'Tempo?', resposta: '15 anos' }] } }); await r.text()
ok(r.status === 200 && enviados.length === 2 && enviados[1].to[0] === 'equipe@wagner.com', 'e-mail da equipe')
ok(enviados[1].subject === 'Nova solicitação WAG-2026-00001: Usucapião' && enviados[1].html.includes('/painel/sid'), 'assunto e link do painel')
r = await post({ type: 'UPDATE', table: 'avisos', record: {} }); await r.text()
ok(enviados.length === 2, 'UPDATE ignorado')
console.log('TESTES DE E-MAIL PASSARAM')
fn.kill(); await mock.shutdown(); Deno.exit(0)
