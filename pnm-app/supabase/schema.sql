-- =====================================================================
-- PNM Sports - Schema complet
-- A executer une fois sur une base Supabase fraiche.
-- Idempotent : peut etre re-execute sans casse (DROP IF EXISTS / CREATE OR REPLACE).
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =====================================================================
-- ENUMs
-- =====================================================================
do $$ begin
  create type public.agent_role as enum ('admin', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.player_statut as enum ('joueur', 'prospect');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABLE: agents
-- =====================================================================
create table if not exists public.agents (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text not null unique,
  role public.agent_role not null default 'agent',
  created_at timestamptz not null default now()
);

create index if not exists agents_role_idx on public.agents(role);

-- =====================================================================
-- TABLE: players
-- =====================================================================
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  date_naissance date,
  nationalite text,
  poste text,
  pied_fort text check (pied_fort in ('gauche', 'droit', 'ambidextre') or pied_fort is null),
  taille_cm int check (taille_cm > 0 and taille_cm < 260),
  poids_kg numeric(5,2) check (poids_kg > 0 and poids_kg < 200),
  club_actuel text,
  club_precedent text,
  fin_contrat date,
  valeur_estimee_eur bigint check (valeur_estimee_eur is null or valeur_estimee_eur >= 0),
  telephone text,
  email text,
  statut public.player_statut not null default 'prospect',
  agent_referent uuid references public.agents(id) on delete set null,
  photo_url text,
  notes text,
  consentement_rgpd boolean not null default false,
  consentement_rgpd_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_agent_referent_idx on public.players(agent_referent);
create index if not exists players_statut_idx on public.players(statut);
create index if not exists players_fin_contrat_idx on public.players(fin_contrat);
create index if not exists players_nom_idx on public.players(nom);
create index if not exists players_search_idx on public.players using gin (
  to_tsvector('simple',
    coalesce(nom,'') || ' ' || coalesce(prenom,'') || ' ' ||
    coalesce(club_actuel,'') || ' ' || coalesce(nationalite,'') || ' ' ||
    coalesce(poste,'')
  )
);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

-- =====================================================================
-- TABLE: player_stats
-- =====================================================================
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  saison text not null,
  matchs int default 0 check (matchs >= 0),
  buts int default 0 check (buts >= 0),
  passes int default 0 check (passes >= 0),
  minutes_jouees int default 0 check (minutes_jouees >= 0),
  created_at timestamptz not null default now(),
  unique (player_id, saison)
);

create index if not exists player_stats_player_id_idx on public.player_stats(player_id);

-- =====================================================================
-- TABLE: player_documents
-- =====================================================================
create table if not exists public.player_documents (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  nom text not null,
  type text,
  storage_path text not null,
  taille_bytes bigint,
  uploaded_by uuid references public.agents(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index if not exists player_documents_player_id_idx on public.player_documents(player_id);

-- =====================================================================
-- TABLE: activity_log
-- =====================================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log(created_at desc);
create index if not exists activity_log_agent_id_idx on public.activity_log(agent_id);
create index if not exists activity_log_player_id_idx on public.activity_log(player_id);

-- =====================================================================
-- Helpers RLS
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_agent() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents where id = auth.uid()
  );
$$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.agents enable row level security;
alter table public.players enable row level security;
alter table public.player_stats enable row level security;
alter table public.player_documents enable row level security;
alter table public.activity_log enable row level security;

-- agents : tout agent lit la liste (annuaire interne) ; seul admin modifie
drop policy if exists "agents_select_authenticated" on public.agents;
create policy "agents_select_authenticated" on public.agents
  for select to authenticated
  using (public.is_agent());

drop policy if exists "agents_admin_all" on public.agents;
create policy "agents_admin_all" on public.agents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- players :
--   - admin : tout
--   - agent : voit seulement les joueurs dont il est agent_referent
drop policy if exists "players_select_admin_or_referent" on public.players;
create policy "players_select_admin_or_referent" on public.players
  for select to authenticated
  using (
    public.is_admin()
    or agent_referent = auth.uid()
  );

drop policy if exists "players_insert_authenticated" on public.players;
create policy "players_insert_authenticated" on public.players
  for insert to authenticated
  with check (
    public.is_agent()
    and (agent_referent is null or agent_referent = auth.uid() or public.is_admin())
  );

drop policy if exists "players_update_admin_or_referent" on public.players;
create policy "players_update_admin_or_referent" on public.players
  for update to authenticated
  using (public.is_admin() or agent_referent = auth.uid())
  with check (public.is_admin() or agent_referent = auth.uid());

drop policy if exists "players_delete_admin_or_referent" on public.players;
create policy "players_delete_admin_or_referent" on public.players
  for delete to authenticated
  using (public.is_admin() or agent_referent = auth.uid());

-- player_stats : meme regle que players (via player_id)
drop policy if exists "player_stats_select" on public.player_stats;
create policy "player_stats_select" on public.player_stats
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_stats.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_stats_write" on public.player_stats;
create policy "player_stats_write" on public.player_stats
  for all to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_stats.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.players p
      where p.id = player_stats.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

-- player_documents : meme regle
drop policy if exists "player_documents_select" on public.player_documents;
create policy "player_documents_select" on public.player_documents
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_documents.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_documents_write" on public.player_documents;
create policy "player_documents_write" on public.player_documents
  for all to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_documents.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.players p
      where p.id = player_documents.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

-- activity_log : tout agent voit ses actions, admin voit tout, ecriture toute role
drop policy if exists "activity_log_select" on public.activity_log;
create policy "activity_log_select" on public.activity_log
  for select to authenticated
  using (public.is_admin() or agent_id = auth.uid());

drop policy if exists "activity_log_insert" on public.activity_log;
create policy "activity_log_insert" on public.activity_log
  for insert to authenticated
  with check (public.is_agent() and agent_id = auth.uid());

-- =====================================================================
-- STORAGE policies (les buckets sont crees via API par scripts/setup.mjs)
-- =====================================================================
-- player-photos : public en lecture, ecriture par agents
drop policy if exists "player_photos_public_read" on storage.objects;
create policy "player_photos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'player-photos');

drop policy if exists "player_photos_agent_write" on storage.objects;
create policy "player_photos_agent_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'player-photos' and public.is_agent());

drop policy if exists "player_photos_agent_update" on storage.objects;
create policy "player_photos_agent_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'player-photos' and public.is_agent());

drop policy if exists "player_photos_agent_delete" on storage.objects;
create policy "player_photos_agent_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'player-photos' and public.is_agent());

-- player-documents : prive, lecture/ecriture par agents avec droit sur le joueur
drop policy if exists "player_documents_agent_select" on storage.objects;
create policy "player_documents_agent_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'player-documents' and public.is_agent());

drop policy if exists "player_documents_agent_insert" on storage.objects;
create policy "player_documents_agent_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'player-documents' and public.is_agent());

drop policy if exists "player_documents_agent_update" on storage.objects;
create policy "player_documents_agent_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'player-documents' and public.is_agent());

drop policy if exists "player_documents_agent_delete" on storage.objects;
create policy "player_documents_agent_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'player-documents' and public.is_agent());
