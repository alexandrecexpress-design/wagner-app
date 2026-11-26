\set ON_ERROR_STOP on
-- Usuários: Maria (cliente), João (cliente), Ana (equipe)
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','maria@ex.com','{"nome":"Maria Souza","cpf":"52998224725","rg":"123","nascimento":"1978-04-12","celular":"11987654321","cep":"04567000","rua":"Rua A","numero":"1","bairro":"B","cidade":"São Paulo","uf":"sp"}'),
 ('00000000-0000-0000-0000-00000000000b','joao@ex.com','{"nome":"João Lima","cpf":"11144477735","rg":"456","nascimento":"1980-01-01","celular":"11911112222","cep":"01000000","rua":"Rua C","numero":"2","bairro":"D","cidade":"São Paulo","uf":"SP"}'),
 ('00000000-0000-0000-0000-00000000000c','ana@wagner.com','{"nome":"Ana Equipe","cpf":"39053344705","rg":"789","nascimento":"1990-01-01","celular":"11933334444","cep":"01000000","rua":"Rua E","numero":"3","bairro":"F","cidade":"São Paulo","uf":"SP"}');
update public.perfis set equipe = true where email = 'ana@wagner.com';

do $$ begin
  assert (select count(*) from public.perfis) = 3, 'perfis criados';
  assert (select uf from public.perfis where email='maria@ex.com') = 'SP', 'uf maiúscula';
  assert public.somar_dias_uteis('2026-11-26 10:00-03', 3) = '2026-12-01 23:59:59-03', 'prazo 26/11';
  assert public.somar_dias_uteis('2026-12-23 10:00-03', 3) = '2026-12-29 23:59:59-03', 'prazo com Natal';
  assert public.somar_dias_uteis('2026-11-27 22:00-03', 1) = '2026-11-30 23:59:59-03', 'sexta à noite';
end $$;

-- CPF inválido não cria perfil
do $$ begin
  begin
    insert into auth.users (email, raw_user_meta_data) values ('x@ex.com','{"nome":"Fulano Tal","cpf":"12345678900","rg":"1","nascimento":"1990-01-01","celular":"11999999999","cep":"01000000","rua":"R","numero":"1","bairro":"B","cidade":"C","uf":"SP"}');
    raise exception 'CPF inválido foi aceito';
  exception when check_violation then null; end;
end $$;

-- ===== Maria (cliente) =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.solicitacoes (servico, respostas, status, cliente_id, valor_orcamento)
values ('usucapiao', '[{"id":"tempo","pergunta":"Há quanto tempo?","resposta":"Mais de 15 anos"}]', 'orcamento_enviado',
        '00000000-0000-0000-0000-00000000000b', 1);
do $$ declare s record; begin
  select * into s from public.solicitacoes;
  assert s.cliente_id = '00000000-0000-0000-0000-00000000000a', 'dona é Maria';
  assert s.status = 'em_analise', 'status forçado';
  assert s.valor_orcamento is null, 'valor forçado nulo';
  assert s.protocolo like 'WAG-____-00001', 'protocolo ' || s.protocolo;
  assert s.prazo is not null, 'prazo';
end $$;
update public.perfis set equipe = true, cpf = '11144477735', nome = 'Maria A. Souza';
do $$ begin
  assert (select equipe from public.perfis where id = auth.uid()) = false, 'não virou equipe';
  assert (select cpf from public.perfis where id = auth.uid()) = '52998224725', 'cpf não muda';
  assert (select nome from public.perfis where id = auth.uid()) = 'Maria A. Souza', 'nome muda';
  assert (select count(*) from public.perfis) = 1, 'só vê o próprio perfil';
end $$;
-- documento no caminho certo
insert into storage.objects (bucket_id, name) select 'documentos', auth.uid() || '/' || id || '/iptu.pdf' from public.solicitacoes;
insert into public.documentos (solicitacao_id, caminho, nome, tamanho, tipo)
  select id, auth.uid() || '/' || id || '/iptu.pdf', 'iptu.pdf', 1000, 'application/pdf' from public.solicitacoes;
-- cliente não consegue mudar a própria solicitação
update public.solicitacoes set status = 'orcamento_enviado';
do $$ begin assert (select status from public.solicitacoes) = 'em_analise', 'cliente não altera status'; end $$;
commit;

-- caminho de outra pessoa é recusado no storage
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('documentos', '00000000-0000-0000-0000-00000000000b/x/a.pdf');
    raise exception 'upload em pasta alheia aceito';
  exception when insufficient_privilege then null; end;
end $$;
commit;

select id as sid from public.solicitacoes \gset
-- ===== João (outro cliente) =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from public.solicitacoes) = 0, 'João não vê pedido da Maria';
  assert (select count(*) from public.documentos) = 0, 'João não vê documentos';
  assert (select count(*) from storage.objects) = 0, 'João não vê arquivos';
  assert (select count(*) from public.perfis) = 1, 'João só vê o próprio perfil';
end $$;
select set_config('teste.sid', :'sid', true);
do $$ begin
  begin
    insert into public.documentos (solicitacao_id, caminho, nome)
      values (current_setting('teste.sid')::uuid, '00000000-0000-0000-0000-00000000000b/' || current_setting('teste.sid') || '/z.pdf', 'z.pdf');
    raise exception 'João anexou documento no pedido da Maria';
  exception when insufficient_privilege then null; end;
end $$;
commit;
do $$ begin assert (select count(*) from public.documentos) = 1, 'João não anexou nada'; end $$;

-- ===== Ana (equipe) pede mais documentos =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from public.solicitacoes) = 1, 'equipe vê pedidos';
  assert (select count(*) from public.perfis) = 3, 'equipe vê clientes';
  assert (select count(*) from storage.objects) = 1, 'equipe vê arquivos';
end $$;
update public.solicitacoes set status = 'pendente_cliente', resposta_equipe = 'Envie o carnê de IPTU.';
commit;

-- Maria envia o que faltava: volta para análise
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.documentos (solicitacao_id, caminho, nome)
  select id, auth.uid() || '/' || id || '/iptu2.pdf', 'iptu2.pdf' from public.solicitacoes;
do $$ begin
  assert (select status from public.solicitacoes) = 'em_analise', 'voltou para análise';
  assert (select count(*) from public.avisos) = 2, 'dois avisos: ' || (select count(*) from public.avisos);
end $$;
update public.avisos set lido_em = now();
do $$ begin
  begin
    update public.avisos set titulo = 'hack';
    raise exception 'cliente alterou título do aviso';
  exception when insufficient_privilege then null; end;
end $$;
commit;

-- Ana envia o orçamento
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
update public.solicitacoes set status = 'orcamento_enviado', valor_orcamento = 3500, resposta_equipe = 'Usucapião extrajudicial.';
commit;
do $$ begin
  assert (select count(*) from public.avisos where titulo = 'Seu orçamento está pronto') = 1, 'aviso de orçamento';
  assert (select count(*) from public.avisos where usuario_id = '00000000-0000-0000-0000-00000000000a') = 3, 'avisos da Maria';
end $$;

-- anon não lê nada
begin;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.solicitacoes;
    raise exception 'anon leu solicitações';
  exception when insufficient_privilege then null; end;
end $$;
commit;

\echo TODOS OS TESTES PASSARAM
