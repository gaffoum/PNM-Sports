-- =====================================================================
-- 0006 — Brique "Annuaire clubs & contacts" (placement_clubs)
-- Le nom du club reste une chaîne libre (aligné sur players.club_actuel/
-- club_precedent et le référentiel FFF de lib/clubs.js) : pas de table
-- "clubs" séparée, un club existe dès qu'il a un joueur, un contact ou
-- une note d'échange.
-- =====================================================================
create table if not exists public.club_contacts (
  id uuid primary key default gen_random_uuid(),
  club text not null,
  nom text not null,
  role text,
  telephone text,
  email text,
  created_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists club_contacts_club_idx on public.club_contacts(club);

create table if not exists public.club_activity (
  id uuid primary key default gen_random_uuid(),
  club text not null,
  note text not null,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists club_activity_club_idx on public.club_activity(club);
create index if not exists club_activity_created_at_idx on public.club_activity(created_at desc);

alter table public.club_contacts enable row level security;
alter table public.club_activity enable row level security;

-- Lecture : tout agent connecté. Écriture : admin ou droit "edit_players".
drop policy if exists "club_contacts_select" on public.club_contacts;
create policy "club_contacts_select" on public.club_contacts
  for select to authenticated using (public.is_agent());

drop policy if exists "club_contacts_write" on public.club_contacts;
create policy "club_contacts_write" on public.club_contacts
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));

drop policy if exists "club_activity_select" on public.club_activity;
create policy "club_activity_select" on public.club_activity
  for select to authenticated using (public.is_agent());

drop policy if exists "club_activity_write" on public.club_activity;
create policy "club_activity_write" on public.club_activity
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));
