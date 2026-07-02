-- =====================================================================
-- 0012 — Brique "Scouting interne" (data_scouting_interne)
-- Grille de notation PNM sur 6 axes (mêmes axes que le radar du PDF :
-- VITESSE/TECHNIQUE/PHYSIQUE/MENTAL/TACTIQUE/PASSES), 1-10, historique.
-- Alimente aussi la brique "Radar de notation réel" (data_radar_reel,
-- déjà au catalogue) : le PDF/la fiche affichent un radar réel dès
-- qu'une évaluation existe, au lieu du placeholder "Évaluation à venir".
-- =====================================================================
create table if not exists public.player_evaluations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  date_evaluation date not null default current_date,
  vitesse smallint check (vitesse between 1 and 10),
  technique smallint check (technique between 1 and 10),
  physique smallint check (physique between 1 and 10),
  mental smallint check (mental between 1 and 10),
  tactique smallint check (tactique between 1 and 10),
  passes smallint check (passes between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists player_evaluations_player_id_idx on public.player_evaluations(player_id);
create index if not exists player_evaluations_date_idx on public.player_evaluations(date_evaluation desc);

alter table public.player_evaluations enable row level security;

drop policy if exists "player_evaluations_select" on public.player_evaluations;
create policy "player_evaluations_select" on public.player_evaluations
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_evaluations.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_evaluations_write" on public.player_evaluations;
create policy "player_evaluations_write" on public.player_evaluations
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or exists (
      select 1 from public.players p
      where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  );
