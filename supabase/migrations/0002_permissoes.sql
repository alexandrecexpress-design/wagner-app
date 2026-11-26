-- Correção: libera as tabelas para usuários logados (projetos novos do Supabase não fazem isso sozinhos).
-- As regras de segurança (RLS) continuam valendo: cada cliente só vê o que é dele.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.feriados to authenticated;
grant select, update on public.perfis to authenticated;
grant select, insert, update on public.solicitacoes to authenticated;
grant select, insert on public.documentos to authenticated;
grant select on public.avisos to authenticated;
grant update (lido_em) on public.avisos to authenticated;
grant usage, select on sequence public.protocolo_seq to authenticated;
grant all on public.feriados, public.perfis, public.solicitacoes, public.documentos, public.avisos to service_role;
grant usage, select on sequence public.protocolo_seq to service_role;
grant execute on function public.eh_equipe(), public.previsao_prazo(),
  public.somar_dias_uteis(timestamptz,int), public.cpf_valido(text) to authenticated, service_role;
