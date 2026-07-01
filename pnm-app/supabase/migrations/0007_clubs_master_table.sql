-- =====================================================================
-- 0007 — Table maîtresse "clubs" (édition/suppression + pays)
-- Remplace le modèle "club = texte libre" de la migration 0006 par une
-- vraie entité : nom (unique), pays, éditable/supprimable avec droits.
-- club_contacts / club_activity référencent désormais clubs.id (FK).
-- Idempotent : fonctionne que la migration 0006 ait déjà été appliquée
-- (tables avec colonne texte "club") ou non (création directe).
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

-- Amorçage : référentiel FFF (pays France)
insert into public.clubs (nom, pays) values
  ('Paris Saint-Germain (PSG)', 'France'),
  ('Olympique Lyonnais (OL)', 'France'),
  ('Olympique de Marseille (OM)', 'France'),
  ('AS Monaco', 'France'),
  ('LOSC Lille', 'France'),
  ('Stade Rennais FC', 'France'),
  ('OGC Nice', 'France'),
  ('RC Lens', 'France'),
  ('RC Strasbourg', 'France'),
  ('Montpellier HSC', 'France'),
  ('Toulouse FC', 'France'),
  ('AJ Auxerre', 'France'),
  ('AS Saint-Étienne', 'France'),
  ('Stade de Reims', 'France'),
  ('FC Nantes', 'France'),
  ('Le Havre AC', 'France'),
  ('Angers SCO', 'France'),
  ('Brest (Stade Brestois)', 'France'),
  ('FC Lorient', 'France'),
  ('SM Caen', 'France'),
  ('Amiens SC', 'France'),
  ('ESTAC Troyes', 'France'),
  ('FC Metz', 'France'),
  ('EA Guingamp', 'France'),
  ('Paris FC', 'France'),
  ('SC Bastia', 'France'),
  ('Red Star FC', 'France'),
  ('Valenciennes FC', 'France'),
  ('FC Sochaux-Montbéliard', 'France'),
  ('FC Versailles 78', 'France'),
  ('Dijon FCO', 'France'),
  ('US Concarneau', 'France'),
  ('Bourg-en-Bresse', 'France'),
  ('AS Saint-Priest', 'France'),
  ('Racing Club de France', 'France'),
  ('CS Brétigny Football', 'France'),
  ('JA Drancy', 'France'),
  ('US Torcy PVM', 'France'),
  ('FC Montfermeil', 'France'),
  ('AS Béziers', 'France'),
  ('AAS Sarcelles', 'France'),
  ('FC Montrouge 92', 'France'),
  ('ES Nanterre', 'France'),
  ('Cavigal Nice', 'France'),
  ('ASPTT Marseille', 'France'),
  ('Istres FC', 'France'),
  ('FC Lyon 1893', 'France'),
  ('Lyon - La Duchère', 'France'),
  ('US Orléans', 'France'),
  ('Chamois Niortais', 'France'),
  ('US Avranches', 'France'),
  ('Sablé FC', 'France'),
  ('La Roche VF', 'France'),
  ('FC Mantois 78', 'France'),
  ('CS Mainvilliers', 'France'),
  ('AC Cambrai', 'France'),
  ('Canet RFC', 'France'),
  ('ESC Montferrier', 'France'),
  ('FC Borgo', 'France'),
  ('Gazélec FC Ajaccio', 'France'),
  ('Jeunesse Villenavaise', 'France'),
  ('FC Marmande 47', 'France'),
  ('Quevilly-Rouen (QRM)', 'France'),
  ('Racing Besançon', 'France'),
  ('Paris 13 Atletico', 'France'),
  ('AS Beauvais Oise', 'France'),
  ('US Boulogne CO', 'France'),
  ('Vannes OC', 'France'),
  ('Stade Bordelais', 'France')
on conflict (nom) do nothing;

-- Amorçage : clubs déjà utilisés par des joueurs (pays inconnu -> null,
-- à compléter manuellement depuis /clubs).
insert into public.clubs (nom)
select distinct trim(club_actuel) from public.players
where club_actuel is not null and length(trim(club_actuel)) > 0
on conflict (nom) do nothing;

insert into public.clubs (nom)
select distinct trim(club_precedent) from public.players
where club_precedent is not null and length(trim(club_precedent)) > 0
on conflict (nom) do nothing;

-- Amorçage : clubs déjà présents dans l'annuaire texte-libre (si la
-- migration 0006 a déjà été appliquée avant celle-ci).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'club_contacts' and column_name = 'club'
  ) then
    insert into public.clubs (nom)
    select distinct club from public.club_contacts
    on conflict (nom) do nothing;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'club_activity' and column_name = 'club'
  ) then
    insert into public.clubs (nom)
    select distinct club from public.club_activity
    on conflict (nom) do nothing;
  end if;
end $$;

alter table public.clubs enable row level security;

drop policy if exists "clubs_select" on public.clubs;
create policy "clubs_select" on public.clubs
  for select to authenticated using (public.is_agent());

drop policy if exists "clubs_write" on public.clubs;
create policy "clubs_write" on public.clubs
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));

-- =====================================================================
-- club_contacts : bascule club (texte) -> club_id (FK vers clubs)
-- =====================================================================
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

alter table public.club_contacts add column if not exists club_id uuid references public.clubs(id) on delete cascade;
update public.club_contacts cc set club_id = c.id
  from public.clubs c where cc.club_id is null and cc.club = c.nom;
alter table public.club_contacts alter column club_id set not null;
alter table public.club_contacts drop column if exists club;
create index if not exists club_contacts_club_id_idx on public.club_contacts(club_id);

alter table public.club_contacts enable row level security;

drop policy if exists "club_contacts_select" on public.club_contacts;
create policy "club_contacts_select" on public.club_contacts
  for select to authenticated using (public.is_agent());

drop policy if exists "club_contacts_write" on public.club_contacts;
create policy "club_contacts_write" on public.club_contacts
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));

-- =====================================================================
-- club_activity : bascule club (texte) -> club_id (FK) + updated_at
-- (permet de modifier une note déjà publiée)
-- =====================================================================
create table if not exists public.club_activity (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  note text not null,
  agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.club_activity add column if not exists club_id uuid references public.clubs(id) on delete cascade;
update public.club_activity ca set club_id = c.id
  from public.clubs c where ca.club_id is null and ca.club = c.nom;
alter table public.club_activity alter column club_id set not null;
alter table public.club_activity drop column if exists club;
alter table public.club_activity add column if not exists updated_at timestamptz;
create index if not exists club_activity_club_id_idx on public.club_activity(club_id);
create index if not exists club_activity_created_at_idx on public.club_activity(created_at desc);

alter table public.club_activity enable row level security;

drop policy if exists "club_activity_select" on public.club_activity;
create policy "club_activity_select" on public.club_activity
  for select to authenticated using (public.is_agent());

drop policy if exists "club_activity_write" on public.club_activity;
create policy "club_activity_write" on public.club_activity
  for all to authenticated
  using (public.is_admin() or public.has_perm('edit_players'))
  with check (public.is_admin() or public.has_perm('edit_players'));
