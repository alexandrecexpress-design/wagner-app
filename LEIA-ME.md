# App Wagner Regularização Imobiliária

App web instalável (PWA) para clientes pedirem orçamento gratuito, enviarem documentos e acompanharem as solicitações, com um painel para a equipe.

**O que tem pronto**

- Cadastro completo (nome, CPF validado, RG, nascimento, e-mail, celular, endereço com busca automática pelo CEP), aceite LGPD, confirmação por e-mail, login e recuperação de senha.
- Serviços: Usucapião, Inventário, Holding Patrimonial, Regularização de Imóvel e Certidões em geral, cada um com explicação e perguntas próprias.
- Orçamento em 3 etapas (perguntas, documentos opcionais, revisão), protocolo `WAG-AAAA-00001` e prazo de 3 dias úteis calculado no servidor (pula fins de semana e feriados da tabela `feriados`).
- Acompanhamento: linha do tempo, resposta e valor do orçamento, arquivos enviados pela equipe, envio de mais documentos e botão de WhatsApp com o protocolo.
- Painel da equipe (`/painel`): contadores, prazo vencido em destaque, busca por protocolo/nome/CPF/celular, dados completos do cliente, download dos documentos, mudança de status, mensagem, valor e anexo de proposta.
- Avisos no app e por e-mail quando o status muda, e e-mail para a equipe a cada novo pedido.
- Segurança: cada cliente só acessa os próprios dados e arquivos (Row Level Security). Os documentos ficam numa pasta privada e só abrem por links temporários de 2 minutos. O cliente não consegue mudar o status, o CPF nem se colocar na equipe.

---

## Publicação passo a passo

Leva cerca de 1 hora na primeira vez. Você vai precisar de 4 contas: **Supabase** (banco), **Resend** (e-mails), **GitHub** (código) e **Netlify** (site).

### 1. Supabase (banco, login e arquivos)

1. Crie uma conta em supabase.com, depois **New project**. Em **Region**, escolha **South America (São Paulo)**. Guarde a senha do banco.
2. Abra **SQL Editor > New query**, cole todo o conteúdo de `supabase/migrations/0001_inicial.sql` e clique em **Run**.
3. Em **Authentication > URL Configuration**:
   - **Site URL**: o endereço final do app (por exemplo `https://app.wagnerregularizacao.com.br`).
   - **Redirect URLs**: adicione `https://app.wagnerregularizacao.com.br/**`.
4. Em **Authentication > Providers > Email**: deixe **Confirm email** ligado e defina **Minimum password length = 8**.
5. Em **Authentication > Email Templates**, traduza os e-mails (veja os modelos no fim deste arquivo).
6. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**. Elas vão no passo 4.

> **Plano:** o plano grátis **pausa o projeto depois de 1 semana sem uso** e não tem backup diário. Para clientes reais, use o **Pro (US$ 25 por mês)**.

### 2. Resend (envio de e-mails)

1. Crie uma conta em resend.com e verifique o domínio da empresa (**Domains > Add domain**). Isso exige adicionar alguns registros DNS onde o domínio está registrado.
2. Crie uma **API Key**.
3. No Supabase, em **Project Settings > Authentication > SMTP Settings**, ligue o **Custom SMTP** com estes dados:
   - Host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a API Key.
   - Remetente: `nao-responda@seudominio.com.br`, nome `Wagner Regularização Imobiliária`.

   Sem isso, o Supabase envia poucos e-mails de confirmação por hora.

### 3. Função de e-mails (avisos e novo pedido)

No computador, com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado, dentro da pasta do projeto:

```bash
supabase login
supabase init        # só na primeira vez; responda "N" às perguntas
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy emails --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxx \
  EMAIL_REMETENTE="Wagner Regularização <nao-responda@seudominio.com.br>" \
  EMAIL_EQUIPE=equipe@seudominio.com.br \
  APP_URL=https://app.wagnerregularizacao.com.br \
  WEBHOOK_SECRET=uma-senha-longa-e-aleatoria
```

Depois, em **Database > Webhooks**, crie **dois** webhooks:

| Nome | Tabela | Evento | Tipo | Função | Header |
|---|---|---|---|---|---|
| aviso-cliente | `avisos` | Insert | Supabase Edge Functions | `emails` | `x-webhook-secret: <WEBHOOK_SECRET>` |
| novo-pedido | `solicitacoes` | Insert | Supabase Edge Functions | `emails` | `x-webhook-secret: <WEBHOOK_SECRET>` |

### 4. Publicar o site (Netlify)

1. Suba esta pasta para um repositório **privado** no GitHub.
2. Em netlify.com, clique em **Add new site > Import from Git** e escolha o repositório.
   - Build command: `npm run build`. Publish directory: `dist`.
   - Em **Environment variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (do passo 1.6).
3. Em **Domain management**, ligue o seu domínio (por exemplo `app.wagnerregularizacao.com.br`). O HTTPS é automático.

> O arquivo `vercel.json` também deixa o projeto pronto para a Vercel. Mas o plano grátis da Vercel não permite uso comercial, por isso a recomendação é a Netlify.

### 5. Dar acesso à equipe

Cada pessoa da equipe cria a conta normalmente no app. Depois, no **SQL Editor** do Supabase, rode:

```sql
update public.perfis set equipe = true where email = 'nome@seudominio.com.br';
```

Ao entrar, essa pessoa vai direto para o **Painel**. Para tirar o acesso, troque `true` por `false`.

### 6. Instalar no celular

- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o link, toque no menu **⋮** e depois em **Instalar app**.

---

## Ajustes do dia a dia

- **Textos, perguntas e documentos sugeridos:** `src/lib/servicos.ts`. Se adicionar um serviço novo, inclua o id dele também na regra `servico in (...)` da tabela `solicitacoes`.
- **Número do WhatsApp:** `WHATSAPP_NUMERO` em `src/lib/servicos.ts`, e no rodapé do e-mail em `supabase/functions/emails/index.ts`.
- **Feriados:** tabela `feriados` (**Table Editor**). Os nacionais e os de São Paulo de 2026 a 2028 já estão lá. Adicione os anos seguintes e os feriados municipais de onde a equipe trabalha.
- **Prazo de análise:** troque o `3` em `somar_dias_uteis(now(), 3)` no SQL (aparece duas vezes) e também nos textos do app.

## LGPD: o que ainda depende de vocês

- Uma **Política de Privacidade** escrita pelo jurídico, publicada num link e citada no aceite do cadastro (`src/pages/Acesso.tsx`).
- Definir por quanto tempo os documentos ficam guardados e quem da equipe tem acesso ao painel.
- O banco fica em São Paulo, os arquivos são privados e cada acesso usa um link temporário. Com o plano Pro há backup diário.

## Testes

```bash
npm install
npm test                  # validações (CPF, máscaras, cadastro)
npm run test:banco        # regras de segurança do banco num Postgres local (precisa do PostgreSQL 16)
npm run build             # gera a versão de produção em dist/
```

`tests/teste_telas.py` (Playwright) percorre cadastro, orçamento com documento e painel com o Supabase simulado. `tests/teste_emails.ts` (Deno) testa a função de e-mails.

## Modelos de e-mail do Supabase (Authentication > Email Templates)

**Confirm signup**, com o assunto *Confirme seu cadastro na Wagner*:

```html
<h2>Bem-vindo(a) à Wagner Regularização Imobiliária</h2>
<p>Toque no botão para confirmar seu e-mail e ativar sua conta:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar meu e-mail</a></p>
<p>Se você não fez este cadastro, ignore esta mensagem.</p>
```

**Reset password**, com o assunto *Criar nova senha*:

```html
<h2>Criar nova senha</h2>
<p>Recebemos um pedido para trocar a senha da sua conta na Wagner.</p>
<p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>
<p>Se não foi você, ignore esta mensagem. Sua senha continua a mesma.</p>
```
