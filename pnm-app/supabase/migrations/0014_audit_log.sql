-- =====================================================================
-- 0014 — Brique "Journal d'audit complet" (secu_audit)
-- Journalise chaque creation / modification / suppression sur les
-- tables sensibles, avec l'auteur, l'ancienne et la nouvelle valeur.
-- Lecture reservee aux administrateurs.
-- =====================================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.agents(id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
create index if not exists audit_log_table_idx on public.audit_log(table_name);
create index if not exists audit_log_actor_idx on public.audit_log(actor_id);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select" on public.audit_log;
create policy "audit_log_select" on public.audit_log
  for select to authenticated
  using (public.is_admin());

-- Pas de policy insert/update/delete pour les utilisateurs : seule la
-- fonction trigger (security definer) peut ecrire dans ce journal.

create or replace function public.fn_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
begin
  v_row := coalesce(to_jsonb(new), to_jsonb(old));
  insert into public.audit_log (actor_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce(v_row ->> 'id', v_row ->> 'key'),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_players on public.players;
create trigger trg_audit_players
  after insert or update or delete on public.players
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_clubs on public.clubs;
create trigger trg_audit_clubs
  after insert or update or delete on public.clubs
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_player_deals on public.player_deals;
create trigger trg_audit_player_deals
  after insert or update or delete on public.player_deals
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_deal_commissions on public.deal_commissions;
create trigger trg_audit_deal_commissions
  after insert or update or delete on public.deal_commissions
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_player_contracts on public.player_contracts;
create trigger trg_audit_player_contracts
  after insert or update or delete on public.player_contracts
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_agents on public.agents;
create trigger trg_audit_agents
  after insert or update or delete on public.agents
  for each row execute function public.fn_audit_log();

drop trigger if exists trg_audit_features on public.features;
create trigger trg_audit_features
  after insert or update or delete on public.features
  for each row execute function public.fn_audit_log();
