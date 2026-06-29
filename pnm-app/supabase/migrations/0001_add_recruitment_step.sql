-- =====================================================================
-- Migration : Tunnel de recrutement (recruitment_step)
-- Additive et idempotente — sans risque pour la prod (aucune table/colonne
-- existante n'est modifiée de façon destructive). À exécuter une fois dans
-- le SQL Editor du projet Supabase PNM.
-- =====================================================================

-- 1) Enum des étapes du tunnel
do $$ begin
  create type public.recruitment_step as enum (
    'premiere_observation',
    'contre_observation',
    'observation_decisive',
    'veille',
    'prise_contact',
    'rdv1',
    'reflexion',
    'rdv2',
    'accepte',
    'ne_pas_suivre'
  );
exception when duplicate_object then null; end $$;

-- 2) Colonne sur players (défaut : 1ère observation)
alter table public.players
  add column if not exists recruitment_step public.recruitment_step
  not null default 'premiere_observation';

create index if not exists players_recruitment_step_idx
  on public.players(recruitment_step);

-- 3) Backfill depuis le statut existant : les joueurs signés -> "Accepté"
--    (les prospects restent en "1ère observation" par défaut)
update public.players
   set recruitment_step = 'accepte'
 where statut = 'joueur'
   and recruitment_step = 'premiere_observation';
