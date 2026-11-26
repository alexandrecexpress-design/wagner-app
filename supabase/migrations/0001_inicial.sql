-- =====================================================================
-- Wagner Regularização Imobiliária — banco de dados do app
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run
-- =====================================================================

-- ---------- Feriados e prazo em dias úteis ----------------------------
create table if not exists public.feriados (
  dia  date primary key,
  nome text not null
);

insert into public.feriados (dia, nome) values
  ('2026-01-01','Confraternização Universal'),('2026-01-25','Aniversário de São Paulo (SP)'),
  ('2026-02-16','Carnaval'),('2026-02-17','Carnaval'),('2026-04-03','Sexta-feira Santa'),
  ('2026-04-21','Tiradentes'),('2026-05-01','Dia do Trabalho'),('2026-06-04','Corpus Christi'),
  ('2026-07-09','Revolução Constitucionalista (SP)'),('2026-09-07','Independência'),
  ('2026-10-12','Nossa Senhora Aparecida'),('2026-11-02','Finados'),('2026-11-15','Proclamação da República'),
  ('2026-11-20','Consciência Negra'),('2026-12-25','Natal'),
  ('2027-01-01','Confraternização Universal'),('2027-01-25','Aniversário de São Paulo (SP)'),
  ('2027-02-08','Carnaval'),('2027-02-09','Carnaval'),('2027-03-26','Sexta-feira Santa'),
  ('2027-04-21','Tiradentes'),('2027-05-01','Dia do Trabalho'),('2027-05-27','Corpus Christi'),
  ('2027-07-09','Revolução Constitucionalista (SP)'),('2027-09-07','Independência'),
  ('2027-10-12','Nossa Senhora Aparecida'),('2027-11-02','Finados'),('2027-11-15','Proclamação da República'),
  ('2027-11-20','Consciência Negra'),('2027-12-25','Natal'),
  ('2028-01-01','Confraternização Universal'),('2028-01-25','Aniversário de São Paulo (SP)'),
  ('2028-02-28','Carnaval'),('2028-02-29','Carnaval'),('2028-04-14','Sexta-feira Santa'),
  ('2028-04-21','Tiradentes'),('2028-05-01','Dia do Trabalho'),('2028-06-15','Corpus Christi'),
  ('2028-07-09','Revolução Constitucionalista (SP)'),('2028-09-07','Independência'),
  ('2028-10-12','Nossa Senhora Aparecida'),('2028-11-02','Finados'),('2028-11-15','Proclamação da República'),
  ('2028-11-20','Consciência Negra'),('2028-12-25','Natal')
on conflict (dia) do nothing;

-- Soma n dias úteis (pula sábado, domingo e feriados). Prazo vence às 23:59 (horário de Brasília).
create or replace function public.somar_dias_uteis(inicio timestamptz, n int)
returns timestamptz language plpgsql stable set search_path = public as $$
declare
  d date := (inicio at time zone 'America/Sao_Paulo')::date;
  k int := 0;
begin
  while k < n loop
    d := d + 1;
    if extract(isodow from d) < 6 and not exists (select 1 from public.feriados f where f.dia = d) then
      k := k + 1;
    end if;
  end loop;
  return (d + time '23:59:59') at time zone 'America/Sao_Paulo';
end $$;

-- Usado pelo app para mostrar o prazo antes do envio
create or replace function public.previsao_prazo()
returns timestamptz language sql stable set search_path = public as $$
  select public.somar_dias_uteis(now(), 3)
$$;

-- ---------- Validação de CPF ------------------------------------------
create or replace function public.cpf_valido(c text)
returns boolean language plpgsql immutable as $$
declare s int; d int; i int;
begin
  if c !~ '^\d{11}$' or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substr(c,i,1)::int * (11 - i); end loop;
  d := (s * 10) % 11 % 10; if d <> substr(c,10,1)::int then return false; end if;
  s := 0; for i in 1..10 loop s := s + substr(c,i,1)::int * (12 - i); end loop;
  d := (s * 10) % 11 % 10; return d = substr(c,11,1)::int;
end $$;

-- ---------- Perfis (cadastro completo) --------------------------------
create table if not exists public.perfis (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null check (length(trim(nome)) >= 5),
  cpf           text not null unique check (public.cpf_valido(cpf)),
  rg            text not null,
  nascimento    date not null,
  email         text not null,
  celular       text not null check (celular ~ '^\d{10,11}$'),
  cep           text not null check (cep ~ '^\d{8}$'),
  rua           text not null,
  numero        text not null,
  complemento   text,
  bairro        text not null,
  cidade        text not null,
  uf            char(2) not null,
  equipe        boolean not null default false,
  lgpd_aceite_em timestamptz not null default now(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- A pessoa logada faz parte da equipe Wagner?
create or replace function public.eh_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select equipe from public.perfis where id = auth.uid()), false)
$$;

-- Cria o perfil a partir dos dados enviados no cadastro
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data;
begin
  if m ? 'cpf' then
    insert into public.perfis (id, nome, cpf, rg, nascimento, email, celular, cep, rua, numero,
                               complemento, bairro, cidade, uf)
    values (new.id, m->>'nome', m->>'cpf', m->>'rg', (m->>'nascimento')::date, new.email,
            m->>'celular', m->>'cep', m->>'rua', m->>'numero', nullif(m->>'complemento',''),
            m->>'bairro', m->>'cidade', upper(m->>'uf'));
  end if;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- Mantém o e-mail do perfil igual ao do login
create or replace function public.sincronizar_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.perfis set email = new.email where id = new.id;
  return new;
end $$;

drop trigger if exists ao_mudar_email on auth.users;
create trigger ao_mudar_email after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sincronizar_email();

-- Cliente não pode mudar CPF, e-mail nem se colocar na equipe
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.id := old.id; new.cpf := old.cpf; new.email := old.email;
    new.equipe := old.equipe; new.lgpd_aceite_em := old.lgpd_aceite_em; new.criado_em := old.criado_em;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists antes_atualizar_perfil on public.perfis;
create trigger antes_atualizar_perfil before update on public.perfis
  for each row execute function public.proteger_perfil();

-- ---------- Solicitações ----------------------------------------------
do $$ begin
  create type public.status_solicitacao as enum ('em_analise','pendente_cliente','orcamento_enviado','encerrada');
exception when duplicate_object then null; end $$;

create sequence if not exists public.protocolo_seq;

create table if not exists public.solicitacoes (
  id               uuid primary key default gen_random_uuid(),
  protocolo        text unique,
  cliente_id       uuid not null default auth.uid() references public.perfis(id) on delete cascade,
  servico          text not null check (servico in ('usucapiao','inventario','holding','regularizacao','certidoes')),
  respostas        jsonb not null default '[]'::jsonb,
  status           public.status_solicitacao not null default 'em_analise',
  prazo            timestamptz,
  resposta_equipe  text,
  valor_orcamento  numeric(12,2) check (valor_orcamento is null or valor_orcamento >= 0),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index if not exists solicitacoes_cliente_idx on public.solicitacoes (cliente_id, criado_em desc);
create index if not exists solicitacoes_status_idx on public.solicitacoes (status, prazo);

create or replace function public.antes_inserir_solicitacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.eh_equipe() then
    new.cliente_id := auth.uid();
  end if;
  new.status := 'em_analise';
  new.resposta_equipe := null;
  new.valor_orcamento := null;
  new.criado_em := now();
  new.protocolo := 'WAG-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY') || '-'
                   || lpad(nextval('public.protocolo_seq')::text, 5, '0');
  new.prazo := public.somar_dias_uteis(now(), 3);
  return new;
end $$;

drop trigger if exists antes_inserir_solicitacao on public.solicitacoes;
create trigger antes_inserir_solicitacao before insert on public.solicitacoes
  for each row execute function public.antes_inserir_solicitacao();

create or replace function public.antes_atualizar_solicitacao()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id := old.id; new.protocolo := old.protocolo; new.cliente_id := old.cliente_id;
  new.servico := old.servico; new.respostas := old.respostas; new.criado_em := old.criado_em;
  -- voltou para análise: novo prazo de 3 dias úteis
  if new.status = 'em_analise' and old.status <> 'em_analise' then
    new.prazo := public.somar_dias_uteis(now(), 3);
  end if;
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists antes_atualizar_solicitacao on public.solicitacoes;
create trigger antes_atualizar_solicitacao before update on public.solicitacoes
  for each row execute function public.antes_atualizar_solicitacao();

-- ---------- Documentos -------------------------------------------------
create table if not exists public.documentos (
  id              uuid primary key default gen_random_uuid(),
  solicitacao_id  uuid not null references public.solicitacoes(id) on delete cascade,
  caminho         text not null unique,
  nome            text not null,
  tamanho         bigint,
  tipo            text,
  enviado_por     uuid default auth.uid() references auth.users(id) on delete set null,
  da_equipe       boolean not null default false,
  criado_em       timestamptz not null default now()
);
create index if not exists documentos_solicitacao_idx on public.documentos (solicitacao_id);

create or replace function public.antes_inserir_documento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.enviado_por := coalesce(auth.uid(), new.enviado_por);
  new.da_equipe := public.eh_equipe();
  new.criado_em := now();
  return new;
end $$;

drop trigger if exists antes_inserir_documento on public.documentos;
create trigger antes_inserir_documento before insert on public.documentos
  for each row execute function public.antes_inserir_documento();

-- Cliente mandou o documento que faltava: volta para análise com novo prazo
create or replace function public.apos_inserir_documento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.da_equipe then
    update public.solicitacoes set status = 'em_analise'
     where id = new.solicitacao_id and status = 'pendente_cliente';
  end if;
  return null;
end $$;

drop trigger if exists apos_inserir_documento on public.documentos;
create trigger apos_inserir_documento after insert on public.documentos
  for each row execute function public.apos_inserir_documento();

-- ---------- Avisos (aparecem no app e geram e-mail) --------------------
create table if not exists public.avisos (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references public.perfis(id) on delete cascade,
  solicitacao_id  uuid references public.solicitacoes(id) on delete cascade,
  titulo          text not null,
  mensagem        text not null,
  lido_em         timestamptz,
  criado_em       timestamptz not null default now()
);
create index if not exists avisos_usuario_idx on public.avisos (usuario_id, criado_em desc);

create or replace function public.avisar_mudanca_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text; m text;
begin
  if new.status is not distinct from old.status
     and new.resposta_equipe is not distinct from old.resposta_equipe
     and new.valor_orcamento is not distinct from old.valor_orcamento then
    return null;
  end if;
  case new.status
    when 'orcamento_enviado' then t := 'Seu orçamento está pronto';
         m := 'O orçamento da solicitação ' || new.protocolo || ' está disponível no app.';
    when 'pendente_cliente' then t := 'Precisamos de mais informações';
         m := 'Para continuar a análise da solicitação ' || new.protocolo || ', veja o que falta no app.';
    when 'em_analise' then t := 'Sua solicitação está em análise';
         m := 'A solicitação ' || new.protocolo || ' está em análise. Novo prazo: '
              || to_char(new.prazo at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') || '.';
    when 'encerrada' then t := 'Solicitação encerrada';
         m := 'A solicitação ' || new.protocolo || ' foi encerrada.';
  end case;
  if new.resposta_equipe is not null and new.resposta_equipe <> '' then
    m := m || E'\n\nMensagem da equipe: ' || new.resposta_equipe;
  end if;
  insert into public.avisos (usuario_id, solicitacao_id, titulo, mensagem)
  values (new.cliente_id, new.id, t, m);
  return null;
end $$;

drop trigger if exists apos_atualizar_solicitacao on public.solicitacoes;
create trigger apos_atualizar_solicitacao after update on public.solicitacoes
  for each row execute function public.avisar_mudanca_status();

-- ---------- Segurança (RLS): cada cliente só vê o que é seu -------------
alter table public.feriados     enable row level security;
alter table public.perfis       enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.documentos   enable row level security;
alter table public.avisos       enable row level security;

revoke all on public.feriados, public.perfis, public.solicitacoes, public.documentos, public.avisos from anon;

drop policy if exists feriados_ler on public.feriados;
create policy feriados_ler on public.feriados for select to authenticated using (true);
drop policy if exists feriados_equipe on public.feriados;
create policy feriados_equipe on public.feriados for all to authenticated
  using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select to authenticated
  using (id = auth.uid() or public.eh_equipe());
drop policy if exists perfis_editar on public.perfis;
create policy perfis_editar on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists solicitacoes_ler on public.solicitacoes;
create policy solicitacoes_ler on public.solicitacoes for select to authenticated
  using (cliente_id = auth.uid() or public.eh_equipe());
drop policy if exists solicitacoes_criar on public.solicitacoes;
create policy solicitacoes_criar on public.solicitacoes for insert to authenticated
  with check (cliente_id = auth.uid());
drop policy if exists solicitacoes_equipe_editar on public.solicitacoes;
create policy solicitacoes_equipe_editar on public.solicitacoes for update to authenticated
  using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists documentos_ler on public.documentos;
create policy documentos_ler on public.documentos for select to authenticated
  using (public.eh_equipe() or exists (
    select 1 from public.solicitacoes s where s.id = solicitacao_id and s.cliente_id = auth.uid()));
drop policy if exists documentos_criar on public.documentos;
create policy documentos_criar on public.documentos for insert to authenticated
  with check (
    public.eh_equipe() or exists (
      select 1 from public.solicitacoes s
       where s.id = solicitacao_id and s.cliente_id = auth.uid() and s.status <> 'encerrada'
         and caminho like auth.uid()::text || '/' || s.id::text || '/%'));

drop policy if exists avisos_ler on public.avisos;
create policy avisos_ler on public.avisos for select to authenticated
  using (usuario_id = auth.uid());
drop policy if exists avisos_marcar_lido on public.avisos;
create policy avisos_marcar_lido on public.avisos for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
revoke update on public.avisos from authenticated;
grant update (lido_em) on public.avisos to authenticated;

revoke execute on function public.somar_dias_uteis(timestamptz,int) from anon;
revoke execute on function public.previsao_prazo() from anon;

-- ---------- Arquivos: pasta privada "documentos" ------------------------
-- Caminho de cada arquivo: <id do cliente>/<id da solicitação>/<nome>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/heic','image/heif','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documentos: cliente envia" on storage.objects;
create policy "documentos: cliente envia" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos' and (
      public.eh_equipe() or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.solicitacoes s
                     where s.id::text = (storage.foldername(name))[2]
                       and s.cliente_id = auth.uid() and s.status <> 'encerrada'))));

drop policy if exists "documentos: ler" on storage.objects;
create policy "documentos: ler" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (
    public.eh_equipe() or (storage.foldername(name))[1] = auth.uid()::text));
