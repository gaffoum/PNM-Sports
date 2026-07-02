-- =====================================================================
-- 0010 — Briques "Historique d'interactions" (placement_historique) et
-- "Agenda & rappels" (placement_agenda)
-- =====================================================================

-- ---------------------------------------------------------------------
-- player_interactions : fil d'appels/emails/réunions/notes par joueur
-- ---------------------------------------------------------------------
create table if not exists public.player_interactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  type text not null default 'note' check (type in ('appel', 'email', 'reunion', 'note')),
  note text not null,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists player_interactions_player_id_idx on public.player_interactions(player_id);
create index if not exists player_interactions_created_at_idx on public.player_interactions(created_at desc);

alter table public.player_interactions enable row level security;

drop policy if exists "player_interactions_select" on public.player_interactions;
create policy "player_interactions_select" on public.player_interactions
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_interactions.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_interactions_write" on public.player_interactions;
create policy "player_interactions_write" on public.player_interactions
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- appointments : rendez-vous liés à un joueur (agenda)
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  titre text not null,
  date_rdv timestamptz not null,
  lieu text,
  notes text,
  statut text not null default 'a_venir' check (statut in ('a_venir', 'fait', 'annule')),
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_player_id_idx on public.appointments(player_id);
create index if not exists appointments_date_rdv_idx on public.appointments(date_rdv);

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = appointments.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "appointments_write" on public.appointments;
create policy "appointments_write" on public.appointments
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  );

-- Nouvelles briques au catalogue (désactivées par défaut).
insert into public.features (key, label, pack) values
  ('placement_historique', 'Historique d''interactions', 'placement_crm'),
  ('placement_agenda', 'Agenda & rappels', 'placement_crm')
on conflict (key) do nothing;
