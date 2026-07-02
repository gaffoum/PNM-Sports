-- =====================================================================
-- 0009 — Brique "Besoins clubs" (placement_besoins_clubs)
-- Centralise les demandes de recrutement exprimées par les clubs
-- (poste, critères, description, statut). Une seule table, affichée par
-- deux vues : la page centralisée /besoins-clubs et la fiche club
-- (/clubs/:club) — jamais désynchronisées puisque c'est la même donnée.
-- =====================================================================
create table if not exists public.club_needs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  poste text,
  criteres text[] not null default '{}',
  description text,
  statut text not null default 'ouvert' check (statut in ('ouvert', 'pourvu', 'annule')),
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists club_needs_club_id_idx on public.club_needs(club_id);
create index if not exists club_needs_statut_idx on public.club_needs(statut);

drop trigger if exists club_needs_set_updated_at on public.club_needs;
create trigger club_needs_set_updated_at
before update on public.club_needs
for each row execute function public.set_updated_at();

alter table public.club_needs enable row level security;

drop policy if exists "club_needs_select" on public.club_needs;
create policy "club_needs_select" on public.club_needs
  for select to authenticated using (public.is_agent());

drop policy if exists "club_needs_write" on public.club_needs;
create policy "club_needs_write" on public.club_needs
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));

-- Nouvelle brique au catalogue (désactivée par défaut, comme les autres).
insert into public.features (key, label, pack) values
  ('placement_besoins_clubs', 'Besoins clubs', 'placement_crm')
on conflict (key) do nothing;
