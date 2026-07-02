-- =====================================================================
-- 0015 — Brique "Conformité RGPD avancée" (secu_rgpd)
-- Registre des demandes RGPD (droit d'accès, rectification,
-- suppression, opposition, portabilité) exercées par un joueur/prospect
-- ou son représentant. Consultation/gestion reservée aux administrateurs.
-- =====================================================================

create table if not exists public.rgpd_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete set null,
  player_nom text not null,
  type text not null check (type in ('acces', 'rectification', 'suppression', 'opposition', 'portabilite')),
  statut text not null default 'recue' check (statut in ('recue', 'en_cours', 'traitee', 'refusee')),
  date_reception date not null default current_date,
  date_traitement date,
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists rgpd_requests_player_id_idx on public.rgpd_requests(player_id);
create index if not exists rgpd_requests_statut_idx on public.rgpd_requests(statut);

alter table public.rgpd_requests enable row level security;

drop policy if exists "rgpd_requests_select" on public.rgpd_requests;
create policy "rgpd_requests_select" on public.rgpd_requests
  for select to authenticated
  using (public.is_admin());

drop policy if exists "rgpd_requests_write" on public.rgpd_requests;
create policy "rgpd_requests_write" on public.rgpd_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_rgpd_requests on public.rgpd_requests;
create trigger trg_audit_rgpd_requests
  after insert or update or delete on public.rgpd_requests
  for each row execute function public.fn_audit_log();
