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

do $$ begin
  create type public.recruitment_step as enum (
    'premiere_observation', 'contre_observation', 'observation_decisive',
    'veille', 'prise_contact', 'rdv1', 'reflexion', 'rdv2',
    'accepte', 'ne_pas_suivre'
  );
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
  permissions jsonb not null default '{}'::jsonb,
  actif boolean not null default true,
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
  recruitment_step public.recruitment_step not null default 'premiere_observation',
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
create index if not exists players_recruitment_step_idx on public.players(recruitment_step);
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

create or replace function public.has_perm(perm text) returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid()
      and (role = 'admin' or coalesce((permissions ->> perm)::boolean, false))
  );
$$;

-- Compte "SuperAdmin" (proprietaire de l'agence) : au-dessus du role admin,
-- seul habilite a piloter les briques commerciales (/features).
create or replace function public.is_owner() returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.agents
    where id = auth.uid() and lower(email) = 'gaffoum@gmail.com'
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

-- Protection du compte propriétaire : supprimable uniquement par lui-même
-- (politique RESTRICTIVE, se combine en ET avec agents_admin_all).
drop policy if exists "agents_protect_owner_delete" on public.agents;
create policy "agents_protect_owner_delete" on public.agents
  as restrictive for delete to authenticated
  using (lower(email) <> 'gaffoum@gmail.com' or id = auth.uid());

-- players :
--   - admin : tout
--   - agent : voit seulement les joueurs dont il est agent_referent
drop policy if exists "players_select_admin_or_referent" on public.players;
create policy "players_select_admin_or_referent" on public.players
  for select to authenticated
  using (
    public.is_admin()
    or agent_referent = auth.uid()
    or public.has_perm('view_all_players')
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
  using (public.is_admin() or agent_referent = auth.uid() or public.has_perm('edit_players'))
  with check (public.is_admin() or agent_referent = auth.uid() or public.has_perm('edit_players'));

drop policy if exists "players_delete_admin_or_referent" on public.players;
create policy "players_delete_admin_or_referent" on public.players
  for delete to authenticated
  using (public.is_admin() or agent_referent = auth.uid() or public.has_perm('delete_players'));

-- player_stats : meme regle que players (via player_id)
drop policy if exists "player_stats_select" on public.player_stats;
create policy "player_stats_select" on public.player_stats
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
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
    public.has_perm('view_all_players') or exists (
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
-- TABLES: clubs / club_contacts / club_activity (brique "Annuaire clubs & contacts")
-- clubs = entite maitresse (nom unique, pays), editable/supprimable.
-- =====================================================================
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  pays text,
  created_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clubs_pays_idx on public.clubs(pays);

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

alter table public.clubs enable row level security;

drop policy if exists "clubs_select" on public.clubs;
create policy "clubs_select" on public.clubs
  for select to authenticated using (public.is_agent());

drop policy if exists "clubs_write" on public.clubs;
create policy "clubs_write" on public.clubs
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

create table if not exists public.club_contacts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  nom text not null,
  role text,
  telephone text,
  email text,
  created_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists club_contacts_club_id_idx on public.club_contacts(club_id);

create table if not exists public.club_activity (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  note text not null,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists club_activity_club_id_idx on public.club_activity(club_id);
create index if not exists club_activity_created_at_idx on public.club_activity(created_at desc);

alter table public.club_contacts enable row level security;
alter table public.club_activity enable row level security;

drop policy if exists "club_contacts_select" on public.club_contacts;
create policy "club_contacts_select" on public.club_contacts
  for select to authenticated using (public.is_agent());

drop policy if exists "club_contacts_write" on public.club_contacts;
create policy "club_contacts_write" on public.club_contacts
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

drop policy if exists "club_activity_select" on public.club_activity;
create policy "club_activity_select" on public.club_activity
  for select to authenticated using (public.is_agent());

drop policy if exists "club_activity_write" on public.club_activity;
create policy "club_activity_write" on public.club_activity
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

-- =====================================================================
-- TABLE: club_needs (brique "Besoins clubs") — demandes de recrutement
-- exprimees par les clubs (poste, criteres, description, statut).
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
  using (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'))
  with check (public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_clubs'));

-- =====================================================================
-- TABLE: player_interactions (brique "Historique d'interactions")
-- =====================================================================
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
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p
      where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p
      where p.id = player_interactions.player_id and p.agent_referent = auth.uid()
    )
  );

-- =====================================================================
-- TABLE: appointments (brique "Agenda & rappels")
-- =====================================================================
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
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p
      where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_agenda') or exists (
      select 1 from public.players p
      where p.id = appointments.player_id and p.agent_referent = auth.uid()
    )
  );

-- =====================================================================
-- TABLE: player_deals (brique "Pipeline transferts & mandats")
-- =====================================================================
create table if not exists public.player_deals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  type text not null default 'transfert' check (type in ('transfert', 'pret', 'essai')),
  statut text not null default 'en_discussion'
    check (statut in ('en_discussion', 'offre_recue', 'accord_verbal', 'signe', 'refuse', 'abandonne')),
  montant_propose numeric(12,2),
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_deals_player_id_idx on public.player_deals(player_id);
create index if not exists player_deals_club_id_idx on public.player_deals(club_id);
create index if not exists player_deals_statut_idx on public.player_deals(statut);

drop trigger if exists player_deals_set_updated_at on public.player_deals;
create trigger player_deals_set_updated_at
before update on public.player_deals
for each row execute function public.set_updated_at();

alter table public.player_deals enable row level security;

drop policy if exists "player_deals_select" on public.player_deals;
create policy "player_deals_select" on public.player_deals
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_deals_write" on public.player_deals;
create policy "player_deals_write" on public.player_deals
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.players p
      where p.id = player_deals.player_id and p.agent_referent = auth.uid()
    )
  );

-- =====================================================================
-- TABLE: deal_commissions (brique "Commissions & revenus")
-- =====================================================================
create table if not exists public.deal_commissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.player_deals(id) on delete cascade,
  montant numeric(12,2) not null,
  statut text not null default 'attendue' check (statut in ('attendue', 'facturee', 'encaissee')),
  date_echeance date,
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deal_commissions_deal_id_idx on public.deal_commissions(deal_id);

drop trigger if exists deal_commissions_set_updated_at on public.deal_commissions;
create trigger deal_commissions_set_updated_at
before update on public.deal_commissions
for each row execute function public.set_updated_at();

alter table public.deal_commissions enable row level security;

drop policy if exists "deal_commissions_select" on public.deal_commissions;
create policy "deal_commissions_select" on public.deal_commissions
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "deal_commissions_write" on public.deal_commissions;
create policy "deal_commissions_write" on public.deal_commissions
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_pipeline') or exists (
      select 1 from public.player_deals d join public.players p on p.id = d.player_id
      where d.id = deal_commissions.deal_id and p.agent_referent = auth.uid()
    )
  );

-- =====================================================================
-- TABLE: player_contracts (brique "Gestion des contrats joueurs")
-- =====================================================================
create table if not exists public.player_contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  date_debut date,
  date_fin date,
  salaire_annuel numeric(12,2),
  clause_liberatoire text,
  notes text,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_contracts_player_id_idx on public.player_contracts(player_id);

drop trigger if exists player_contracts_set_updated_at on public.player_contracts;
create trigger player_contracts_set_updated_at
before update on public.player_contracts
for each row execute function public.set_updated_at();

alter table public.player_contracts enable row level security;

drop policy if exists "player_contracts_select" on public.player_contracts;
create policy "player_contracts_select" on public.player_contracts
  for select to authenticated
  using (
    public.has_perm('view_all_players') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id
      and (public.is_admin() or p.agent_referent = auth.uid())
    )
  );

drop policy if exists "player_contracts_write" on public.player_contracts;
create policy "player_contracts_write" on public.player_contracts
  for all to authenticated
  using (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p
      where p.id = player_contracts.player_id and p.agent_referent = auth.uid()
    )
  );

-- =====================================================================
-- TABLE: player_evaluations (brique "Scouting interne" / alimente
-- "Radar de notation réel")
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
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p
      where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  )
  with check (
    public.is_admin() or public.has_perm('edit_players') or public.has_perm('manage_scouting') or exists (
      select 1 from public.players p
      where p.id = player_evaluations.player_id and p.agent_referent = auth.uid()
    )
  );

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

-- =====================================================================
-- TABLE: features (système de "briques" — feature flags facturables)
-- =====================================================================
create table if not exists public.features (
  key text primary key,
  label text not null,
  pack text,
  enabled boolean not null default false,
  enabled_at timestamptz,
  enabled_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.features enable row level security;

drop policy if exists "features_select_authenticated" on public.features;
create policy "features_select_authenticated" on public.features
  for select to authenticated
  using (public.is_agent());

-- Reserve au SuperAdmin (proprietaire), pas aux administrateurs classiques.
drop policy if exists "features_admin_write" on public.features;
create policy "features_admin_write" on public.features
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- =====================================================================
-- TABLE: audit_log (brique "Journal d'audit complet")
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

-- =====================================================================
-- TABLE: rgpd_requests (brique "Conformité RGPD avancée")
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
