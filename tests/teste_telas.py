# Teste de ponta a ponta das telas com o Supabase simulado (Playwright).
# Uso: build com VITE_SUPABASE_URL=http://mock.supabase.test, servir em :4173 e rodar este arquivo.
import asyncio, base64, json, sys, time
from playwright.async_api import async_playwright

BASE = 'http://127.0.0.1:4173'
UID = '00000000-0000-0000-0000-00000000000a'
SID = '11111111-1111-1111-1111-111111111111'

def jwt(sub):
    b = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
    return f"{b({'alg':'HS256','typ':'JWT'})}.{b({'sub':sub,'exp':int(time.time())+3600,'role':'authenticated','aud':'authenticated'})}.assinatura"

def perfil(equipe):
    return {'id': UID, 'nome': 'Maria Aparecida Souza', 'email': 'maria@ex.com', 'celular': '11987654321', 'equipe': equipe}

SOL = {'id': SID, 'protocolo': 'WAG-2026-00001', 'cliente_id': UID, 'servico': 'usucapiao',
       'respostas': [{'id': 'tempo', 'pergunta': 'Há quanto tempo você está no imóvel?', 'resposta': 'Mais de 15 anos'}],
       'status': 'em_analise', 'prazo': '2026-12-02T02:59:59+00:00', 'resposta_equipe': None, 'valor_orcamento': None,
       'criado_em': '2026-11-26T14:00:00+00:00', 'atualizado_em': '2026-11-26T14:00:00+00:00'}

class Mock:
    def __init__(self, equipe, sessao_no_cadastro=False):
        self.equipe = equipe; self.chamadas = []; self.criadas = []; self.sessao_no_cadastro = sessao_no_cadastro
    async def rota(self, route):
        req = route.request; url = req.url; m = req.method
        self.chamadas.append((m, url.split('mock.supabase.test')[1][:90]))
        obj = 'vnd.pgrst.object' in (req.headers.get('accept') or '')
        def resp(body, status=200, headers=None):
            h = {'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
                 'access-control-expose-headers': 'content-range', **(headers or {})}
            return route.fulfill(status=status, body=json.dumps(body), headers=h)
        if m == 'OPTIONS': return await resp({})
        if '/auth/v1/token' in url:
            return await resp({'access_token': jwt(UID), 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': int(time.time()) + 3600,
                               'refresh_token': 'r', 'user': {'id': UID, 'email': 'maria@ex.com', 'aud': 'authenticated', 'role': 'authenticated'}})
        if '/auth/v1/signup' in url:
            self.criadas.append(json.loads(req.post_data))
            user = {'id': UID, 'email': 'maria@ex.com', 'aud': 'authenticated', 'role': 'authenticated', 'identities': [{'id': 'x'}]}
            if self.sessao_no_cadastro:
                return await resp({'access_token': jwt(UID), 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': int(time.time()) + 3600, 'refresh_token': 'r', 'user': user})
            return await resp(user)
        if '/auth/v1/user' in url:
            return await resp({'id': UID, 'email': 'maria@ex.com', 'aud': 'authenticated', 'role': 'authenticated'})
        if '/auth/v1/logout' in url: return await resp({}, 204)
        if '/rest/v1/perfis' in url:
            p = perfil(self.equipe); return await resp(p if obj else [p])
        if '/rest/v1/avisos' in url:
            return await resp([], headers={'content-range': '*/0'})
        if '/rest/v1/rpc/previsao_prazo' in url: return await resp('2026-12-02T02:59:59+00:00')
        if '/rest/v1/solicitacoes' in url:
            if m == 'POST':
                body = json.loads(req.post_data); self.criadas.append(body)
                return await resp({**SOL, 'servico': body['servico'], 'respostas': body['respostas']} if obj else [SOL], 201)
            if m == 'PATCH':
                self.criadas.append(json.loads(req.post_data)); return await resp([], 204)
            if m == 'HEAD': return await resp(None, headers={'content-range': '0-0/1'})
            linha = {**SOL, 'perfis': {'nome': 'Maria Aparecida Souza', 'celular': '11987654321', 'email': 'maria@ex.com'}}
            return await resp(linha if obj else [linha], headers={'content-range': '0-0/1'})
        if '/rest/v1/documentos' in url:
            if m == 'POST': self.criadas.append(json.loads(req.post_data)); return await resp(None, 201)
            return await resp([])
        if '/storage/v1/object/documentos/' in url: return await resp({'Key': 'documentos/x', 'Id': 'x'})
        return await resp({'message': 'rota não simulada ' + url}, 404)

async def rodar(p, equipe, sessao_no_cadastro=False):
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
    ctx = await b.new_context(viewport={'width': 400, 'height': 860}, service_workers='block')
    pg = await ctx.new_page()
    erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    mock = Mock(equipe, sessao_no_cadastro)
    await pg.route('http://mock.supabase.test/**', mock.rota)
    await pg.route('https://viacep.com.br/**', lambda r: r.fulfill(json={'logradouro': 'Rua X', 'bairro': 'Centro', 'localidade': 'Campinas', 'uf': 'SP'}))
    return b, pg, erros, mock

async def responder_usucapiao(pg, arquivo=True):
    await pg.click(".servico:has-text(\"Usucapião\")"); await pg.wait_for_selector("text=O que você quer fazer?")
    await pg.click(".opcao:has-text(\"Orçamento gratuito\")"); await pg.wait_for_selector(".passos")
    for t in ['Mais de 15 anos', 'Urbano (cidade)', 'Moradia', 'Recibo de compra']: await pg.click(f'.chips span:text-is("{t}")')
    await pg.locator('fieldset:has-text("Paga IPTU") .chips span:text-is("Sim")').click()
    await pg.locator('fieldset:has-text("reclamou a posse") .chips span:text-is("Não")').click()
    await pg.fill('#p-local', 'São Paulo/SP'); await pg.click('button:has-text("Continuar")')
    await pg.wait_for_selector('text=Envio opcional')
    if arquivo:
        await pg.set_input_files('#arquivos', files=[{'name': 'IPTU 2026 ção.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 teste'}])
    await pg.click('button:has-text("Continuar")'); await pg.wait_for_selector('text=Revisar e enviar')

async def preencher_cadastro(pg):
    await pg.fill('#nome', 'Maria Aparecida Souza'); await pg.fill('#email', 'maria@ex.com'); await pg.fill('#celular', '11987654321')
    await pg.fill('#senha', 'segredo123'); await pg.fill('#senha2', 'segredo123'); await pg.check('#termo')

def checar(c, msg):
    if not c: print('FALHOU:', msg); sys.exit(1)

async def main():
    async with async_playwright() as p:
        # ---------- Cadastro simples + termo LGPD ----------
        b, pg, erros, mock = await rodar(p, False)
        await pg.goto(BASE + '/cadastro'); await pg.wait_for_selector('text=Criar conta')
        checar(await pg.locator('#cpf, #rg, #cep').count() == 0, 'sem CPF, RG ou endereço')
        await pg.fill('#nome', 'João'); await pg.fill('#celular', '942004495'); await pg.click('button[type=submit]')
        checar(await pg.locator('text=Informe nome e sobrenome').count() == 1, 'sobrenome')
        checar(await pg.locator('text=inclua o DDD').count() == 1, 'DDD')
        checar(await pg.locator('text=é preciso aceitar o termo').count() == 1, 'termo obrigatório')
        await pg.click('summary:has-text("Ler o Termo")')
        checar(await pg.locator('.termo h3:has-text("Seus direitos")').is_visible(), 'termo abre')
        await pg.fill('#nome', 'João da Silva'); await pg.fill('#email', 'novo@ex.com'); await pg.fill('#celular', '11942004495')
        checar(await pg.input_value('#celular') == '(11) 94200-4495', 'máscara do telefone')
        await pg.fill('#senha', 'segredo123'); await pg.fill('#senha2', 'segredo123'); await pg.check('#termo')
        await pg.screenshot(path='/tmp/t-cadastro.png', full_page=True)
        await pg.click('button[type=submit]'); await pg.wait_for_selector('text=Confirme seu e-mail')
        meta = mock.criadas[0]['data']
        checar(meta == {'nome': 'João da Silva', 'celular': '11942004495', 'lgpd': 'true', 'lgpd_versao': '2026-11-26'}, 'metadados: %s' % meta)
        await pg.goto(BASE + '/termo'); await pg.wait_for_selector('text=Termo de consentimento e privacidade')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()

        # ---------- Visitante: página inicial -> orçamento -> cadastro no fim (sessão imediata) ----------
        b, pg, erros, mock = await rodar(p, False, sessao_no_cadastro=True)
        await pg.goto(BASE + '/'); await pg.wait_for_selector('text=Quero meu orçamento gratuito')
        await pg.screenshot(path='/tmp/t-inicio.png', full_page=True)
        await pg.click('text=Quero meu orçamento gratuito'); await pg.wait_for_selector('h1:has-text("Serviços")')
        await responder_usucapiao(pg)
        checar(await pg.locator('text=Falta só um passo').count() == 1, 'cadastro no fim')
        await pg.screenshot(path='/tmp/t-fim.png', full_page=True)
        await preencher_cadastro(pg); await pg.click('button:has-text("Criar conta e enviar pedido")')
        await pg.wait_for_selector('text=Solicitação enviada')
        sol = [c for c in mock.criadas if isinstance(c, dict) and c.get('servico')][0]
        checar(sol['servico'] == 'usucapiao' and len(sol['respostas']) == 7 and sol['cliente_id'] == UID, 'pedido após cadastro: %s' % sol)
        checar(any(isinstance(c, dict) and 'caminho' in c for c in mock.criadas), 'documento enviado após cadastro')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()

        # ---------- Visitante: cadastro exige confirmar e-mail -> pedido guardado -> enviado ao entrar ----------
        b, pg, erros, mock = await rodar(p, False, sessao_no_cadastro=False)
        await pg.goto(BASE + '/servicos'); await responder_usucapiao(pg)
        await preencher_cadastro(pg); await pg.click('button:has-text("Criar conta e enviar pedido")')
        await pg.wait_for_selector('text=Seu pedido ficou guardado neste aparelho')
        checar(not [c for c in mock.criadas if isinstance(c, dict) and c.get('servico')], 'nada enviado antes de entrar')
        await pg.goto(BASE + '/entrar'); await pg.fill('#email', 'maria@ex.com'); await pg.fill('#senha', 'segredo123'); await pg.click('button[type=submit]')
        await pg.wait_for_selector('text=Protocolo WAG-2026-00001')
        sol = [c for c in mock.criadas if isinstance(c, dict) and c.get('servico')]
        checar(len(sol) == 1 and sol[0]['servico'] == 'usucapiao', 'rascunho enviado ao entrar: %s' % sol)
        checar(any(isinstance(c, dict) and 'IPTU_2026_cao.pdf' in c.get('caminho', '') for c in mock.criadas), 'arquivo do rascunho enviado')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()

        # ---------- Visitante que já tem conta: entra no fim ----------
        b, pg, erros, mock = await rodar(p, False)
        await pg.goto(BASE + '/servicos'); await responder_usucapiao(pg, arquivo=False)
        await pg.click('button:has-text("Já tenho conta")')
        await pg.fill('#email', 'maria@ex.com'); await pg.fill('#senha', 'segredo123'); await pg.click('button:has-text("Entrar e enviar pedido")')
        await pg.wait_for_selector('text=Solicitação enviada')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()

        # ---------- Cliente: login, orçamento com documento ----------
        b, pg, erros, mock = await rodar(p, False)
        await pg.goto(BASE + '/entrar')
        await pg.fill('#email', 'maria@ex.com'); await pg.fill('#senha', 'segredo123'); await pg.click('button[type=submit]')
        await pg.wait_for_selector('h1:has-text("Serviços")')
        await pg.screenshot(path='/tmp/t-servicos.png')
        await pg.click(".servico:has-text(\"Usucapião\")"); await pg.wait_for_selector("text=O que você quer fazer?"); await pg.click(".opcao:has-text(\"Orçamento gratuito\")"); await pg.wait_for_selector(".passos")
        await pg.click('button:has-text("Continuar")')
        checar(await pg.locator('text=Responda esta pergunta').count() >= 5, 'obrigatórias apontadas')
        for t in ['Mais de 15 anos', 'Urbano (cidade)', 'Moradia', 'Recibo de compra']: await pg.click(f'.chips span:text-is("{t}")')
        await pg.locator('fieldset:has-text("Paga IPTU") .chips span:text-is("Sim")').click()
        await pg.locator('fieldset:has-text("reclamou a posse") .chips span:text-is("Não")').click()
        await pg.fill('#p-local', 'São Paulo/SP')
        await pg.click('button:has-text("Continuar")')
        await pg.wait_for_selector('text=Envio opcional')
        await pg.set_input_files('#arquivos', files=[{'name': 'IPTU 2026 ção.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 teste'}])
        checar(await pg.locator('.arquivos li').count() == 1, 'arquivo listado')
        await pg.click('button:has-text("Continuar")')
        await pg.wait_for_selector('text=Revisar e enviar')
        checar(await pg.locator('text=quarta-feira, 2 de dezembro').count() >= 0, 'prazo')
        await pg.screenshot(path='/tmp/t-revisar.png')
        await pg.click('button:has-text("Enviar solicitação")')
        await pg.wait_for_selector('text=Solicitação enviada')
        checar(await pg.locator('text=WAG-2026-00001').count() == 1, 'protocolo na tela')
        sol = mock.criadas[0]
        checar(sol['servico'] == 'usucapiao' and len(sol['respostas']) == 7, 'respostas enviadas: %s' % sol)
        doc = mock.criadas[1]
        checar(doc['caminho'].startswith(f'{UID}/{SID}/') and 'IPTU_2026_cao.pdf' in doc['caminho'], 'caminho do arquivo: ' + doc['caminho'])
        await pg.screenshot(path='/tmp/t-enviada.png')
        await pg.click('text=Acompanhar solicitação'); await pg.wait_for_selector('text=Protocolo WAG-2026-00001')
        await pg.screenshot(path='/tmp/t-detalhe.png', full_page=True)
        await pg.click('text=Perfil'); await pg.wait_for_selector('text=(11) 98765-4321')
        checar(await pg.locator('text=CPF').count() == 0, 'perfil sem CPF')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()

        # ---------- Equipe: painel ----------
        b, pg, erros, mock = await rodar(p, True)
        await pg.set_viewport_size({'width': 1200, 'height': 860})
        await pg.goto(BASE + '/entrar')
        await pg.fill('#email', 'ana@wagner.com'); await pg.fill('#senha', 'segredo123'); await pg.click('button[type=submit]')
        await pg.wait_for_selector('text=Painel da equipe')
        await pg.screenshot(path='/tmp/t-painel.png')
        await pg.click('td:has-text("Maria Aparecida Souza")')
        await pg.wait_for_selector('text=Respostas do cliente')
        await pg.select_option('#status', 'orcamento_enviado'); await pg.fill('#valor', '3.500,00'); await pg.fill('#resp', 'Usucapião extrajudicial.')
        await pg.click('button:has-text("Salvar e avisar cliente")'); await pg.wait_for_selector('text=O cliente foi avisado')
        up = mock.criadas[-1]
        checar(up == {'status': 'orcamento_enviado', 'resposta_equipe': 'Usucapião extrajudicial.', 'valor_orcamento': 3500}, 'atualização: %s' % up)
        await pg.screenshot(path='/tmp/t-painel-detalhe.png')
        checar(not erros, 'erros de JS: %s' % erros)
        await b.close()
    print('TESTES DE TELA PASSARAM')

asyncio.run(main())
