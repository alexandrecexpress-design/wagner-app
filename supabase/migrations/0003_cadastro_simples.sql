-- Cadastro simplificado: só nome, e-mail, WhatsApp/telefone, senha e aceite da LGPD.
-- CPF, RG, nascimento e endereço passam a ser opcionais (podem ser preenchidos depois em "Meu perfil").

alter table public.perfis
  alter column cpf drop not null,
  alter column rg drop not null,
  alter column nascimento drop not null,
  alter column cep drop not null,
  alter column rua drop not null,
  alter column numero drop not null,
  alter column bairro drop not null,
  alter column cidade drop not null,
  alter column uf drop not null;

alter table public.perfis add column if not exists lgpd_versao text;

alter table public.perfis drop constraint if exists perfis_cep_check;
alter table public.perfis add constraint perfis_cep_check check (cep is null or cep ~ '^\d{8}$');

-- Cria o perfil a partir do cadastro. Sem o aceite da LGPD, a conta não é criada.
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data;
begin
  if m ? 'nome' then
    if coalesce(m->>'lgpd', '') <> 'true' then
      raise exception 'aceite_lgpd_obrigatorio';
    end if;
    insert into public.perfis (id, nome, email, celular, lgpd_aceite_em, lgpd_versao,
                               cpf, rg, nascimento, cep, rua, numero, complemento, bairro, cidade, uf)
    values (new.id, trim(m->>'nome'), new.email, m->>'celular', now(), m->>'lgpd_versao',
            nullif(m->>'cpf',''), nullif(m->>'rg',''), nullif(m->>'nascimento','')::date,
            nullif(m->>'cep',''), nullif(m->>'rua',''), nullif(m->>'numero',''), nullif(m->>'complemento',''),
            nullif(m->>'bairro',''), nullif(m->>'cidade',''), nullif(upper(m->>'uf'),''));
  end if;
  return new;
end $$;

-- Cliente pode informar o CPF uma vez (depois não muda), nunca altera e-mail, equipe ou aceite.
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.id := old.id; new.email := old.email; new.equipe := old.equipe;
    new.lgpd_aceite_em := old.lgpd_aceite_em; new.lgpd_versao := old.lgpd_versao; new.criado_em := old.criado_em;
    if old.cpf is not null then new.cpf := old.cpf; end if;
  end if;
  new.atualizado_em := now();
  return new;
end $$;
